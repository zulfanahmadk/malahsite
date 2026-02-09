<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;

class AuthenticateApiOrSession
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Try Sanctum token auth first
        if ($request->user('sanctum')) {
            return $next($request);
        }

        // Fall back to session auth
        if ($request->user()) {
            return $next($request);
        }

        // If neither auth method works, throw exception
        throw new AuthenticationException('Unauthenticated.');
    }
}
