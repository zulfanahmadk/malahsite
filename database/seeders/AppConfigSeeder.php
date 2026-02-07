<?php

namespace Database\Seeders;

use App\Models\AppConfig;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AppConfigSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $configs = [
            [
                'key' => 'logo_url',
                'value' => 'https://via.placeholder.com/200x50?text=MaLah',
                'type' => 'string',
                'description' => 'Application logo URL',
            ],
            [
                'key' => 'logo_text',
                'value' => 'MaLah',
                'type' => 'string',
                'description' => 'Logo text fallback',
            ],
            [
                'key' => 'logo_height',
                'value' => '32px',
                'type' => 'string',
                'description' => 'Logo height CSS value',
            ],
            [
                'key' => 'primary_color',
                'value' => '#9333ea',
                'type' => 'string',
                'description' => 'Primary brand color',
            ],
            [
                'key' => 'secondary_color',
                'value' => '#ec4899',
                'type' => 'string',
                'description' => 'Secondary brand color',
            ],
            [
                'key' => 'contact_email',
                'value' => 'info@malah.com',
                'type' => 'string',
                'description' => 'Contact email address',
            ],
            [
                'key' => 'contact_phone',
                'value' => '+62 812-3456-7890',
                'type' => 'string',
                'description' => 'Contact phone number',
            ],
            [
                'key' => 'contact_address',
                'value' => 'Jakarta, Indonesia',
                'type' => 'string',
                'description' => 'Contact address',
            ],
            [
                'key' => 'social_facebook',
                'value' => 'https://facebook.com',
                'type' => 'string',
                'description' => 'Facebook page URL',
            ],
            [
                'key' => 'social_instagram',
                'value' => 'https://instagram.com',
                'type' => 'string',
                'description' => 'Instagram profile URL',
            ],
            [
                'key' => 'social_twitter',
                'value' => 'https://twitter.com',
                'type' => 'string',
                'description' => 'Twitter profile URL',
            ],
            [
                'key' => 'app_name',
                'value' => 'MaLah - Digital Wedding Invitation',
                'type' => 'string',
                'description' => 'Application name',
            ],
            [
                'key' => 'app_description',
                'value' => 'Platform terpercaya untuk membuat undangan digital yang cantik dan fungsional',
                'type' => 'string',
                'description' => 'Application description',
            ],
        ];

        foreach ($configs as $config) {
            AppConfig::create($config);
        }
    }
}
