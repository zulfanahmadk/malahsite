<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default admin user
        User::create([
            'name' => 'Admin MaLah',
            'email' => 'admin@malahproject.com',
            'username' => 'admin',
            'phone' => '081234567892',
            'password' => Hash::make('Admin@12345'),
            'user_type' => 'admin',
        ]);

        // Create test admin
        User::create([
            'name' => 'Test Admin',
            'email' => 'test@malahproject.com',
            'username' => 'testadmin',
            'phone' => '082234567893',
            'password' => Hash::make('Test@12345'),
            'user_type' => 'admin',
        ]);
    }
}
