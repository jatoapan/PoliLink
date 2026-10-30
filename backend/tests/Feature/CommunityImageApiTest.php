<?php

namespace Tests\Feature;

use App\Models\Community;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommunityImageApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_organizer_can_replace_and_remove_a_community_logo(): void
    {
        Storage::fake('public');
        $this->seed();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->authenticatedMultipartPost($organizer, "/api/communities/{$community->id}/image", [
            'image' => UploadedFile::fake()->image('first.jpg'),
        ])->assertOk();
        $community->refresh();
        $previousPath = $community->image_path;

        $this->assertStringStartsWith('communities/', $previousPath);
        Storage::disk('public')->assertExists($previousPath);

        $this->authenticatedMultipartPost($organizer, "/api/communities/{$community->id}/image", [
            'image' => UploadedFile::fake()->image('second.png'),
        ])
            ->assertOk()
            ->assertJsonPath('data.name', 'TAWS');
        $community->refresh();

        $this->assertNotSame($previousPath, $community->image_path);
        Storage::disk('public')->assertMissing($previousPath);
        Storage::disk('public')->assertExists($community->image_path);
        $currentPath = $community->image_path;

        $this->authenticatedDelete($organizer, "/api/communities/{$community->id}/image")
            ->assertOk()
            ->assertJsonPath('data.image_url', null);

        $community->refresh();
        $this->assertNull($community->image_path);
        Storage::disk('public')->assertMissing($currentPath);
    }

    public function test_only_an_active_organizer_can_manage_the_community_logo(): void
    {
        Storage::fake('public');
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $admin = User::query()->where('email', 'admin@espol.edu.ec')->sole();

        foreach ([$student, $admin] as $user) {
            $this->authenticatedMultipartPost($user, "/api/communities/{$community->id}/image", [
                'image' => UploadedFile::fake()->image('forbidden.jpg'),
            ])->assertForbidden();
        }

        $this->authenticatedMultipartPost(
            User::query()->where('email', 'organizer@espol.edu.ec')->sole(),
            "/api/communities/{$community->id}/image",
            ['image' => UploadedFile::fake()->create('invalid.pdf', 100, 'application/pdf')],
        )->assertUnprocessable();
    }

    public function test_community_image_routes_require_authentication(): void
    {
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->postJson("/api/communities/{$community->id}/image", [
            'image' => UploadedFile::fake()->image('logo.jpg'),
        ])->assertUnauthorized();
        $this->deleteJson("/api/communities/{$community->id}/image")->assertUnauthorized();
    }

    public function test_public_community_resources_expose_a_null_image_url_without_a_logo(): void
    {
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->getJson("/api/communities/{$community->slug}")
            ->assertOk()
            ->assertJsonPath('data.slug', 'taws')
            ->assertJsonPath('data.image_url', null);
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
