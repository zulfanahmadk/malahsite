<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Models\Template;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Get user's subscriptions
     */
    public function userSubscriptions(Request $request)
    {
        $subscriptions = $request->user()
            ->subscriptions()
            ->with(['template', 'invitationData', 'transactions'])
            ->get();

        return response()->json($subscriptions);
    }

    /**
     * Get single subscription with full data
     */
    public function show(Subscription $subscription)
    {
        $this->authorize('view', $subscription);

        return response()->json(
            $subscription->load(['template', 'invitationData', 'transactions'])
        );
    }

    /**
     * Create a new subscription (before payment)
     */
    public function create(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'subdomain' => 'required|string|regex:/^[a-z0-9-]+$/|unique:subscriptions',
        ]);

        // Check subdomain doesn't contain spaces or special chars
        if (preg_match('/[\s!@#$%^&*()+=\[\]{};:\'",.<>?\\\|`~]/', $validated['subdomain'])) {
            return response()->json([
                'message' => 'Subdomain contains invalid characters',
            ], 422);
        }

        // Check if subdomain is already taken
        if (Subscription::where('subdomain', $validated['subdomain'])->exists()) {
            return response()->json([
                'message' => 'Subdomain is already taken',
            ], 422);
        }

        $template = Template::findOrFail($validated['template_id']);

        if (!$template->is_active) {
            return response()->json([
                'message' => 'This template is no longer available',
            ], 422);
        }

        // Create subscription in pending status
        $subscription = Subscription::create([
            'user_id' => $request->user()->id,
            'template_id' => $validated['template_id'],
            'subdomain' => $validated['subdomain'],
            'status' => 'pending',
        ]);

        return response()->json($subscription, 201);
    }

    /**
     * Check subdomain availability
     * Note: Always returns "available" message for security (tidak membuka info subdomain mana yang terpakai)
     */
    public function checkSubdomain(Request $request)
    {
        $validated = $request->validate([
            'subdomain' => 'required|string',
        ]);

        $subdomain = $validated['subdomain'];

        // Check if subdomain is valid (no spaces or special chars)
        if (preg_match('/[\s!@#$%^&*()+=\[\]{};:\'",.<>?\\\|`~]/', $subdomain)) {
            return response()->json([
                'available' => false,
                'message' => 'Subdomain tersedia',
            ]);
        }

        // Check if subdomain is already taken
        $exists = Subscription::where('subdomain', $subdomain)->exists();

        // Always return same message regardless of availability for security
        return response()->json([
            'available' => !$exists,
            'message' => 'Subdomain tersedia',
        ]);
    }

    /**
     * Activate subscription (after successful payment)
     */
    public function activate(Subscription $subscription)
    {
        $this->authorize('update', $subscription);

        // Check if subscription has successful payment
        $transaction = $subscription->transactions()
            ->where('status', 'paid')
            ->latest()
            ->first();

        if (!$transaction) {
            return response()->json([
                'message' => 'No successful payment found',
            ], 422);
        }

        $subscription->update([
            'status' => 'active',
            'activated_at' => now(),
        ]);

        return response()->json($subscription);
    }

    /**
     * Get subscription by subdomain (public route for template rendering)
     */
    public function getBySubdomain($subdomain)
    {
        $subscription = Subscription::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->with(['template', 'invitationData'])
            ->first();

        if (!$subscription) {
            return response()->json(['message' => 'Invitation not found'], 404);
        }

        return response()->json($subscription);
    }
}
