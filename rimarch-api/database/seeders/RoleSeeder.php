<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'admin',       'label' => 'Administrateur'],
            ['name' => 'archiviste',  'label' => 'Archiviste'],
            ['name' => 'consultant',  'label' => 'Consultant'],
            ['name' => 'lecteur',     'label' => 'Lecteur'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], $role);
        }
    }
}
