<?php

namespace Tests\Feature;

use App\Enums\CommunityCreationRequestStatus;
use App\Models\Community;
use App\Models\CommunityCreationRequest;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class DomainModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeded_models_expose_the_expected_relationships(): void
    {
        $this->seed();

        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $admin = User::query()->where('email', 'admin@espol.edu.ec')->sole();
        $community = Community::query()->where('name', 'TAWS')->sole();
        $event = Event::query()->where('title', 'Hackathon TAWS')->sole();
        $registration = Registration::query()->sole();

        $this->assertFalse($organizer->is_admin);
        $this->assertFalse($student->is_admin);
        $this->assertTrue($admin->is_admin);
        $this->assertTrue(Hash::check('admin', $admin->password));
        $this->assertTrue($organizer->managedMemberships->first()->community->is($community));
        $this->assertSame('organizer', $organizer->managedMemberships->first()->role->code);
        $this->assertSame('member', $student->memberships->first()->role->code);
        $this->assertSame('TAWS', $event->community->name);
        $this->assertSame('taws', $community->slug);
        $this->assertSame('Hackatón', $event->category->name);
        $this->assertSame('Presencial', $event->modality->name);
        $this->assertSame('Campus Gustavo Galindo', $event->location->name);
        $this->assertSame('published', $event->status->value);
        $this->assertSame('Publicado', $event->status->label());
        $this->assertTrue($registration->user->is($student));
        $this->assertTrue($registration->event->is($event));
        $this->assertSame('active', $registration->status->value);
        $this->assertSame('Activa', $registration->status->label());
    }

    public function test_seeders_are_idempotent_and_available_capacity_uses_active_count(): void
    {
        $this->seed();
        $this->seed();

        $this->assertDatabaseCount('community_roles', 3);
        $this->assertDatabaseCount('event_categories', 6);
        $this->assertDatabaseCount('event_modalities', 3);
        $this->assertDatabaseCount('locations', 4);
        $this->assertDatabaseCount('users', 3);
        $this->assertDatabaseCount('communities', 1);
        $this->assertDatabaseCount('community_creation_requests', 1);
        $this->assertDatabaseCount('community_memberships', 2);
        $this->assertDatabaseCount('events', 1);
        $this->assertDatabaseCount('registrations', 1);

        $creationRequest = CommunityCreationRequest::query()->sole();
        $this->assertSame(CommunityCreationRequestStatus::Pending, $creationRequest->status);
        $this->assertSame('Pendiente', $creationRequest->status->label());
        $this->assertSame('Club de Robótica', $creationRequest->name);
        $this->assertSame('club-de-robotica', $creationRequest->slug);

        $event = Event::query()->withCount('activeRegistrations')->sole();

        $this->assertSame(1, $event->active_registrations_count);
        $this->assertSame(49, $event->available_capacity);
        $this->assertSame(49, Event::query()->sole()->available_capacity);
    }

    public function test_seeders_translate_legacy_catalog_labels_without_overwriting_custom_labels(): void
    {
        $this->seed();

        EventCategory::query()->where('code', 'hackathon')->update(['name' => 'Hackathon']);
        EventCategory::query()->where('code', 'workshop')->update(['name' => 'Mi taller']);
        EventModality::query()->where('code', 'hybrid')->update(['name' => 'Hybrid']);

        $this->seed();

        $this->assertSame(
            'Hackatón',
            EventCategory::query()->where('code', 'hackathon')->value('name'),
        );
        $this->assertSame(
            'Mi taller',
            EventCategory::query()->where('code', 'workshop')->value('name'),
        );
        $this->assertSame(
            'Híbrida',
            EventModality::query()->where('code', 'hybrid')->value('name'),
        );
    }

    public function test_factories_create_a_valid_event_and_registration_graph(): void
    {
        $event = Event::factory()->create();
        $registration = Registration::factory()->for($event)->create();

        $this->assertNotNull($event->community);
        $this->assertNotNull($event->category);
        $this->assertNotNull($event->modality);
        $this->assertNotNull($event->location);
        $this->assertNotNull($event->status);
        $this->assertTrue($registration->event->is($event));
        $this->assertNotNull($registration->user);
        $this->assertNotNull($registration->status);
    }
}
