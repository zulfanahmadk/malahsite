<?php

namespace App\Http\Controllers;

use App\Models\InvitationData;
use App\Models\Subscription;
use Illuminate\Http\Request;

class DebugController extends Controller
{
    /**
     * Check invitation data in database
     */
    public function checkInvitation(Request $request, $subscriptionId)
    {
        $subscription = Subscription::with(['invitationData.galleryPhotos', 'user'])->find($subscriptionId);

        if (!$subscription) {
            return response()->json(['error' => 'Subscription not found'], 404);
        }

        // Check authorization
        if ($request->user()->id !== $subscription->user_id && !$request->user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'subscription' => [
                'id' => $subscription->id,
                'user_id' => $subscription->user_id,
                'status' => $subscription->status,
                'created_at' => $subscription->created_at,
                'updated_at' => $subscription->updated_at,
            ],
            'invitation_data' => $subscription->invitationData ? [
                'id' => $subscription->invitationData->id,
                'subscription_id' => $subscription->invitationData->subscription_id,
                'bride_name' => $subscription->invitationData->bride_name,
                'groom_name' => $subscription->invitationData->groom_name,
                'event_date' => $subscription->invitationData->event_date,
                'ceremony_time' => $subscription->invitationData->ceremony_time,
                'ceremony_location' => $subscription->invitationData->ceremony_location,
                'reception_location' => $subscription->invitationData->reception_location,
                'wedding_info' => $subscription->invitationData->wedding_info,
                'love_story' => $subscription->invitationData->love_story,
                'created_at' => $subscription->invitationData->created_at,
                'updated_at' => $subscription->invitationData->updated_at,
            ] : null,
            'gallery_photos_count' => $subscription->invitationData ? $subscription->invitationData->galleryPhotos->count() : 0,
            'gallery_photos' => $subscription->invitationData ? $subscription->invitationData->galleryPhotos->map(function ($photo) {
                return [
                    'id' => $photo->id,
                    'photo_path' => $photo->photo_path,
                    'order' => $photo->order,
                ];
            }) : [],
        ]);
    }
}
