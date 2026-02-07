<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
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
