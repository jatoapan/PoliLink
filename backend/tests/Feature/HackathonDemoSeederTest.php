<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Community;
use App\Models\Event;
use Database\Seeders\HackathonDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HackathonDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_hackathon_demo_seeder_is_idempotent(): void
    {
        $this->seed();
        $this->seed(HackathonDemoSeeder::class);
        $counts = $this->tableCounts();
        $startsAt = Event::query()->orderBy('id')->pluck('starts_at', 'id');

        $this->seed(HackathonDemoSeeder::class);

        $this->assertSame($counts, $this->tableCounts());
        $this->assertSame(7, $counts['communities']);
        $this->assertSame(21, $counts['events']);
        $this->assertEquals($startsAt, Event::query()->orderBy('id')->pluck('starts_at', 'id'));
    }

    public function test_hackathon_demo_seeder_keeps_existing_records_untouched(): void
    {
        $this->seed();
        $foreignCommunity = Community::factory()->create([
            'name' => 'ESPOL Ciberseguridad',
            'slug' => 'espol-ciberseguridad',
            'description' => 'Comunidad real que no pertenece a la demo.',
        ]);
        $tawsEvent = Event::query()->where('title', 'Hackathon TAWS')->sole();
        $tawsSnapshot = $tawsEvent->only(['title', 'description', 'starts_at', 'capacity', 'status']);

        $this->seed(HackathonDemoSeeder::class);

        $foreignCommunity->refresh();
        $this->assertSame('Comunidad real que no pertenece a la demo.', $foreignCommunity->description);
        $this->assertSame(0, $foreignCommunity->events()->count());
        $this->assertEquals($tawsSnapshot, $tawsEvent->refresh()->only(['title', 'description', 'starts_at', 'capacity', 'status']));
        $this->assertDatabaseMissing('events', ['title' => 'CTF de iniciación a la ciberseguridad']);
        $this->assertDatabaseHas('events', ['title' => 'Taller de React desde cero']);
    }

    public function test_public_catalogue_lists_only_upcoming_published_demo_events(): void
    {
        $this->seed();
        $this->seed(HackathonDemoSeeder::class);

        $response = $this->getJson('/api/events?per_page=50')->assertOk();
        $titles = collect($response->json('data'))->pluck('title');

        $this->assertSame(19, $response->json('meta.total'));
        $this->assertNotContains('Taller de redes neuronales', $titles);
        $this->assertNotContains('Charla de bienvenida al Club de IA', $titles);

        $fullEvent = collect($response->json('data'))->firstWhere('title', 'Taller práctico de aprendizaje automático');
        $this->assertSame(0, $fullEvent['available_capacity']);
        $this->assertSame(
            EventStatus::Cancelled,
            Event::query()->where('title', 'Taller de redes neuronales')->sole()->status,
        );
    }

    /**
     * @return array<string, int>
     */
    private function tableCounts(): array
    {
        return collect(['users', 'communities', 'community_memberships', 'events', 'registrations'])
            ->mapWithKeys(fn (string $table) => [$table => $this->getConnection()->table($table)->count()])
            ->all();
    }
}
