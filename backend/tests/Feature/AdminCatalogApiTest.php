<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\EventCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_routes_require_authentication_and_the_admin_role(): void
    {
        $this->seed();

        $this->getJson('/api/admin/catalog/event-categories')->assertUnauthorized();

        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();

        $this->authenticatedGet($organizer, '/api/admin/catalog/event-categories')
            ->assertForbidden();
    }

    public function test_admin_can_create_update_deactivate_and_reactivate_catalog_records(): void
    {
        $this->seed();
        $admin = $this->admin();

        $categoryResponse = $this->authenticatedPost($admin, '/api/admin/catalog/event-categories', [
            'code' => 'conference',
            'name' => 'Conference',
        ]);
        $categoryResponse
            ->assertCreated()
            ->assertJsonPath('data.code', 'conference')
            ->assertJsonPath('data.is_active', true);
        $categoryId = $categoryResponse->json('data.id');

        $this->authenticatedPatch($admin, "/api/admin/catalog/event-categories/{$categoryId}", [
            'name' => 'Conference Updated',
            'is_active' => false,
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'Conference Updated')
            ->assertJsonPath('data.is_active', false);

        $this->authenticatedGet($admin, '/api/admin/catalog/event-categories')
            ->assertJsonFragment(['code' => 'conference', 'is_active' => false]);

        $this->authenticatedPatch($admin, "/api/admin/catalog/event-categories/{$categoryId}", [
            'is_active' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.is_active', true);

        $modalityResponse = $this->authenticatedPost($admin, '/api/admin/catalog/event-modalities', [
            'code' => 'onsite_plus',
            'name' => 'Onsite Plus',
        ])->assertCreated();
        $this->assertNotNull($modalityResponse->json('data.id'));

        $locationResponse = $this->authenticatedPost($admin, '/api/admin/catalog/locations', [
            'name' => 'Innovation Hall',
            'description' => 'A new event location.',
        ])->assertCreated();
        $this->assertNotNull($locationResponse->json('data.id'));
    }

    public function test_catalog_codes_are_immutable_and_names_remain_unique(): void
    {
        $this->seed();
        $admin = $this->admin();
        $category = EventCategory::query()->where('code', 'hackathon')->sole();
        $otherCategory = EventCategory::query()->where('code', 'workshop')->sole();

        $this->authenticatedPatch($admin, "/api/admin/catalog/event-categories/{$category->id}", [
            'code' => 'conference',
        ])->assertUnprocessable();

        $this->authenticatedPatch($admin, "/api/admin/catalog/event-categories/{$category->id}", [
            'name' => $otherCategory->name,
        ])->assertUnprocessable();
    }

    public function test_public_reference_data_excludes_inactive_values_but_existing_events_keep_the_reference(): void
    {
        $this->seed();
        $admin = $this->admin();
        $event = Event::query()->with(['category', 'modality', 'location'])->where('title', 'Hackathon TAWS')->sole();

        $event->category->update(['is_active' => false]);
        $event->modality->update(['is_active' => false]);
        $event->location->update(['is_active' => false]);

        $this->getJson('/api/event-categories')
            ->assertOk()
            ->assertJsonMissing(['code' => 'hackathon']);
        $this->getJson('/api/event-modalities')
            ->assertOk()
            ->assertJsonMissing(['code' => 'in_person']);
        $this->getJson('/api/locations')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Campus Gustavo Galindo']);

        $this->authenticatedGet($admin, '/api/admin/catalog/event-categories')
            ->assertJsonFragment(['code' => 'hackathon', 'is_active' => false]);

        $this->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('data.category.code', 'hackathon')
            ->assertJsonPath('data.modality.code', 'in_person')
            ->assertJsonPath('data.location.name', 'Campus Gustavo Galindo');
    }

    public function test_new_events_cannot_use_inactive_catalog_values_and_admin_is_not_an_organizer(): void
    {
        $this->seed();
        $admin = $this->admin();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $event = Event::query()->with('community')->where('title', 'Hackathon TAWS')->sole();
        $activeCategory = EventCategory::query()->where('code', 'workshop')->sole();

        EventCategory::query()->where('code', 'hackathon')->update(['is_active' => false]);

        $this->authenticatedPost($organizer, '/api/events', [
            'community_id' => $event->community_id,
            'event_category_id' => $event->event_category_id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'title' => 'Event with inactive category',
            'description' => 'This should be rejected.',
            'starts_at' => now()->addWeek()->toIso8601String(),
            'capacity' => 10,
        ])->assertUnprocessable();

        $this->authenticatedPatch($organizer, "/api/events/{$event->id}", [
            'event_category_id' => $event->event_category_id,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('event_category_id');

        $this->authenticatedPost($admin, '/api/events', [
            'community_id' => $event->community_id,
            'event_category_id' => $activeCategory->id,
            'event_modality_id' => $event->event_modality_id,
            'location_id' => $event->location_id,
            'title' => 'Admin must not create events',
            'description' => 'The admin role is catalog-only.',
            'starts_at' => now()->addWeek()->toIso8601String(),
            'capacity' => 10,
        ])->assertForbidden();
    }

    public function test_provision_command_promotes_an_existing_user_without_changing_the_password(): void
    {
        $this->seed();
        $user = User::factory()->create([
            'email' => 'catalog-admin@espol.edu.ec',
            'password' => 'original-password',
        ]);

        $this->artisan('polilink:provision-admin', ['email' => $user->email])
            ->assertSuccessful();

        $user->refresh();

        $this->assertTrue($user->is_admin);
        $this->assertTrue(Hash::check('original-password', $user->password));
    }

    public function test_provision_command_creates_a_new_admin_account(): void
    {
        $this->seed();

        $this->artisan('polilink:provision-admin', ['email' => 'new-admin@espol.edu.ec'])
            ->expectsQuestion('Password for the new administrator', 'new-password')
            ->expectsQuestion('Confirm the password', 'new-password')
            ->assertSuccessful();

        $user = User::query()->where('email', 'new-admin@espol.edu.ec')->sole();

        $this->assertTrue($user->is_admin);
        $this->assertTrue(Hash::check('new-password', $user->password));
    }

    private function admin(): User
    {
        return User::query()->where('email', 'admin@espol.edu.ec')->sole();
    }

    private function authenticatedGet(User $user, string $uri)
    {
        return $this->actingAs($user, 'sanctum')->getJson($uri);
    }

    private function authenticatedPost(User $user, string $uri, array $payload = [])
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
