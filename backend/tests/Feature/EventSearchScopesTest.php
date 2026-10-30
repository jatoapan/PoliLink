<?php

namespace Tests\Feature;

use App\Enums\EventStatus;
use App\Models\Community;
use App\Models\Event;
use App\Models\EventCategory;
use App\Models\EventModality;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventSearchScopesTest extends TestCase
{
    use RefreshDatabase;

    public function test_publicly_listed_scope_excludes_cancelled_past_and_inactive_community_events(): void
    {
        $listed = $this->event(['title' => 'Publicado futuro']);
        $this->event(['title' => 'Cancelado', 'status' => EventStatus::Cancelled->value]);
        $this->event(['title' => 'Pasado', 'starts_at' => now()->subMinute()]);
        $this->event([
            'title' => 'Comunidad inactiva',
            'community_id' => Community::factory()->create(['is_active' => false])->id,
        ]);

        $this->assertSame([$listed->id], Event::query()->publiclyListed()->pluck('id')->all());
    }

    public function test_category_and_modality_scopes_filter_by_any_of_the_given_codes(): void
    {
        $workshop = EventCategory::factory()->create(['code' => 'workshop']);
        $talk = EventCategory::factory()->create(['code' => 'talk']);
        $fair = EventCategory::factory()->create(['code' => 'fair']);
        $inPerson = EventModality::factory()->create(['code' => 'in_person']);
        $virtual = EventModality::factory()->create(['code' => 'virtual']);

        $workshopInPerson = $this->event(['event_category_id' => $workshop->id, 'event_modality_id' => $inPerson->id]);
        $talkVirtual = $this->event(['event_category_id' => $talk->id, 'event_modality_id' => $virtual->id]);
        $this->event(['event_category_id' => $fair->id, 'event_modality_id' => $inPerson->id]);

        $this->assertEqualsCanonicalizing(
            [$workshopInPerson->id, $talkVirtual->id],
            Event::query()->inCategories(['workshop', 'talk'])->pluck('id')->all(),
        );
        $this->assertSame(
            [$workshopInPerson->id],
            Event::query()->inCategories(['workshop', 'talk'])->inModalities(['in_person'])->pluck('id')->all(),
        );
        $this->assertSame([], Event::query()->inCategories(['unknown'])->pluck('id')->all());
    }

    private function event(array $attributes = []): Event
    {
        return Event::factory()->create([
            'status' => EventStatus::Published->value,
            'starts_at' => now()->addDays(3),
            ...$attributes,
        ]);
    }
}
