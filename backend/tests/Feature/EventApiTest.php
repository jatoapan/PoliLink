<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Models\Community;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalogue_lists_only_published_events_and_applies_filters(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        Event::factory()->create([
            'community_id' => $event->community_id,
            'event_category_id' => $event->event_category_id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'status' => EventStatus::Cancelled->value,
            'title' => 'Evento cancelado',
        ]);

        $response = $this->getJson('/api/events?search=Hackathon&date=2026-08-20&category=hackathon&modality=in_person&community_id='.$event->community_id);

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $event->id)
            ->assertJsonPath('data.0.available_capacity', 49)
            ->assertJsonPath('data.0.community.name', 'TAWS')
            ->assertJsonPath('data.0.community.slug', 'taws')
            ->assertJsonPath('data.0.category.code', 'hackathon')
            ->assertJsonPath('meta.per_page', 12);
    }

    public function test_public_detail_hides_cancelled_events(): void
    {
        $this->seed();
        $event = $this->seededEvent();

        $this->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $event->id);

        $event->update([
            'status' => EventStatus::Cancelled->value,
        ]);

        $this->getJson("/api/events/{$event->id}")->assertNotFound();
    }

    public function test_public_catalogue_hides_events_from_inactive_communities(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $event->community->update(['is_active' => false]);

        $this->getJson('/api/events')->assertOk()->assertJsonMissing(['id' => $event->id]);
        $this->getJson("/api/events/{$event->id}")->assertNotFound();
    }

    public function test_organizer_can_create_an_event_for_a_managed_community(): void
    {
        $this->seed();
        $organizer = $this->organizer();

        $response = $this->authenticatedPost($organizer, '/api/events', $this->eventPayload());

        $response
            ->assertCreated()
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'title',
                    'description',
                    'image_url',
                    'starts_at',
                    'capacity',
                    'available_capacity',
                    'category',
                    'modality',
                    'location',
                    'community',
                    'status',
                    'created_at',
                    'updated_at',
                ],
            ])
            ->assertJsonPath('data.status.code', 'published')
            ->assertJsonPath('data.community.name', 'TAWS')
            ->assertJsonPath('data.image_url', null);

        $this->assertDatabaseHas('events', ['title' => 'Taller Laravel']);
    }

    public function test_event_creation_requires_authentication_and_a_managed_community(): void
    {
        $this->seed();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $organizer = $this->organizer();
        $unmanagedCommunity = Community::factory()->create();

        $this->authenticatedPost($student, '/api/events', $this->eventPayload())->assertForbidden();

        $this->authenticatedPost($organizer, '/api/events', $this->eventPayload([
            'community_id' => $unmanagedCommunity->id,
        ]))->assertForbidden();

        $this->authenticatedPost($organizer, '/api/events', $this->eventPayload([
            'capacity' => 0,
        ]))->assertUnprocessable();

    }

    public function test_inactive_community_blocks_organizer_event_management(): void
    {
        $this->seed();
        $organizer = $this->organizer();
        $event = $this->seededEvent();

        $event->community->update(['is_active' => false]);

        $this->authenticatedPost($organizer, '/api/events', $this->eventPayload())
            ->assertUnprocessable();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}", [
            'title' => 'Cambio no permitido',
        ])->assertForbidden();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}/cancel")
            ->assertForbidden();
    }

    public function test_tutor_cannot_create_an_event(): void
    {
        $this->seed();
        $tutor = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $membership = $tutor->memberships()->firstOrFail();
        $membership->update([
            'community_role_id' => CommunityRole::query()->where('code', 'tutor')->sole()->id,
        ]);

        $this->authenticatedPost($tutor, '/api/events', $this->eventPayload())->assertForbidden();
    }

    public function test_event_writes_require_authentication(): void
    {
        $this->seed();
        $event = $this->seededEvent();

        $this->postJson('/api/events', $this->eventPayload())->assertUnauthorized();
        $this->patchJson("/api/events/{$event->id}", ['title' => 'Cambio'])->assertUnauthorized();
        $this->patchJson("/api/events/{$event->id}/cancel")->assertUnauthorized();
    }

    public function test_owner_can_update_an_event_and_move_it_to_another_managed_community(): void
    {
        $this->seed();
        $organizer = $this->organizer();
        $event = $this->seededEvent();
        $secondCommunity = Community::factory()->create();
        CommunityMembership::factory()->create([
            'community_id' => $secondCommunity->id,
            'user_id' => $organizer->id,
            'community_role_id' => CommunityRole::query()->where('code', 'organizer')->sole()->id,
            'status' => MembershipStatus::Active->value,
        ]);

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}", [
            'title' => 'Hackathon TAWS actualizado',
            'community_id' => $secondCommunity->id,
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Hackathon TAWS actualizado')
            ->assertJsonPath('data.community.id', $secondCommunity->id);
    }

    public function test_non_owner_cannot_update_an_event(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $otherMember = User::factory()->create();
        CommunityMembership::factory()->create([
            'community_id' => $event->community_id,
            'user_id' => $otherMember->id,
            'community_role_id' => CommunityRole::query()->where('code', 'member')->sole()->id,
            'status' => MembershipStatus::Active->value,
        ]);

        $this->authenticatedPatch($otherMember, "/api/events/{$event->id}", [
            'title' => 'Cambio no permitido',
        ])->assertForbidden();
    }

    public function test_owner_can_cancel_an_event_once(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $organizer = $this->organizer();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status.code', 'cancelled');

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}/cancel")->assertConflict();
    }

    public function test_cancelled_events_reject_organizer_updates(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $organizer = $this->organizer();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}/cancel")
            ->assertOk();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}", [
            'title' => 'Cambio no permitido',
        ])->assertConflict();
    }

    private function organizer(): User
    {
        return User::query()->where('email', 'organizer@espol.edu.ec')->sole();
    }

    private function seededEvent(): Event
    {
        return Event::query()->with('community')->where('title', 'Hackathon TAWS')->sole();
    }

    private function eventPayload(array $overrides = []): array
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
            ...$overrides,
        ];
    }

    private function authenticatedPost(User $user, string $uri, array $payload)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->postJson($uri, $payload);
    }

    private function authenticatedPatch(User $user, string $uri, array $payload = [])
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->patchJson($uri, $payload);
    }
}
