<?php

namespace App\Providers;

use App\Models\Subscription;
use App\Models\User;
use App\Policies\SubscriptionPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Subscription::class => SubscriptionPolicy::class,
        User::class => UserPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Define admin gate for authorization
        Gate::define('isAdmin', function (User $user) {
            return $user->user_type === 'admin';
        });
    }
}
