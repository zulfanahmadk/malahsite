<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GalleryPhoto extends Model
{
    protected $table = 'gallery_photos';

    protected $fillable = [
        'invitation_data_id',
        'photo_path',
        'order',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    public function invitationData(): BelongsTo
    {
        return $this->belongsTo(InvitationData::class);
    }
}
