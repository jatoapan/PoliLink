<?php

namespace Tests\Feature;

use App\Enums\CommunityCreationRequestStatus;
use App\Enums\EventStatus;
use App\Enums\MembershipStatus;
use App\Models\Community;
use App\Models\CommunityCreationRequest;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityOnboardingApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_onboarding_routes_require_authentication(): void
    {
        $this->getJson('/api/me/communities')->assertUnauthorized();
        $this->getJson('/api/me/events')->assertUnauthorized();
        $this->postJson('/api/community-creation-requests', ['name' => 'Comunidad nueva'])->assertUnauthorized();
        $this->getJson('/api/me/community-creation-requests')->assertUnauthorized();
    }

    public function test_student_without_communities_receives_empty_dashboard_lists(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedGet($student, '/api/me/communities')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->authenticatedGet($student, '/api/me/events')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_student_can_submit_a_community_creation_request(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Club de Astronomía',
            'description' => 'Comunidad de robótica de ESPOL.',
        ])
            ->assertCreated()
            ->assertJsonStructure(['data' => ['id', 'name', 'slug', 'description', 'image_url', 'status']])
            ->assertJsonPath('data.name', 'Club de Astronomía')
            ->assertJsonPath('data.slug', 'club-de-astronomia')
            ->assertJsonPath('data.status.code', 'pending');

        $this->assertDatabaseHas('community_creation_requests', [
            'name' => 'Club de Astronomía',
            'requested_by' => $student->id,
            'status' => CommunityCreationRequestStatus::Pending->value,
        ]);
        $this->assertDatabaseMissing('communities', ['name' => 'Club de Astronomía']);

        $this->authenticatedGet($student, '/api/me/community-creation-requests')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Club de Astronomía'])
            ->assertJsonFragment(['code' => 'pending']);
    }

    public function test_community_name_must_be_unique(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'TAWS',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Club de Robótica',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad Única',
        ])->assertCreated();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad Única',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_rejected_community_creation_request_names_can_be_reused(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad reutilizable',
        ])->assertCreated();

        CommunityCreationRequest::query()
            ->where('name', 'Comunidad reutilizable')
            ->update(['status' => CommunityCreationRequestStatus::Rejected->value]);

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad reutilizable',
        ])->assertCreated();

        $this->assertDatabaseCount('community_creation_requests', 3);
    }

    public function test_slug_collisions_are_rejected_after_name_normalization(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad con Robótica',
        ])->assertCreated();

        $this->authenticatedPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad con Robotica',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_names_without_a_valid_slug_are_rejected(): void
    {
        $this->seed();

        $this->authenticatedPost($this->student(), '/api/community-creation-requests', [
            'name' => '!!!',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('name');
    }

    public function test_dashboard_lists_only_own_events_including_cancelled_events(): void
    {
        $this->seed();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $event = Event::query()->where('title', 'Hackathon TAWS')->sole();

        Event::factory()->create([
            'community_id' => $event->community_id,
            'event_category_id' => $event->event_category_id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'status' => EventStatus::Cancelled->value,
            'title' => 'Evento cancelado propio',
            'starts_at' => now()->addYear(),
        ]);

        $otherCommunity = Community::factory()->create();
        $otherOrganizer = User::factory()->create();
        CommunityMembership::factory()->create([
            'community_id' => $otherCommunity->id,
            'user_id' => $otherOrganizer->id,
            'community_role_id' => CommunityRole::query()->where('code', 'organizer')->sole()->id,
            'status' => MembershipStatus::Active->value,
        ]);
        Event::factory()->create([
            'community_id' => $otherCommunity->id,
            'event_category_id' => $event->event_category_id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'status' => $event->status->value,
            'title' => 'Evento ajeno',
        ]);

        $this->authenticatedGet($organizer, '/api/me/events?per_page=1')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [[
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
                ]],
                'links',
                'meta',
            ])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonFragment(['code' => 'cancelled'])
            ->assertJsonMissing(['title' => 'Evento ajeno']);
    }

    public function test_dashboard_excludes_inactive_managed_communities_and_events(): void
    {
        $this->seed();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $community = Community::query()->where('name', 'TAWS')->sole();
        $event = Event::query()->where('title', 'Hackathon TAWS')->sole();

        $community->update(['is_active' => false]);

        $this->authenticatedGet($organizer, '/api/me/communities')
            ->assertOk()
            ->assertJsonMissing(['id' => $community->id]);

        $this->authenticatedGet($organizer, '/api/me/events')
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonMissing(['id' => $event->id]);
    }

    public function test_organizer_event_dashboard_rejects_invalid_pagination(): void
    {
        $this->seed();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();

        $this->authenticatedGet($organizer, '/api/me/events?per_page=51')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');
    }

    private function student(): User
    {
        return User::query()->where('email', 'student@espol.edu.ec')->sole();
    }

    private function authenticatedGet(User $user, string $uri)
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->getJson($uri);
    }

    private function authenticatedPost(User $user, string $uri, array $payload)
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->postJson($uri, $payload);
    }
}
