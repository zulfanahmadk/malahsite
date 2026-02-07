<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Transaction;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentController extends Controller
{
    /**
     * Show payment processing page
     */
    public function process(Request $request)
    {
        $subscriptionId = $request->query('subscription_id');

        if (!$subscriptionId) {
            return redirect('/dashboard')->with('error', 'Subscription not found');
        }

        return Inertia::render('Payment/Process', [
            'subscriptionId' => $subscriptionId,
        ]);
    }

    /**
     * Initiate Midtrans payment (API)
     */
    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $subscription = Subscription::findOrFail($validated['subscription_id']);
        $this->authorize('update', $subscription);

        // Check if subscription is pending
        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Subscription is not pending',
            ], 422);
        }

        // Get or create transaction
        $transaction = $subscription->transactions()
            ->where('status', 'pending')
            ->latest()
            ->first();

        if (!$transaction) {
            return response()->json([
                'message' => 'No pending transaction found',
            ], 404);
        }

        try {
            $midtransService = new MidtransService();
            $snapToken = $midtransService->createSnapToken($transaction);

            return response()->json([
                'snap_token' => $snapToken['snap_token'],
                'order_id' => $snapToken['order_id'],
                'subscription' => $subscription,
                'transaction' => $transaction,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Midtrans webhook handler
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        // Verify Midtrans signature
        $serverKey = config('services.midtrans.server_key');
        $orderId = $payload['order_id'] ?? null;
        $statusCode = $payload['status_code'] ?? null;
        $grossAmount = $payload['gross_amount'] ?? null;
        $signature = $payload['signature_key'] ?? null;

        if (!MidtransService::verifyWebhook($serverKey, $orderId, $statusCode, $grossAmount, $signature)) {
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        $transaction = Transaction::where('midtrans_order_id', $orderId)->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // Update transaction based on payment status
        $transactionStatus = $payload['transaction_status'] ?? null;

        switch ($transactionStatus) {
            case 'settlement':
            case 'capture':
                $transaction->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payload' => $payload,
                    'payment_method' => $payload['payment_type'] ?? null,
                ]);

                // Activate subscription
                $transaction->subscription->update([
                    'status' => 'active',
                    'activated_at' => now(),
                ]);
                break;

            case 'pending':
                $transaction->update([
                    'status' => 'pending',
                    'payload' => $payload,
                ]);
                break;

            case 'deny':
            case 'expire':
            case 'cancel':
                $transaction->update([
                    'status' => 'failed',
                    'payload' => $payload,
                ]);
                break;
        }

        return response()->json(['status' => 'ok']);
    }

    /**
     * Payment success callback
     */
    public function finish(Request $request)
    {
        return redirect('/dashboard')->with('success', 'Payment processed successfully');
    }

    /**
     * Payment error callback
     */
    public function error(Request $request)
    {
        return redirect('/dashboard')->with('error', 'Payment failed');
    }

    /**
     * Payment pending callback
     */
    public function pending(Request $request)
    {
        return redirect('/dashboard')->with('info', 'Payment pending');
    }
}
