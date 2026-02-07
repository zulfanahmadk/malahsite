<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    protected $fillable = [
        'subscription_id',
        'midtrans_order_id',
        'amount',
        'status',
        'payload',
        'payment_method',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'payload' => 'json',
        'paid_at' => 'datetime',
    ];

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'paid';
    }
}
