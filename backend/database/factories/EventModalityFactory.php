<?php

namespace Database\Factories;

use App\Models\EventModality;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventModality>
 */
class EventModalityFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('modality-###'),
            'name' => fake()->unique()->words(2, true),
            'is_active' => true,
        ];
    }
}
