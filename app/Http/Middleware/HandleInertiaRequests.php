<?php

namespace App\Http\Middleware;

use App\Models\AppConfig;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on every request.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine if request should bypass Inertia completely
     */
    public function shouldBypassInertia(Request $request): bool
    {
        $path = $request->getPathInfo();

        // Skip for API endpoints and JSON API calls
        if (strpos($path, '/api/') === 0) {
            return true;
        }

        // Skip for payment endpoints
        if (strpos($path, '/payment/charge') === 0 || strpos($path, '/payment/debug') === 0) {
            return true;
        }

        // Skip for invitation update endpoint (JSON endpoint)
        if (strpos($path, '/invitation') !== false &&
            ($request->isMethod('PUT') || $request->isMethod('POST'))) {
            return true;
        }

        return false;
    }

    /**
     * Handle the request
     */
    public function handle($request, $next)
    {
        // Bypass Inertia middleware entirely for JSON endpoints
        if ($this->shouldBypassInertia($request)) {
            return $next($request);
        }

        // Otherwise use Inertia's middleware
        return parent::handle($request, $next);
    }

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Skip Inertia processing for API endpoints and JSON endpoints
     */
    public function shouldSkipSharing(Request $request): bool
    {
        $path = $request->getPathInfo();
        return strpos($path, '/api/') === 0 ||
               strpos($path, '/payment/charge') === 0 ||
               strpos($path, '/payment/debug') === 0;
    }

    /**
     * Define the props that are shared by default.
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'branding' => $this->getBrandingConfig(),
        ];
    }

    /**
     * Get branding config from database
     */
    private function getBrandingConfig(): array
    {
        try {
            return [
                'logo' => [
                    'url' => AppConfig::getValue('logo_url'),
                    'text' => AppConfig::getValue('logo_text', 'MaLah'),
                    'height' => AppConfig::getValue('logo_height', '32px'),
                ],
                'colors' => [
                    'primary' => AppConfig::getValue('primary_color', '#9333ea'),
                    'secondary' => AppConfig::getValue('secondary_color', '#ec4899'),
                ],
                'contact' => [
                    'email' => AppConfig::getValue('contact_email'),
                    'phone' => AppConfig::getValue('contact_phone'),
                    'address' => AppConfig::getValue('contact_address'),
                ],
                'social_media' => [
                    'facebook' => AppConfig::getValue('social_facebook'),
                    'instagram' => AppConfig::getValue('social_instagram'),
                    'twitter' => AppConfig::getValue('social_twitter'),
                ],
            ];
        } catch (\Exception $e) {
            // Fallback to config if database is not accessible
            return config('branding', []);
        }
    }
}
