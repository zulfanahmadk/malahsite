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
                'thumbnail_path' => '/images/templates/elegant-floral.jpg',
                'price' => 200000,
                'type' => 'wedding',
                'category' => 'Floral',
                'demo_url' => 'https://demo.malahproject.com/elegant-floral',
            ],
            [
                'name' => 'Modern Minimalist',
                'description' => 'Desain minimalis modern dengan warna netral yang timeless',
                'file_path' => 'templates/modern-minimalist',
                'thumbnail_path' => '/images/templates/modern-minimalist.jpg',
                'price' => 150000,
                'type' => 'wedding',
                'category' => 'Minimalis',
                'demo_url' => 'https://demo.malahproject.com/modern-minimalist',
            ],
            [
                'name' => 'Tradisional Adat',
                'description' => 'Undangan dengan sentuhan tradisional dan budaya lokal',
                'file_path' => 'templates/tradisional-adat',
                'thumbnail_path' => '/images/templates/tradisional-adat.jpg',
                'price' => 250000,
                'type' => 'wedding',
                'category' => 'Adat',
                'demo_url' => 'https://demo.malahproject.com/tradisional-adat',
            ],
            [
                'name' => 'Luxury Gold',
                'description' => 'Template mewah dengan aksen emas dan desain premium',
                'file_path' => 'templates/luxury-gold',
                'thumbnail_path' => '/images/templates/luxury-gold.jpg',
                'price' => 350000,
                'type' => 'wedding',
                'category' => 'Luxury',
                'demo_url' => 'https://demo.malahproject.com/luxury-gold',
            ],
            [
                'name' => 'Romantic Rose',
                'description' => 'Desain romantis dengan tema mawar dan warna pink',
                'file_path' => 'templates/romantic-rose',
                'thumbnail_path' => '/images/templates/romantic-rose.jpg',
                'price' => 200000,
                'type' => 'wedding',
                'category' => 'Floral',
                'demo_url' => 'https://demo.malahproject.com/romantic-rose',
            ],
        ];

        foreach ($templates as $template) {
            Template::create($template);
        }
    }
}
