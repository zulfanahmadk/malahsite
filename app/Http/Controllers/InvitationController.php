<?php

namespace App\Http\Controllers;

use App\Models\GalleryPhoto;
use App\Models\InvitationData;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class InvitationController extends Controller
{
    /**
     * Get invitation data for a subscription
     */
    public function show(Subscription $subscription)
    {
        $this->authorize('view', $subscription);

        $invitationData = $subscription->invitationData ?? new InvitationData();

        // Load gallery photos if invitation data exists
        if ($invitationData->id) {
            $invitationData->load('galleryPhotos');
        }

        return response()->json($invitationData);
    }

    /**
     * Create or update invitation data
     */
    public function update(Request $request, Subscription $subscription)
    {
        // Store debug info
        $debugInfo = [
            'input_received' => $request->all(),
            'validated_data' => null,
        ];

        try {
            $this->authorize('update', $subscription);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized', 'message' => $e->getMessage()], 403);
        }

        if ($subscription->status !== 'active') {
            return response()->json(['error' => 'inactive_subscription', 'message' => 'Only active subscriptions can have their invitation updated'], 403);
        }

        \Log::info('=== INVITATION REQUEST START ===', [
            'input_count' => count($request->all()),
            'input_keys' => array_keys($request->all()),
        ]);

        // Get input immediately
        $allInput = $request->all();
        \Log::info('RAW INPUT', [
            'count' => count($allInput),
            'keys' => array_keys($allInput),
        ]);

        // Parse JSON fields that come from FormData as strings before validation
        $wedding_info = $request->input('wedding_info');
        if (is_string($wedding_info) && !empty($wedding_info)) {
            \Log::info('Parsing wedding_info from JSON string', [
                'original' => $wedding_info,
            ]);
            $wedding_info = json_decode($wedding_info, true);
            $request->merge(['wedding_info' => $wedding_info]);
        }

        // Log all incoming request data AFTER parsing
        $allInput = $request->all();
        \Log::info('InvitationController.update - Request data AFTER JSON parsing', [
            'all_input_keys' => array_keys($allInput),
            'bride_name_in_request' => $request->input('bride_name'),
            'groom_name_in_request' => $request->input('groom_name'),
            'event_date_in_request' => $request->input('event_date'),
            'has_uploaded_photos' => $request->hasFile('uploaded_photos'),
            'request_all_count' => count($request->all()),
        ]);

        try {
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
                'uploaded_photos' => 'nullable|array',
                'uploaded_photos.*' => 'file|image|max:5120',
                'removed_photos' => 'nullable|array',
                'removed_photos.*' => 'integer',
            ]);

            // Store validated data for debug response
            $debugInfo['validated_data'] = $validated;

            \Log::info('InvitationController.update - Validation PASSED', [
                'validated_keys' => array_keys($validated),
                'validated_count' => count($validated),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('InvitationController.update - Validation FAILED', [
                'errors' => $e->errors(),
                'all_input' => $request->all(),
            ]);
            return response()->json(['error' => 'validation_error', 'errors' => $e->errors()], 422);
        }

        try {
            \Log::info('=== INVITATION UPDATE START ===', [
                'subscription_id' => $subscription->id,
                'request_method' => $request->getMethod(),
                'content_type' => $request->header('Content-Type'),
            ]);

            // Ensure InvitationData exists
            if (!$subscription->invitationData) {
                \Log::info('Creating new InvitationData record');
                $subscription->invitationData = InvitationData::create([
                    'subscription_id' => $subscription->id,
                ]);
                \Log::info('New InvitationData created', [
                    'id' => $subscription->invitationData->id,
                ]);
            }

            $invitationData = $subscription->invitationData;

            // Handle photo uploads and removals
            $this->handleGalleryPhotos($invitationData, $request, $validated);

            // Remove photo-related fields before saving to invitation_data table
            unset($validated['photo_gallery']);
            unset($validated['uploaded_photos']);
            unset($validated['removed_photos']);

            // Log what we're saving
            \Log::info('Preparing to save invitation data', [
                'subscription_id' => $subscription->id,
                'invitation_data_id' => $invitationData->id,
                'validated_data_keys' => array_keys($validated),
            ]);

            // Use updateOrCreate to forcefully update the database
            $updateData = array_merge(['subscription_id' => $subscription->id], $validated);

            \Log::info('Before updateOrCreate', [
                'update_data_keys' => array_keys($updateData),
                'update_data_complete' => $updateData,
                'bride_name_in_updateData' => $updateData['bride_name'] ?? 'NOT_FOUND',
                'groom_name_in_updateData' => $updateData['groom_name'] ?? 'NOT_FOUND',
                'event_date_in_updateData' => $updateData['event_date'] ?? 'NOT_FOUND',
            ]);

            $invitationData = InvitationData::updateOrCreate(
                ['id' => $invitationData->id],
                $updateData
            );

            \Log::info('After updateOrCreate', [
                'invitation_data' => $invitationData->toArray(),
                'updated_at' => $invitationData->updated_at,
            ]);

            // Verify data was actually saved to database
            $verifyData = InvitationData::where('id', $invitationData->id)->first();

            \Log::info('Verification from DB', [
                'verified_data' => $verifyData ? $verifyData->toArray() : null,
                'verification_successful' => $verifyData !== null,
            ]);

            if (!$verifyData) {
                \Log::error('Data verification failed - data not found in database after save');
                return response()->json(['error' => 'save_failed', 'message' => 'Data tidak ditemukan setelah disimpan'], 500);
            }

            \Log::info('=== INVITATION UPDATE SUCCESS ===', [
                'invitation_id' => $verifyData->id,
                'updated_timestamp' => $verifyData->updated_at,
            ]);

            return response()->json([
                'message' => 'Data undangan berhasil disimpan!',
                'debug' => array_merge([
                    'invitation_id' => $verifyData->id,
                    'data_from_db' => $verifyData->toArray(),
                ], $debugInfo)
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('VALIDATION ERROR', [
                'errors' => $e->errors(),
                'message' => $e->getMessage(),
                'input_received' => $debugInfo['input_received'],
            ]);
            return response()->json([
                'error' => 'validation_error',
                'errors' => $e->errors(),
                'message' => $e->getMessage(),
                'debug' => $debugInfo,
            ], 422);
        } catch (\Exception $e) {
            \Log::error('=== INVITATION UPDATE ERROR ===', [
                'error_message' => $e->getMessage(),
                'error_class' => get_class($e),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return detailed error for debugging
            return response()->json([
                'error' => 'server_error',
                'message' => $e->getMessage(),
                'debug' => [
                    'exception_class' => get_class($e),
                    'code' => $e->getCode(),
                    'file' => $e->getFile() . ':' . $e->getLine(),
                ],
            ], 500);
        }
    }

    /**
     * Handle gallery photo uploads, removals and ordering
     */
    private function handleGalleryPhotos($invitationData, Request $request, &$validated)
    {
        // Remove photos that were deleted
        if (!empty($validated['removed_photos'])) {
            $photosToRemove = GalleryPhoto::whereIn('id', $validated['removed_photos'])
                ->where('invitation_data_id', $invitationData->id)
                ->get();

            foreach ($photosToRemove as $photo) {
                // Delete file from storage
                if (Storage::disk('public')->exists($photo->photo_path)) {
                    Storage::disk('public')->delete($photo->photo_path);
                }
                $photo->delete();
            }
        }

        // Upload new photos
        if ($request->hasFile('uploaded_photos')) {
            $currentCount = $invitationData->galleryPhotos()->count();
            $uploadedFiles = $request->file('uploaded_photos');

            \Log::info('Photo upload started', [
                'file_count' => count($uploadedFiles),
                'current_count' => $currentCount,
            ]);

            // Ensure we don't exceed 12 photos
            $remainingSlots = 12 - $currentCount;
            $filesToUpload = array_slice($uploadedFiles, 0, $remainingSlots);

            \Log::info('Files to upload', ['count' => count($filesToUpload)]);

            $order = $invitationData->galleryPhotos()->max('order') ?? 0;

            foreach ($filesToUpload as $file) {
                try {
                    $order++;
                    $path = $file->store('galleries/' . $invitationData->subscription_id, 'public');

                    \Log::info('Photo stored successfully', [
                        'original_name' => $file->getClientOriginalName(),
                        'stored_path' => $path,
                        'order' => $order,
                    ]);

                    $photoRecord = GalleryPhoto::create([
                        'invitation_data_id' => $invitationData->id,
                        'photo_path' => $path,
                        'order' => $order,
                    ]);

                    \Log::info('Gallery photo record created', [
                        'photo_id' => $photoRecord->id,
                        'invitation_data_id' => $invitationData->id,
                    ]);
                } catch (\Exception $e) {
                    \Log::error('Error uploading photo', [
                        'error' => $e->getMessage(),
                        'file_name' => $file->getClientOriginalName(),
                    ]);
                }
            }
        } else {
            \Log::info('No photos uploaded', [
                'has_uploaded_photos' => $request->hasFile('uploaded_photos'),
                'all_files' => $request->files->all(),
            ]);
        }

        // Update order if provided
        if (!empty($validated['photo_gallery']) && is_array($validated['photo_gallery'])) {
            foreach ($validated['photo_gallery'] as $index => $photoId) {
                if (is_numeric($photoId)) {
                    GalleryPhoto::where('id', $photoId)
                        ->where('invitation_data_id', $invitationData->id)
                        ->update(['order' => $index]);
                }
            }
        }
    }

    /**
     * Get invitation public preview (by subdomain)
     */
    public function preview($subdomain)
    {
        $subscription = Subscription::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->with(['template', 'invitationData.galleryPhotos'])
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
