<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\Subscription;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class OrderController extends Controller
{
    public function create(Request $request)
    {
        $templates = Template::where('is_active', true)->get();
        return Inertia::render('Order/Create', [
            'templates' => $templates,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'subdomain' => 'required|string|regex:/^[a-z0-9-]+$/|unique:subscriptions',
        ]);

        $template = Template::findOrFail($validated['template_id']);

        if (!$template->is_active) {
            return response()->json(['subdomain' => 'Template tidak tersedia.'], 422);
        }

        // Check if subdomain already exists
        if (Subscription::where('subdomain', $validated['subdomain'])->exists()) {
            return response()->json(['subdomain' => 'Subdomain sudah digunakan.'], 422);
        }

        // Create subscription in pending status
        $subscription = Subscription::create([
            'user_id' => $request->user()->id,
            'template_id' => $validated['template_id'],
            'subdomain' => $validated['subdomain'],
            'status' => 'pending',
        ]);

        // Create empty invitation data
        \App\Models\InvitationData::create([
            'subscription_id' => $subscription->id,
        ]);

        // Create transaction untuk pembayaran
        $midtransOrderId = 'ORDER-' . $subscription->id . '-' . time();
        \App\Models\Transaction::create([
            'subscription_id' => $subscription->id,
            'midtrans_order_id' => $midtransOrderId,
            'amount' => $template->price,
            'status' => 'pending',
            'payment_method' => 'midtrans',
        ]);

        return response()->json([
            'subscription_id' => $subscription->id,
            'amount' => $template->price,
            'client_key' => config('services.midtrans.client_key'),
            'is_sandbox' => config('services.midtrans.is_production') == false,
        ]);
    }
}
