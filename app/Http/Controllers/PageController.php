<?php

namespace App\Http\Controllers;

use App\Models\Template;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function welcome()
    {
        $templates = Template::where('is_active', true)->get();
        return Inertia::render('Welcome', [
            'templates' => $templates,
        ]);
    }

    public function login()
    {
        return Inertia::render('Login');
    }

    public function register()
    {
        return Inertia::render('Register');
    }

    public function dashboard(Request $request)
    {
        $user = $request->user();
        if (!$user || $user->user_type === 'admin') {
            return redirect('/');
        }

        $subscriptions = $user->subscriptions()
            ->with(['template'])
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Dashboard/Index', [
            'subscriptions' => $subscriptions,
        ]);
    }

    public function subscriptionDetail(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || $user->user_type === 'admin') {
            return redirect('/');
        }

        $subscription = \App\Models\Subscription::with(['template', 'invitationData.galleryPhotos'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $invitationData = $subscription->invitationData;

        \Log::info('subscriptionDetail loaded', [
            'subscription_id' => $subscription->id,
            'has_invitation_data' => !!$invitationData,
            'invitation_data_id' => $invitationData?->id,
            'invitation_data_values' => $invitationData ? $invitationData->toArray() : null,
            'gallery_photos_count' => $invitationData?->galleryPhotos?->count() ?? 0,
        ]);

        // Ensure we return the invitation data with all fields
        // Explicitly convert to array to ensure proper JSON serialization
        $invitationArray = null;
        if ($invitationData) {
            $invitationArray = [
                'id' => $invitationData->id,
                'subscription_id' => $invitationData->subscription_id,
                'bride_name' => $invitationData->bride_name,
                'groom_name' => $invitationData->groom_name,
                'bride_father_name' => $invitationData->bride_father_name,
                'bride_mother_name' => $invitationData->bride_mother_name,
                'groom_father_name' => $invitationData->groom_father_name,
                'groom_mother_name' => $invitationData->groom_mother_name,
                'event_date' => $invitationData->event_date ? $invitationData->event_date->format('Y-m-d') : null,
                'ceremony_time' => $invitationData->ceremony_time,
                'ceremony_location' => $invitationData->ceremony_location,
                'reception_location' => $invitationData->reception_location,
                'reception_google_maps_link' => $invitationData->reception_google_maps_link,
                'love_story' => $invitationData->love_story,
                'photo_gallery' => $invitationData->photo_gallery,
                'wedding_info' => $invitationData->wedding_info,
                'gallery_photos' => $invitationData->galleryPhotos ? $invitationData->galleryPhotos->map(function ($photo) {
                    return [
                        'id' => $photo->id,
                        'photo_path' => $photo->photo_path,
                        'order' => $photo->order,
                    ];
                })->toArray() : [],
                'created_at' => $invitationData->created_at ? $invitationData->created_at->toDateTimeString() : null,
                'updated_at' => $invitationData->updated_at ? $invitationData->updated_at->toDateTimeString() : null,
            ];
        }

        return Inertia::render('Dashboard/Subscription', [
            'subscription' => $subscription,
            'invitation' => $invitationArray,
        ]);
    }
}
