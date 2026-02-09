<?php

namespace Database\Seeders;

use App\Models\Template;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Elegant Floral',
                'description' => 'Template undangan dengan desain floral yang elegan dan mewah',
                'file_path' => 'templates/elegant-floral',
                'thumbnail_path' => 'https://images.pexels.com/photos/31039955/pexels-photo-31039955.jpeg',
                'price' => 200000,
                'type' => 'wedding',
                'category' => 'Floral',
                'demo_url' => 'https://demo.malahproject.com/elegant-floral',
                'is_active' => true,
            ],
            [
                'name' => 'Modern Minimalist',
                'description' => 'Desain minimalis modern dengan warna netral yang timeless',
                'file_path' => 'templates/modern-minimalist',
                'thumbnail_path' => 'https://images.pexels.com/photos/16660116/pexels-photo-16660116.jpeg',
                'price' => 150000,
                'type' => 'wedding',
                'category' => 'Minimalis',
                'demo_url' => 'https://demo.malahproject.com/modern-minimalist',
                'is_active' => true,
            ],
            [
                'name' => 'Tradisional Adat',
                'description' => 'Undangan dengan sentuhan tradisional dan budaya lokal',
                'file_path' => 'templates/tradisional-adat',
                'thumbnail_path' => 'https://images.pexels.com/photos/7383513/pexels-photo-7383513.jpeg',
                'price' => 250000,
                'type' => 'wedding',
                'category' => 'Adat',
                'demo_url' => 'https://demo.malahproject.com/tradisional-adat',
                'is_active' => true,
            ],
            [
                'name' => 'Luxury Gold',
                'description' => 'Template mewah dengan aksen emas dan desain premium',
                'file_path' => 'templates/luxury-gold',
                'thumbnail_path' => 'https://images.pexels.com/photos/7383513/pexels-photo-7383513.jpeg',
                'price' => 350000,
                'type' => 'wedding',
                'category' => 'Luxury',
                'demo_url' => 'https://demo.malahproject.com/luxury-gold',
                'is_active' => true,
            ],
            [
                'name' => 'Romantic Rose',
                'description' => 'Desain romantis dengan tema mawar dan warna pink',
                'file_path' => 'templates/romantic-rose',
                'thumbnail_path' => 'https://images.pexels.com/photos/31884819/pexels-photo-31884819.jpeg',
                'price' => 200000,
                'type' => 'wedding',
                'category' => 'Floral',
                'demo_url' => 'https://demo.malahproject.com/romantic-rose',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            Template::create($template);
        }
    }
}
