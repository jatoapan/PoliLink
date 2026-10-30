<?php

namespace Database\Factories;

use App\Models\CommunityRole;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CommunityRole>
 */
class CommunityRoleFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('community-role-###'),
            'name' => fake()->unique()->words(2, true),
        ];
    }
}
