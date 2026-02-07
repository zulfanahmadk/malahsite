<?php

namespace App\Services;

use App\Models\Transaction;
use Midtrans\Config;
use Midtrans\Snap;
use Exception;

class MidtransService
{
    public function __construct()
    {
        // Set Midtrans configuration
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$clientKey = config('services.midtrans.client_key');
        Config::$isProduction = config('services.midtrans.is_production', false);
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    /**
     * Create payment token for Midtrans Snap
     */
    public function createSnapToken(Transaction $transaction)
    {
        try {
            $subscription = $transaction->subscription;
            $user = $subscription->user;
            $template = $subscription->template;

            $transactionDetails = [
                'order_id' => $transaction->midtrans_order_id,
                'gross_amount' => (int) $transaction->amount,
            ];

            $customerDetails = [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ];

            $itemDetails = [
                [
                    'id' => $template->id,
                    'price' => (int) $template->price,
                    'quantity' => 1,
                    'name' => $template->name,
                ],
            ];

            $payload = [
                'transaction_details' => $transactionDetails,
                'customer_details' => $customerDetails,
                'item_details' => $itemDetails,
                'callbacks' => [
                    'finish' => route('payment.finish'),
                    'error' => route('payment.error'),
                    'pending' => route('payment.pending'),
                ],
            ];

            $snapToken = Snap::getSnapToken($payload);

            return [
                'snap_token' => $snapToken,
                'order_id' => $transaction->midtrans_order_id,
            ];
        } catch (Exception $e) {
            throw new Exception('Failed to create Midtrans snap token: ' . $e->getMessage());
        }
    }

    /**
     * Verify payment from webhook
     */
    public static function verifyWebhook($serverKey, $orderId, $statusCode, $grossAmount, $signatureKey)
    {
        $input = $orderId . $statusCode . $grossAmount . $serverKey;
        $hash = hash('sha512', $input);

        return hash_equals($hash, $signatureKey);
    }
}
