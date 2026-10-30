<?php

namespace Database\Seeders;

use App\Models\CommunityRole;
use Illuminate\Database\Seeder;

class CommunityReferenceSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'member' => 'Miembro',
            'organizer' => 'Organizador',
            'tutor' => 'Tutor',
        ] as $code => $name) {
            CommunityRole::query()->updateOrCreate(['code' => $code], ['name' => $name]);
        }

    }
}
