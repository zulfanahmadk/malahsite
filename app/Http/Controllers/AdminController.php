<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Template;
use App\Models\Subscription;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics
     */
    public function stats(Request $request)
    {
        $this->authorize('isAdmin');

        $currentMonth = now()->startOfMonth();

        $stats = [
            'total_users' => User::where('user_type', 'user')->count(),
            'total_income_this_month' => Transaction::where('status', 'paid')
                ->where('paid_at', '>=', $currentMonth)
                ->sum('amount'),
            'active_subscriptions' => Subscription::where('status', 'active')
                ->where('expired_at', '>', now())
                ->count(),
            'pending_subscriptions' => Subscription::where('status', 'pending')->count(),
            'total_templates' => Template::count(),
            'total_transactions_this_month' => Transaction::where('status', 'paid')
                ->where('paid_at', '>=', $currentMonth)
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get all users with pagination
     */
    public function listUsers(Request $request)
    {
        $this->authorize('isAdmin');

        $users = User::where('user_type', 'user')
            ->with(['subscriptions' => function ($query) {
                $query->latest();
            }])
            ->paginate(20);

        return response()->json($users);
    }

    /**
     * Get user details
     */
    public function getUserDetail(User $user)
    {
        $this->authorize('isAdmin');

        if ($user->isAdmin()) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(
            $user->load(['subscriptions' => function ($query) {
                $query->with(['template', 'transactions', 'invitationData'])->latest();
            }])
        );
    }

    /**
     * Suspend a user
     */
    public function suspendUser(Request $request, User $user)
    {
        $this->authorize('isAdmin');

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot suspend admin users'], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string',
        ]);

        // Update user status and suspend active subscriptions
        $user->subscriptions()
            ->where('status', 'active')
            ->update(['status' => 'suspended']);

        // Log this action (implement logging as needed)

        return response()->json([
            'message' => 'User suspended successfully',
            'reason' => $validated['reason'] ?? null,
        ]);
    }

    /**
     * Get all templates with filters
     */
    public function listTemplates(Request $request)
    {
        $this->authorize('isAdmin');

        $templates = Template::paginate(20);

        return response()->json($templates);
    }

    /**
     * Store a new template
     */
    public function storeTemplate(Request $request)
    {
        $this->authorize('isAdmin');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_path' => 'required|string',
            'thumbnail_path' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'type' => 'required|in:wedding,booth',
            'category' => 'nullable|string',
            'demo_url' => 'nullable|url',
        ]);

        $template = Template::create($validated);

        return response()->json($template, 201);
    }

    /**
     * Get all transactions with filters
     */
    public function listTransactions(Request $request)
    {
        $this->authorize('isAdmin');

        $query = Transaction::with(['subscription.user', 'subscription.template']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->has('from_date') && $request->has('to_date')) {
            $from = Carbon::createFromFormat('Y-m-d', $request->from_date)->startOfDay();
            $to = Carbon::createFromFormat('Y-m-d', $request->to_date)->endOfDay();
            $query->whereBetween('created_at', [$from, $to]);
        }

        $transactions = $query->latest()->paginate(20);

        return response()->json($transactions);
    }

    /**
     * Get transaction details from Midtrans
     */
    public function getTransactionDetail(Transaction $transaction)
    {
        $this->authorize('isAdmin');

        return response()->json(
            $transaction->load(['subscription.user', 'subscription.template'])
        );
    }
}
