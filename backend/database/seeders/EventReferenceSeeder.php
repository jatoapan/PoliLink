<?php

namespace Database\Seeders;

use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Location;
use Illuminate\Database\Seeder;

class EventReferenceSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'workshop' => ['name' => 'Taller', 'legacy_name' => 'Workshop'],
            'talk' => ['name' => 'Charla', 'legacy_name' => 'Talk'],
            'hackathon' => ['name' => 'Hackatón', 'legacy_name' => 'Hackathon'],
            'fair' => ['name' => 'Feria', 'legacy_name' => 'Fair'],
            'cultural' => ['name' => 'Cultural', 'legacy_name' => 'Cultural'],
            'sports' => ['name' => 'Deportes', 'legacy_name' => 'Sports'],
        ] as $code => $catalog) {
            $category = EventCategory::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $catalog['name'], 'is_active' => true],
            );

            if ($category->name === $catalog['legacy_name']) {
                $category->update(['name' => $catalog['name']]);
            }
        }

        foreach ([
            'in_person' => ['name' => 'Presencial', 'legacy_name' => 'In person'],
            'virtual' => ['name' => 'Virtual', 'legacy_name' => 'Virtual'],
            'hybrid' => ['name' => 'Híbrida', 'legacy_name' => 'Hybrid'],
        ] as $code => $catalog) {
            $modality = EventModality::query()->firstOrCreate(
                ['code' => $code],
                ['name' => $catalog['name'], 'is_active' => true],
            );

            if ($modality->name === $catalog['legacy_name']) {
                $modality->update(['name' => $catalog['name']]);
            }
        }

        foreach ([
            'Campus Gustavo Galindo',
            'Auditorio FIEC',
            'Aula A-101',
            'Google Meet',
        ] as $name) {
            Location::query()->firstOrCreate(
                ['name' => $name],
                ['is_active' => true],
            );
        }

    }
}
