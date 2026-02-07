<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Check if user is admin
     */
    public function isAdmin(User $user): bool
    {
        return $user->user_type === 'admin';
    }
}
