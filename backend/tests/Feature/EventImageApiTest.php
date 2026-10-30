<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EventImageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_events_without_images_return_a_null_image_url(): void
    {
        $this->seed();
        $event = $this->seededEvent();

        $this->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.image_url', null);
    }

    public function test_organizer_can_create_an_event_with_a_cover_image(): void
    {
        Storage::fake('public');
        $this->seed();
        $organizer = $this->organizer();

        $response = $this->authenticatedMultipartPost($organizer, '/api/events', [
            ...$this->eventPayload(),
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ]);

        $response->assertCreated();
        $imageUrl = $response->json('data.image_url');
        $event = Event::query()->where('title', 'Taller Laravel')->sole();

        $this->assertIsString($imageUrl);
        $this->assertStringContainsString('/storage/events/', $imageUrl);
        $this->assertNotNull($event->image_path);
        $this->assertStringStartsWith('events/', $event->image_path);
        Storage::disk('public')->assertExists($event->image_path);
    }

    public function test_organizer_can_replace_and_remove_a_cover_image(): void
    {
        Storage::fake('public');
        $this->seed();
        $organizer = $this->organizer();
        $event = $this->seededEvent();

        $this->authenticatedMultipartPost($organizer, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->image('first.jpg'),
        ])->assertOk();
        $event->refresh();
        $previousImagePath = $event->image_path;

        Storage::disk('public')->assertExists($previousImagePath);

        $this->authenticatedMultipartPost($organizer, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->image('second.jpg'),
        ])->assertOk();
        $event->refresh();
        $currentImagePath = $event->image_path;

        $this->assertNotSame($previousImagePath, $currentImagePath);
        Storage::disk('public')->assertMissing($previousImagePath);
        Storage::disk('public')->assertExists($currentImagePath);

        $this->authenticatedDelete($organizer, "/api/events/{$event->id}/image")
            ->assertOk()
            ->assertJsonPath('data.image_url', null);

        $event->refresh();
        $this->assertNull($event->image_path);
        Storage::disk('public')->assertMissing($currentImagePath);
    }

    public function test_image_upload_validates_file_type_and_event_permissions(): void
    {
        Storage::fake('public');
        $this->seed();
        $event = $this->seededEvent();
        $organizer = $this->organizer();
        $otherMember = User::factory()->create();
        CommunityMembership::factory()->create([
            'community_id' => $event->community_id,
            'user_id' => $otherMember->id,
            'community_role_id' => CommunityRole::query()->where('code', 'member')->sole()->id,
            'status' => MembershipStatus::Active->value,
        ]);

        $this->authenticatedMultipartPost($organizer, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->create('notes.pdf', 100, 'application/pdf'),
        ])->assertUnprocessable();

        $this->authenticatedMultipartPost($organizer, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->create('large.jpg', 5121, 'image/jpeg'),
        ])->assertUnprocessable();

        $this->authenticatedMultipartPost($otherMember, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ])->assertForbidden();

        $event->update([
            'status' => EventStatus::Cancelled->value,
        ]);

        $this->authenticatedMultipartPost($organizer, "/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ])->assertConflict();
    }

    public function test_image_routes_require_authentication(): void
    {
        $this->seed();
        $event = $this->seededEvent();

        $this->postJson("/api/events/{$event->id}/image", [
            'image' => UploadedFile::fake()->image('cover.jpg'),
        ])->assertUnauthorized();
        $this->deleteJson("/api/events/{$event->id}/image")->assertUnauthorized();
    }

    private function organizer(): User
    {
        return User::query()->where('email', 'organizer@espol.edu.ec')->sole();
    }

    private function seededEvent(): Event
    {
        return Event::query()->with('community')->where('title', 'Hackathon TAWS')->sole();
    }

    private function eventPayload(): array
    {
        $event = $this->seededEvent();

        return [
            'community_id' => $event->community_id,
            'event_category_id' => $event->event_category_id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'title' => 'Taller Laravel',
            'description' => 'Taller de prueba para la API de eventos.',
            'starts_at' => now()->addWeek()->toIso8601String(),
            'capacity' => 25,
        ];
    }

    private function authenticatedMultipartPost(User $user, string $uri, array $payload)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withHeader('Accept', 'application/json')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->post($uri, $payload);
    }

    private function authenticatedDelete(User $user, string $uri)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withHeader('Accept', 'application/json')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->deleteJson($uri);
    }
}
