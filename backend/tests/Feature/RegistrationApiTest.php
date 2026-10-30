<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_endpoints_require_authentication(): void
    {
        $this->seed();
        $event = $this->seededEvent();

        $this->postJson("/api/events/{$event->id}/registrations")->assertUnauthorized();
        $this->deleteJson("/api/events/{$event->id}/registrations")->assertUnauthorized();
        $this->getJson("/api/events/{$event->id}/registrations")->assertUnauthorized();
        $this->getJson('/api/me/registrations')->assertUnauthorized();
    }

    public function test_any_authenticated_user_can_register_and_cancel(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $organizer = $this->organizer();

        $this->authenticatedPost($organizer, "/api/events/{$event->id}/registrations")->assertCreated();
        $this->authenticatedDelete($organizer, "/api/events/{$event->id}/registrations")->assertOk();
    }

    public function test_user_can_register_for_a_published_event(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $newUser = $this->createUser('new-user@espol.edu.ec');

        $response = $this->authenticatedPost($newUser, "/api/events/{$event->id}/registrations");

        $response
            ->assertCreated()
            ->assertJsonPath('data.status.code', 'active');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $newUser->id,
        ]);
    }

    public function test_duplicate_active_registration_is_rejected(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $student = $this->student();

        $this->authenticatedPost($student, "/api/events/{$event->id}/registrations")->assertConflict();
    }

    public function test_registration_on_a_cancelled_event_is_rejected(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $event->update([
            'status' => EventStatus::Cancelled->value,
        ]);
        $newUser = $this->createUser('late-user@espol.edu.ec');

        $this->authenticatedPost($newUser, "/api/events/{$event->id}/registrations")->assertConflict();
    }

    public function test_registration_when_event_is_full_is_rejected(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $event->update(['capacity' => 1]);
        $secondUser = $this->createUser('second-user@espol.edu.ec');

        $this->authenticatedPost($secondUser, "/api/events/{$event->id}/registrations")->assertConflict();
    }

    public function test_user_can_cancel_an_active_registration(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $student = $this->student();

        $response = $this->authenticatedDelete($student, "/api/events/{$event->id}/registrations");

        $response
            ->assertOk()
            ->assertJsonPath('data.status.code', 'cancelled');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $student->id,
            'status' => RegistrationStatus::Cancelled->value,
        ]);
    }

    public function test_cancelling_a_nonexistent_registration_returns_not_found(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $newUser = $this->createUser('unregistered-user@espol.edu.ec');

        $this->authenticatedDelete($newUser, "/api/events/{$event->id}/registrations")->assertNotFound();
    }

    public function test_cancelled_registration_is_reactivated_on_new_registration(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $student = $this->student();

        $this->authenticatedDelete($student, "/api/events/{$event->id}/registrations")->assertOk();

        $response = $this->authenticatedPost($student, "/api/events/{$event->id}/registrations");

        $response
            ->assertOk()
            ->assertJsonPath('data.status.code', 'active');

        $this->assertSame(1, Registration::query()
            ->where('event_id', $event->id)
            ->where('user_id', $student->id)
            ->count());
    }

    public function test_managing_organizer_can_list_attendees_with_summary(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $organizer = $this->organizer();

        $response = $this->authenticatedGet($organizer, "/api/events/{$event->id}/registrations");

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.user.email', 'student@espol.edu.ec')
            ->assertJsonPath('summary.capacity', 50)
            ->assertJsonPath('summary.active_registrations', 1)
            ->assertJsonPath('summary.available_capacity', 49);
    }

    public function test_non_managing_organizer_and_students_cannot_list_attendees(): void
    {
        $this->seed();
        $event = $this->seededEvent();
        $otherUser = User::factory()->create();
        $student = $this->student();

        $this->authenticatedGet($otherUser, "/api/events/{$event->id}/registrations")->assertForbidden();
        $this->authenticatedGet($student, "/api/events/{$event->id}/registrations")->assertForbidden();
    }

    public function test_my_registrations_lists_only_active_registrations_paginated(): void
    {
        $this->seed();
        $student = $this->student();

        $response = $this->authenticatedGet($student, '/api/me/registrations');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.event.id', $this->seededEvent()->id)
            ->assertJsonPath('meta.per_page', 12);
    }

    private function organizer(): User
    {
        return User::query()->where('email', 'organizer@espol.edu.ec')->sole();
    }

    private function student(): User
    {
        return User::query()->where('email', 'student@espol.edu.ec')->sole();
    }

    private function seededEvent(): Event
    {
        return Event::query()->with('community')->where('title', 'Hackathon TAWS')->sole();
    }

    private function createUser(string $email): User
    {
        return User::factory()->create(['email' => $email]);
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

    private function authenticatedDelete(User $user, string $uri)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->deleteJson($uri);
    }

    private function authenticatedGet(User $user, string $uri)
    {
        return $this->actingAs($user, 'sanctum')->getJson($uri);
    }
}
