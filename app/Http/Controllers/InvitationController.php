<?php

namespace App\Http\Controllers;

use App\Models\InvitationData;
use App\Models\Subscription;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    /**
     * Get invitation data for a subscription
     */
    public function show(Subscription $subscription)
    {
        $this->authorize('view', $subscription);

        return response()->json(
            $subscription->invitationData ?? new InvitationData()
        );
    }

    /**
     * Create or update invitation data
     */
    public function update(Request $request, Subscription $subscription)
    {
        $this->authorize('update', $subscription);

        if ($subscription->status !== 'active') {
            return response()->json([
                'message' => 'Only active subscriptions can have their invitation updated',
            ], 422);
        }

        $validated = $request->validate([
            'bride_name' => 'nullable|string|max:255',
            'groom_name' => 'nullable|string|max:255',
            'bride_father_name' => 'nullable|string|max:255',
            'bride_mother_name' => 'nullable|string|max:255',
            'groom_father_name' => 'nullable|string|max:255',
            'groom_mother_name' => 'nullable|string|max:255',
            'event_date' => 'nullable|date',
            'ceremony_time' => 'nullable|date_format:H:i',
            'ceremony_location' => 'nullable|string',
            'reception_location' => 'nullable|string',
            'reception_google_maps_link' => 'nullable|url',
            'love_story' => 'nullable|string',
            'photo_gallery' => 'nullable|array',
            'wedding_info' => 'nullable|array',
        ]);

        $invitationData = $subscription->invitationData ?? new InvitationData();
        $invitationData->subscription_id = $subscription->id;
        $invitationData->fill($validated);
        $invitationData->save();

        return response()->json($invitationData);
    }

    /**
     * Get invitation public preview (by subdomain)
     */
    public function preview($subdomain)
    {
        $subscription = Subscription::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->with(['template', 'invitationData'])
            ->first();

        if (!$subscription || !$subscription->invitationData) {
            return response()->json(['message' => 'Invitation not found'], 404);
        }

        return response()->json([
            'invitation' => $subscription->invitationData,
            'template' => $subscription->template,
            'subdomain' => $subdomain,
        ]);
    }
}
