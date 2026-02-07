<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvitationData extends Model
{
    protected $table = 'invitation_data';

    protected $fillable = [
        'subscription_id',
        'bride_name',
        'groom_name',
        'bride_father_name',
        'bride_mother_name',
        'groom_father_name',
        'groom_mother_name',
        'event_date',
        'ceremony_time',
        'ceremony_location',
        'reception_location',
        'reception_google_maps_link',
        'love_story',
        'photo_gallery',
        'wedding_info',
    ];

    protected $casts = [
        'event_date' => 'date',
        'ceremony_time' => 'string',
        'photo_gallery' => 'json',
        'wedding_info' => 'json',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }
}
