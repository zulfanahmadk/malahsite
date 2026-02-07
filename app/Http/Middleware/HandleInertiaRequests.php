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
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
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
