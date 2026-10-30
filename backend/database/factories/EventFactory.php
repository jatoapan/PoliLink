<?php

namespace Database\Factories;

use App\Enums\EventStatus;
use App\Models\Community;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Event>
 */
class EventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'community_id' => Community::factory(),
            'event_category_id' => EventCategory::factory(),
            'event_modality_id' => EventModality::factory(),
            'location_id' => Location::factory(),
            'status' => EventStatus::Published->value,
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'starts_at' => fake()->dateTimeBetween('+1 day', '+1 year'),
            'capacity' => fake()->numberBetween(1, 100),
        ];
    }
}
