<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::query()->firstOrCreate(
            ['email' => 'admin@espol.edu.ec'],
            [
                'first_name' => 'Administrador',
                'last_name' => 'PoliLink',
                'email_verified_at' => now(),
                'password' => Hash::make('admin'),
            ],
        );

        $admin->forceFill(['is_admin' => true])->save();
    }
}
