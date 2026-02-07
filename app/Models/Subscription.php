<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'template_id',
        'subdomain',
        'status',
        'activated_at',
        'expired_at',
    ];

    protected $casts = [
        'activated_at' => 'datetime',
        'expired_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function invitationData(): HasOne
    {
        return $this->hasOne(InvitationData::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active' && 
               (!$this->expired_at || $this->expired_at->isFuture());
    }
}
