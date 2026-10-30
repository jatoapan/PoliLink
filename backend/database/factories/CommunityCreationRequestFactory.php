<?php

namespace Database\Factories;

use App\Enums\CommunityCreationRequestStatus;
use App\Models\CommunityCreationRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CommunityCreationRequest>
 */
class CommunityCreationRequestFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterMaking(function (CommunityCreationRequest $request): void {
            $request->slug = Str::slug($request->name);
        });
    }

    public function definition(): array
    {
        $name = fake()->unique()->company();

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->paragraph(),
            'image_path' => null,
            'requested_by' => User::factory(),
            'status' => CommunityCreationRequestStatus::Pending->value,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => null,
            'community_id' => null,
        ];
    }
}
