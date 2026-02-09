<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Transaction;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Tampilkan halaman proses pembayaran dengan Snap Token langsung.
     */
    public function process(Request $request)
    {
        $subscriptionId = $request->query('subscription_id');

        if (!$subscriptionId) {
            return redirect()->route('dashboard')->with('error', 'Pesanan tidak ditemukan.');
        }

        $subscription = Subscription::with(['template', 'transactions' => function($q) {
            $q->where('status', 'pending')->latest();
        }])->findOrFail($subscriptionId);

        // Pastikan kepemilikan
        if ($subscription->user_id !== auth()->id()) {
            abort(403);
        }

        // Ambil transaksi pending atau buat baru jika belum ada
        $transaction = $subscription->transactions->first();

        if (!$transaction) {
            Log::warning("Transaction not found for subscription: $subscriptionId");
            return redirect()->route('dashboard')->with('error', 'Transaksi tidak ditemukan.');
        }

        try {
            // Check if Midtrans is configured
            if (!config('services.midtrans.server_key') || !config('services.midtrans.client_key')) {
                Log::error('Midtrans configuration is missing');
                return redirect()->route('dashboard')->with('error', 'Konfigurasi pembayaran belum diatur. Hubungi administrator.');
            }

            return Inertia::render('Payment/Process', [
                'subscriptionId' => $subscriptionId,
                'clientKey' => config('services.midtrans.client_key'),
                'isSandbox' => config('services.midtrans.is_production') == false,
                'amount' => $transaction->amount,
                'template' => $subscription->template,
            ]);
        } catch (\Exception $e) {
            Log::error('Midtrans Error: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->route('dashboard')->with('error', 'Gagal menghubungkan ke layanan pembayaran: ' . $e->getMessage());
        }
    }

    /**
     * API endpoint untuk request Snap Token dari Midtrans
     */
    public function charge(Request $request)
    {
        Log::info('charge() endpoint called', [
            'method' => $request->getMethod(),
            'content_type' => $request->header('Content-Type'),
            'accept' => $request->header('Accept'),
            'user_id' => auth()->id(),
            'path' => $request->getPathInfo(),
        ]);

        try {
            // Check Midtrans configuration first
            if (!config('services.midtrans.server_key') || !config('services.midtrans.client_key')) {
                Log::error('Midtrans configuration is missing');
                return response()->json([
                    'error' => 'Konfigurasi pembayaran belum diatur. Hubungi administrator.'
                ], 500, ['X-Requested-With' => 'XMLHttpRequest']);
            }

            $subscriptionId = $request->input('subscription_id');
            Log::info('charge() received subscription_id', ['subscription_id' => $subscriptionId]);

            if (!$subscriptionId) {
                Log::warning('charge() called without subscription_id');
                return response()->json([
                    'error' => 'Subscription ID required'
                ], 400, ['X-Requested-With' => 'XMLHttpRequest']);
            }

            $subscription = Subscription::with(['user', 'template', 'transactions'])->findOrFail($subscriptionId);

            // Verify ownership
            if ($subscription->user_id !== auth()->id()) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get latest transaction
            $transaction = $subscription->transactions()->latest()->first();

            if (!$transaction) {
                Log::error('No transaction found for subscription', [
                    'subscription_id' => $subscriptionId,
                ]);
                return response()->json(['error' => 'No transaction found'], 404);
            }

            if ($transaction->status !== 'pending') {
                Log::warning('Transaction is not pending', [
                    'subscription_id' => $subscriptionId,
                    'transaction_id' => $transaction->id,
                    'transaction_status' => $transaction->status,
                ]);
                return response()->json(['error' => 'Transaction is not in pending status: ' . $transaction->status], 400);
            }

            Log::info("Charge request for subscription", [
                'subscription_id' => $subscriptionId,
                'transaction_id' => $transaction->id,
                'midtrans_order_id' => $transaction->midtrans_order_id,
            ]);

            try {
                Log::info("Creating snap token for transaction", [
                'transaction_id' => $transaction->id,
                'order_id' => $transaction->midtrans_order_id,
                'amount' => $transaction->amount,
                'subscription_id' => $subscription->id,
                'has_existing_token' => !!$transaction->snap_token,
            ]);

            // Check if we already have a snap token for this transaction
            $snapToken = $transaction->snap_token;

            if (!$snapToken) {
                // Create new snap token
                $midtransService = new MidtransService();
                $snapData = $midtransService->createSnapToken($transaction);

                Log::info("Midtrans snap token response", [
                    'order_id' => $transaction->midtrans_order_id,
                    'response_keys' => array_keys($snapData),
                    'snap_token_type' => gettype($snapData['snap_token'] ?? null),
                    'snap_token_length' => strlen($snapData['snap_token'] ?? ''),
                ]);

                // Validate snap token was created
                if (empty($snapData['snap_token'])) {
                    Log::error('Midtrans returned empty snap token', [
                        'order_id' => $transaction->midtrans_order_id,
                        'snap_data' => json_encode($snapData),
                    ]);
                    return response()->json([
                        'error' => 'Gagal membuat token pembayaran dari Midtrans (empty token)',
                        'debug' => [
                            'snap_data_keys' => array_keys($snapData),
                        ]
                    ], 500);
                }

                $snapToken = $snapData['snap_token'];

                // Store snap token in transaction for future reuse
                $transaction->update(['snap_token' => $snapToken]);

                Log::info("Midtrans Snap created and stored", [
                    'order_id' => $transaction->midtrans_order_id,
                    'snap_token_length' => strlen($snapToken),
                    'snap_token_preview' => substr($snapToken, 0, 30),
                ]);
            } else {
                Log::info("Reusing existing snap token", [
                    'order_id' => $transaction->midtrans_order_id,
                    'snap_token_preview' => substr($snapToken, 0, 30),
                ]);
            }

            $response = [
                'order_id' => $transaction->midtrans_order_id,
                'snap_token' => $snapToken,
                'redirect_url' => route('payment.process', ['subscription_id' => $subscriptionId]),
                'amount' => $transaction->amount,
            ];

                Log::info("Returning snap token to frontend", [
                    'response' => $response,
                    'response_keys' => array_keys($response),
                    'snap_token_present' => isset($response['snap_token']),
                    'snap_token_empty' => empty($response['snap_token']),
                    'snap_token_type' => gettype($response['snap_token']),
                    'snap_token_length' => strlen($response['snap_token'] ?? ''),
                ]);

                return response()->json($response, 200, ['Content-Type' => 'application/json']);
            } catch (\Exception $e) {
                Log::error('Midtrans error creating snap token', [
                    'error' => $e->getMessage(),
                    'order_id' => $transaction->midtrans_order_id ?? 'unknown',
                    'trace' => $e->getTraceAsString(),
                ]);
                return response()->json([
                    'error' => 'Gagal membuat token pembayaran: ' . $e->getMessage(),
                    'debug' => [
                        'exception_class' => get_class($e),
                    ]
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error("Error in charge endpoint", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Server error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Midtrans webhook handler (Dipanggil oleh Server Midtrans, bukan Browser)
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();
        $serverKey = config('services.midtrans.server_key');

        Log::info('Midtrans Webhook RECEIVED', [
            'order_id' => $payload['order_id'] ?? null,
            'transaction_status' => $payload['transaction_status'] ?? null,
            'status_code' => $payload['status_code'] ?? null,
            'gross_amount' => $payload['gross_amount'] ?? null,
            'payment_type' => $payload['payment_type'] ?? null,
            'timestamp' => now()->toIso8601String(),
        ]);

        // Verifikasi Signature (Penting!)
        if (!$serverKey) {
            Log::error('Midtrans server key not configured');
            return response()->json(['message' => 'Server misconfigured'], 500);
        }

        $signature = hash("sha512", $payload['order_id'] . $payload['status_code'] . $payload['gross_amount'] . $serverKey);

        if ($signature !== $payload['signature_key']) {
            Log::warning('Midtrans Webhook signature MISMATCH', [
                'order_id' => $payload['order_id'] ?? null,
                'expected' => $signature,
                'received' => $payload['signature_key'] ?? null,
                'payload' => $payload,
            ]);
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        Log::info('Midtrans Webhook signature VALID', [
            'order_id' => $payload['order_id'] ?? null,
        ]);

        $transaction = Transaction::where('midtrans_order_id', $payload['order_id'])->first();

        if (!$transaction) {
            Log::warning('Transaction not found for order', ['order_id' => $payload['order_id'] ?? null]);
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        $status = $payload['transaction_status'];
        Log::info('Processing webhook for transaction', [
            'transaction_id' => $transaction->id,
            'order_id' => $payload['order_id'],
            'status' => $status,
        ]);

        if ($status == 'settlement' || $status == 'capture') {
            $transaction->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => $payload['payment_type'],
            ]);

            $transaction->subscription->update([
                'status' => 'active',
                'activated_at' => now(),
            ]);

            Log::info('Transaction marked as paid', [
                'transaction_id' => $transaction->id,
                'subscription_id' => $transaction->subscription_id,
            ]);
        } elseif (in_array($status, ['deny', 'expire', 'cancel'])) {
            $transaction->update(['status' => 'failed']);
            Log::info('Transaction marked as failed', [
                'transaction_id' => $transaction->id,
                'reason' => $status,
            ]);
        } else {
            Log::info('Transaction status not handled', [
                'transaction_id' => $transaction->id,
                'status' => $status,
            ]);
        }

        return response()->json(['status' => 'success']);
    }

    // Callback untuk redirect dari Midtrans Snap
    public function finish(Request $request) {
        $subscriptionId = $request->query('subscription_id');

        Log::info("Payment finish endpoint called", [
            'subscription_id' => $subscriptionId,
        ]);

        if (!$subscriptionId) {
            return redirect()->route('dashboard')->with('error', 'Subscription ID tidak ditemukan.');
        }

        return Inertia::render('Payment/Finish', [
            'subscriptionId' => $subscriptionId,
            'message' => 'Memeriksa status pembayaran dengan server Midtrans...',
        ]);
    }

    /**
     * API endpoint untuk check subscription status (digunakan oleh frontend polling)
     */
    public function checkSubscriptionStatus($id)
    {
        try {
            // Fetch fresh data from DB
            $subscription = Subscription::with('transactions')->findOrFail($id);

            // Verify ownership
            if ($subscription->user_id !== auth()->id()) {
                Log::warning("Unauthorized subscription status check", [
                    'subscription_id' => $id,
                    'user_id' => auth()->id(),
                ]);
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            Log::info("Checking subscription status", [
                'subscription_id' => $id,
                'current_status' => $subscription->status,
            ]);

            // Get latest transaction
            $transaction = $subscription->transactions()->latest()->first();

            if (!$transaction) {
                Log::warning("No transaction found for subscription", ['subscription_id' => $id]);
                return response()->json([
                    'subscription' => $subscription->only(['id', 'status']),
                    'message' => 'Transaksi tidak ditemukan',
                ]);
            }

            Log::info("Transaction found", [
                'transaction_id' => $transaction->id,
                'transaction_status' => $transaction->status,
                'midtrans_order_id' => $transaction->midtrans_order_id,
            ]);

            // If subscription not active yet, check transaction status
            if ($subscription->status !== 'active') {
                // Check from Midtrans if transaction is pending
                if ($transaction->status === 'pending') {
                    Log::info("Transaction pending, checking Midtrans API", [
                        'order_id' => $transaction->midtrans_order_id,
                    ]);

                    $statusData = $this->checkTransactionStatus($transaction->midtrans_order_id);

                    if ($statusData && isset($statusData['transaction_status'])) {
                        $transactionStatus = $statusData['transaction_status'];
                        Log::info("Midtrans API response", [
                            'midtrans_status' => $transactionStatus,
                            'order_id' => $transaction->midtrans_order_id,
                        ]);

                        if ($transactionStatus == 'settlement' || $transactionStatus == 'capture') {
                            // Update transaction
                            $transaction->update([
                                'status' => 'paid',
                                'paid_at' => now(),
                                'payment_method' => $statusData['payment_type'] ?? null,
                                'payload' => json_encode($statusData),
                            ]);

                            Log::info("Transaction updated to PAID", [
                                'transaction_id' => $transaction->id,
                                'midtrans_status' => $transactionStatus,
                            ]);

                            // Update subscription to active
                            $subscription->update([
                                'status' => 'active',
                                'activated_at' => now(),
                            ]);

                            Log::info("Subscription updated to ACTIVE", [
                                'subscription_id' => $subscription->id,
                            ]);

                            // Refresh models
                            $subscription->refresh();
                            $transaction->refresh();
                        } else {
                            Log::info("Midtrans status not ready yet", [
                                'status' => $transactionStatus,
                            ]);
                        }
                    } else {
                        Log::warning("Midtrans API failed to respond", [
                            'order_id' => $transaction->midtrans_order_id,
                        ]);
                    }
                } else if ($transaction->status === 'paid') {
                    // Transaction is paid but subscription not active - activate it
                    Log::info("Transaction paid but subscription not active - activating", [
                        'subscription_id' => $subscription->id,
                        'transaction_id' => $transaction->id,
                    ]);

                    $subscription->update([
                        'status' => 'active',
                        'activated_at' => now(),
                    ]);

                    $subscription->refresh();
                }
            }

            return response()->json([
                'subscription' => [
                    'id' => $subscription->id,
                    'status' => $subscription->status,
                ],
                'transaction' => [
                    'id' => $transaction->id,
                    'status' => $transaction->status,
                    'paid_at' => $transaction->paid_at,
                ],
                'message' => $subscription->status === 'active' ? 'Pembayaran berhasil!' : 'Menunggu pembayaran...',
                'debug' => [
                    'checked_at' => now()->toIso8601String(),
                    'subscription_status' => $subscription->status,
                    'transaction_status' => $transaction->status,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error("Error checking subscription status", [
                'subscription_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
                'debug' => [
                    'checked_at' => now()->toIso8601String(),
                ]
            ], 500);
        }
    }

    /**
     * Check transaction status from Midtrans API
     */
    private function checkTransactionStatus($orderId)
    {
        try {
            $serverKey = config('services.midtrans.server_key');

            if (!$serverKey) {
                Log::error("Midtrans server key not configured");
                return null;
            }

            $isProduction = config('services.midtrans.is_production', false);
            $url = $isProduction
                ? 'https://api.midtrans.com/v2/'
                : 'https://api.sandbox.midtrans.com/v2/';

            $fullUrl = $url . $orderId . '/status';

            Log::info("Checking Midtrans transaction status", [
                'order_id' => $orderId,
                'url' => $fullUrl,
            ]);

            $response = \Illuminate\Support\Facades\Http::withBasicAuth($serverKey, '')
                ->timeout(10)
                ->get($fullUrl);

            Log::info("Midtrans API response", [
                'status_code' => $response->status(),
                'body' => $response->body(),
            ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info("Transaction status received", [
                    'order_id' => $orderId,
                    'transaction_status' => $data['transaction_status'] ?? null,
                    'status_code' => $data['status_code'] ?? null,
                ]);
                return $data;
            }

            Log::warning("Midtrans API error checking status", [
                'order_id' => $orderId,
                'http_status' => $response->status(),
                'response' => $response->body(),
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error("Exception checking transaction status", [
                'order_id' => $orderId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    public function error(Request $request) {
        return redirect()->route('dashboard')->with('error', 'Pembayaran gagal diproses.');
    }

    public function pending(Request $request) {
        return redirect()->route('dashboard')->with('warning', 'Status pembayaran masih tertunda. Mohon tunggu.');
    }

    /**
     * Debug endpoint - check configuration
     */
    public function debug() {
        try {
            $hasServerKey = !!config('services.midtrans.server_key');
            $hasClientKey = !!config('services.midtrans.client_key');

            $userSubscription = Subscription::where('user_id', auth()->id())->first();
            $sample = null;
            $testResult = null;

            if ($userSubscription) {
                $sample = Transaction::where('subscription_id', $userSubscription->id)->first();

                // Try to create a snap token
                if ($sample && $sample->status === 'pending') {
                    try {
                        $midtransService = new MidtransService();
                        $snapData = $midtransService->createSnapToken($sample);
                        $testResult = [
                            'status' => 'success',
                            'snap_token_length' => strlen($snapData['snap_token'] ?? ''),
                            'snap_token_preview' => substr($snapData['snap_token'] ?? '', 0, 30) . '...',
                        ];
                    } catch (\Exception $e) {
                        $testResult = [
                            'status' => 'error',
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString(),
                        ];
                    }
                }
            }

            return response()->json([
                'config' => [
                    'has_server_key' => $hasServerKey,
                    'has_client_key' => $hasClientKey,
                    'is_production' => config('services.midtrans.is_production', false),
                    'server_key_preview' => $hasServerKey ? substr(config('services.midtrans.server_key'), 0, 20) . '...' : 'MISSING',
                    'client_key_preview' => $hasClientKey ? substr(config('services.midtrans.client_key'), 0, 20) . '...' : 'MISSING',
                ],
                'user' => [
                    'id' => auth()->id(),
                    'email' => auth()->user()?->email,
                ],
                'subscriptions' => Subscription::where('user_id', auth()->id())->count(),
                'sample_transaction' => $sample ? [
                    'id' => $sample->id,
                    'order_id' => $sample->midtrans_order_id,
                    'amount' => $sample->amount,
                    'status' => $sample->status,
                ] : 'No transactions found',
                'snap_token_test' => $testResult,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }
}
