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

            if (!$subscription) {
                throw new Exception('Subscription not found for transaction');
            }

            $user = $subscription->user;
            $template = $subscription->template;

            if (!$user) {
                throw new Exception('User not found for subscription');
            }

            if (!$template) {
                throw new Exception('Template not found for subscription');
            }

            if (!$transaction->midtrans_order_id) {
                throw new Exception('Order ID not set for transaction');
            }

            if (!$transaction->amount || $transaction->amount <= 0) {
                throw new Exception('Invalid transaction amount: ' . $transaction->amount);
            }

            // Ensure amount is integer for Midtrans API
            $amount = (int) round($transaction->amount);

            $transactionDetails = [
                'order_id' => $transaction->midtrans_order_id,
                'gross_amount' => $amount,
            ];

            $customerDetails = [
                'first_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ];

            $itemDetails = [
                [
                    'id' => (string) $template->id,
                    'price' => $amount,
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

            \Log::debug('Midtrans Snap Token Request Payload', [
                'order_id' => $transaction->midtrans_order_id,
                'amount' => $amount,
                'user_email' => $user->email,
                'payload_keys' => array_keys($payload),
                'config_keys' => [
                    'server_key' => substr(Config::$serverKey, 0, 20) . '...',
                    'client_key' => substr(Config::$clientKey, 0, 20) . '...',
                    'is_production' => Config::$isProduction,
                ]
            ]);

            try {
                $snapToken = Snap::getSnapToken($payload);
            } catch (\Exception $e) {
                \Log::error('Snap::getSnapToken threw exception', [
                    'error' => $e->getMessage(),
                    'class' => get_class($e),
                    'trace' => $e->getTraceAsString(),
                ]);
                throw $e;
            }

            \Log::info('Snap::getSnapToken returned', [
                'snap_token_type' => gettype($snapToken),
                'snap_token_length' => is_string($snapToken) ? strlen($snapToken) : 0,
                'snap_token_preview' => is_string($snapToken) ? substr($snapToken, 0, 50) : 'NOT_STRING',
                'snap_token_empty' => empty($snapToken),
            ]);

            if (empty($snapToken)) {
                throw new Exception('Snap token is empty from Midtrans API (returned: ' . gettype($snapToken) . ')');
            }

            \Log::info('Midtrans Snap Token Created Successfully', [
                'order_id' => $transaction->midtrans_order_id,
                'token_length' => strlen($snapToken),
                'token_preview' => substr($snapToken, 0, 30) . '...',
            ]);

            // Ensure snap_token is a string, not an array or object
            $tokenValue = is_array($snapToken) ? ($snapToken['token'] ?? null) : $snapToken;

            if (!is_string($tokenValue) || empty($tokenValue)) {
                \Log::error('Snap token is not a valid string after conversion', [
                    'original_type' => gettype($snapToken),
                    'original_value' => json_encode($snapToken),
                    'converted_type' => gettype($tokenValue),
                    'converted_value' => $tokenValue,
                ]);
                throw new Exception('Snap token format is invalid');
            }

            return [
                'snap_token' => $tokenValue,
                'order_id' => $transaction->midtrans_order_id,
            ];
        } catch (Exception $e) {
            \Log::error('Midtrans Snap Token Creation Failed', [
                'error' => $e->getMessage(),
                'order_id' => $transaction->midtrans_order_id ?? 'unknown',
                'trace' => $e->getTraceAsString(),
            ]);
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
