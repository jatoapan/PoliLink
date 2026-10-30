<?php

namespace Tests\Feature;

use App\Models\Community;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityDirectoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_discovery_is_public_and_includes_communities_without_events(): void
    {
        $this->seed();
        $community = Community::factory()->create([
            'name' => 'Comunidad sin eventos',
            'description' => 'Una comunidad disponible para descubrir.',
        ]);

        $this->getJson('/api/communities/discover?per_page=50')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'slug', 'description', 'image_url']],
                'links',
                'meta',
            ])
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.name', 'Comunidad sin eventos')
            ->assertJsonPath('data.0.slug', 'comunidad-sin-eventos')
            ->assertJsonPath('data.1.name', 'TAWS')
            ->assertJsonPath('data.0.id', $community->id);
    }

    public function test_discovery_searches_by_name_and_preserves_query_pagination(): void
    {
        $this->seed();
        Community::factory()->create(['name' => 'CIAP']);
        Community::factory()->create(['name' => 'Club de Robótica']);

        $this->getJson('/api/communities/discover?search=ciap&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'CIAP')
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.per_page', 1)
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('links.next', null);
    }

    public function test_discovery_validates_search_and_pagination(): void
    {
        $this->getJson('/api/communities/discover?search='.str_repeat('a', 256))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('search');

        $this->getJson('/api/communities/discover?page=0&per_page=51')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['page', 'per_page']);
    }

    public function test_public_profile_returns_only_community_information(): void
    {
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->getJson('/api/communities/'.$community->slug)
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'name', 'slug', 'description']])
            ->assertJsonPath('data.id', $community->id)
            ->assertJsonPath('data.name', 'TAWS')
            ->assertJsonPath('data.slug', 'taws')
            ->assertJsonMissingPath('data.memberships')
            ->assertJsonMissingPath('data.events');
    }

    public function test_public_profile_returns_not_found_for_unknown_community(): void
    {
        $this->getJson('/api/communities/no-existe')->assertNotFound();
    }

    public function test_public_profile_requires_the_community_slug(): void
    {
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->getJson('/api/communities/'.$community->id)->assertNotFound();
    }

    public function test_inactive_communities_are_hidden_from_public_directory_and_profiles(): void
    {
        $this->seed();
        $inactiveCommunity = Community::factory()->create([
            'name' => 'Comunidad archivada',
            'is_active' => false,
        ]);

        $this->getJson('/api/communities/discover?per_page=50')
            ->assertOk()
            ->assertJsonMissing(['id' => $inactiveCommunity->id]);

        $this->getJson('/api/communities/'.$inactiveCommunity->slug)->assertNotFound();
    }
}
