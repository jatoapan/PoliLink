<?php

namespace Database\Factories;

use App\Models\EventCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EventCategory>
 */
class EventCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('category-###'),
            'name' => fake()->unique()->words(2, true),
            'is_active' => true,
        ];
    }
}
