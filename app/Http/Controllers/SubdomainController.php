<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use Illuminate\Http\Request;

class SubdomainController extends Controller
{
    /**
     * Handle requests to subdomain invitations
     */
    public function show(Request $request, $subdomain)
    {
        // Get subscription by subdomain
        $subscription = Subscription::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->with(['template', 'invitationData', 'user'])
            ->first();

        if (!$subscription) {
            return response()->view('errors.404', [], 404);
        }

        // Check if invitation has required data
        if (!$subscription->invitationData) {
            return response()->view('errors.incomplete', [
                'message' => 'Invitation data not yet configured',
            ], 403);
        }

        // Render the template with invitation data
        return $this->renderTemplate($subscription);
    }

    /**
     * Render the template based on subscription
     */
    private function renderTemplate(Subscription $subscription)
    {
        $template = $subscription->template;
        $invitationData = $subscription->invitationData;

        // Prepare data for template
        $data = [
            'groom_name' => $invitationData->groom_name,
            'bride_name' => $invitationData->bride_name,
            'groom_father_name' => $invitationData->groom_father_name,
            'groom_mother_name' => $invitationData->groom_mother_name,
            'bride_father_name' => $invitationData->bride_father_name,
            'bride_mother_name' => $invitationData->bride_mother_name,
            'event_date' => $invitationData->event_date,
            'ceremony_time' => $invitationData->ceremony_time,
            'ceremony_location' => $invitationData->ceremony_location,
            'reception_location' => $invitationData->reception_location,
            'reception_google_maps_link' => $invitationData->reception_google_maps_link,
            'love_story' => $invitationData->love_story,
            'photo_gallery' => $invitationData->photo_gallery ?? [],
            'wedding_info' => $invitationData->wedding_info ?? [],
            'subdomain' => $subscription->subdomain,
            'template_type' => $template->type,
            'template_name' => $template->name,
        ];

        // For now, render a simple HTML template
        // In production, you would load actual template files based on template ID
        return view('invitations.template', $data);
    }
}
