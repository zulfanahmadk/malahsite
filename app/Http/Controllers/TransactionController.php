<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Initiate payment for a subscription
     */
    public function initiate(Request $request)
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
        ]);

        $subscription = Subscription::findOrFail($validated['subscription_id']);

        $this->authorize('update', $subscription);

        if ($subscription->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending subscriptions can be paid',
            ], 422);
        }

        // Generate unique order ID for Midtrans
        $orderId = 'ORDER-' . $subscription->id . '-' . time();

        // Create transaction record
        $transaction = Transaction::create([
            'subscription_id' => $subscription->id,
            'midtrans_order_id' => $orderId,
            'amount' => $subscription->template->price,
            'status' => 'pending',
        ]);

        // Here you would initiate Midtrans payment
        // For now, return the transaction details
        return response()->json([
            'transaction' => $transaction,
            'order_id' => $orderId,
            'amount' => $subscription->template->price,
            'message' => 'Ready for payment - integrate with Midtrans Snap here',
        ]);
    }

    /**
     * Webhook handler for Midtrans payment notifications
     */
    public function webhook(Request $request)
    {
        $payload = $request->all();

        // Verify signature (implement Midtrans signature verification)
        // This is crucial for security

        $orderId = $payload['order_id'] ?? null;
        $status = $payload['transaction_status'] ?? null;

        if (!$orderId || !$status) {
            return response()->json(['message' => 'Invalid payload'], 400);
        }

        $transaction = Transaction::where('midtrans_order_id', $orderId)->first();

        if (!$transaction) {
            return response()->json(['message' => 'Transaction not found'], 404);
        }

        // Update transaction status based on Midtrans response
        switch ($status) {
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
     * Get transaction details
     */
    public function show(Transaction $transaction)
    {
        $this->authorize('view', $transaction->subscription);

        return response()->json($transaction);
    }

    /**
     * Get user's transactions
     */
    public function userTransactions(Request $request)
    {
        $transactions = Transaction::whereHas('subscription', function ($query) {
            $query->where('user_id', auth()->id());
        })->with(['subscription.template'])->get();

        return response()->json($transactions);
    }
}
