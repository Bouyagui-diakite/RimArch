<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@rimarch.com'],
            [
                'name'              => 'Administrateur',
                'password'          => Hash::make('Admin@2024!'),
                'email_verified_at' => now(),
            ]
        );

        $role = Role::where('name', 'admin')->first();

        if ($role && !$admin->roles()->where('role_id', $role->id)->exists()) {
            $admin->roles()->attach($role->id);
        }
    }
}
