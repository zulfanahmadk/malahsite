<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create regular test user
        User::create([
            'name' => 'John Doe',
            'email' => 'user@malahproject.com',
            'username' => 'johndoe',
            'phone' => '081234567890',
            'password' => Hash::make('User@12345'),
            'user_type' => 'user',
        ]);

        // Create another regular user
        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@malahproject.com',
            'username' => 'janesmith',
            'phone' => '082234567891',
            'password' => Hash::make('User@12345'),
            'user_type' => 'user',
        ]);
    }
}
