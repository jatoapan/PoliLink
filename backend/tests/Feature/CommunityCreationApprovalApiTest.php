<?php

namespace Tests\Feature;

use App\Enums\MembershipStatus;
use App\Models\Community;
use App\Models\CommunityCreationRequest;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CommunityCreationApprovalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_an_admin_can_review_community_creation_requests(): void
    {
        $this->seed();
        $request = CommunityCreationRequest::query()->where('name', 'Club de Robótica')->sole();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();

        $this->getJson('/api/admin/community-creation-requests')->assertUnauthorized();
        $this->actingAs($organizer, 'sanctum')
            ->getJson('/api/admin/community-creation-requests')
            ->assertForbidden();
        $this->actingAs($organizer, 'sanctum')
            ->patchJson("/api/admin/community-creation-requests/{$request->id}/approve")
            ->assertForbidden();
    }

    public function test_admin_can_approve_a_request_and_promote_the_requester_to_organizer(): void
    {
        Storage::fake('public');
        $this->seed();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $admin = User::query()->where('email', 'admin@espol.edu.ec')->sole();

        $creationResponse = $this->authenticatedMultipartPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad de Diseño',
            'description' => 'Comunidad de diseño de ESPOL.',
            'image' => UploadedFile::fake()->image('design.png'),
        ])->assertCreated();

        $requestId = $creationResponse->json('data.id');
        $request = CommunityCreationRequest::query()->findOrFail($requestId);
        $temporaryPath = $request->image_path;

        $this->assertNotNull($temporaryPath);
        $this->assertStringStartsWith('community-requests/', $temporaryPath);
        Storage::disk('public')->assertExists($temporaryPath);

        $this->authenticatedGet($admin, '/api/admin/community-creation-requests')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Club de Robótica')
            ->assertJsonFragment(['name' => 'Comunidad de Diseño']);

        $approvalResponse = $this->authenticatedPatch(
            $admin,
            "/api/admin/community-creation-requests/{$requestId}/approve",
        );

        $approvalResponse
            ->assertOk()
            ->assertJsonPath('data.status.code', 'approved')
            ->assertJsonPath('data.community.name', 'Comunidad de Diseño')
            ->assertJsonPath('data.community.slug', 'comunidad-de-diseno');

        $community = Community::query()->where('name', 'Comunidad de Diseño')->sole();
        $request->refresh();
        $membership = CommunityMembership::query()
            ->where('community_id', $community->id)
            ->where('user_id', $student->id)
            ->sole();

        $this->assertTrue($community->is_active);
        $this->assertSame('comunidad-de-diseno', $community->slug);
        $this->assertStringStartsWith('communities/', $community->image_path);
        $this->assertSame($community->image_path, $request->image_path);
        $this->assertSame($community->id, $request->community_id);
        $this->assertSame('approved', $request->status->value);
        $this->assertSame($admin->id, $request->reviewed_by);
        $this->assertSame(
            CommunityRole::query()->where('code', 'organizer')->sole()->id,
            $membership->community_role_id,
        );
        $this->assertSame(
            MembershipStatus::Active->value,
            $membership->status->value,
        );
        Storage::disk('public')->assertMissing($temporaryPath);
        Storage::disk('public')->assertExists($community->image_path);
        $this->assertStringContainsString('/storage/communities/', $approvalResponse->json('data.image_url'));
    }

    public function test_admin_can_reject_a_request_and_the_temporary_image_is_removed(): void
    {
        Storage::fake('public');
        $this->seed();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $admin = User::query()->where('email', 'admin@espol.edu.ec')->sole();

        $creationResponse = $this->authenticatedMultipartPost($student, '/api/community-creation-requests', [
            'name' => 'Comunidad Rechazada',
            'image' => UploadedFile::fake()->image('rejected.webp'),
        ])->assertCreated();
        $requestId = $creationResponse->json('data.id');
        $request = CommunityCreationRequest::query()->findOrFail($requestId);
        $temporaryPath = $request->image_path;

        $this->assertNotNull($temporaryPath);
        $this->authenticatedPatch($admin, "/api/admin/community-creation-requests/{$requestId}/reject", [
            'rejection_reason' => 'La propuesta necesita más información.',
        ])
            ->assertOk()
            ->assertJsonPath('data.status.code', 'rejected')
            ->assertJsonPath('data.image_url', null)
            ->assertJsonPath('data.rejection_reason', 'La propuesta necesita más información.');

        $request->refresh();
        $this->assertNull($request->image_path);
        $this->assertSame('rejected', $request->status->value);
        Storage::disk('public')->assertMissing($temporaryPath);
        $this->assertDatabaseMissing('communities', ['name' => 'Comunidad Rechazada']);
    }

    public function test_a_processed_request_cannot_be_reviewed_twice(): void
    {
        $this->seed();
        $admin = User::query()->where('email', 'admin@espol.edu.ec')->sole();
        $request = CommunityCreationRequest::query()->where('name', 'Club de Robótica')->sole();

        $this->authenticatedPatch($admin, "/api/admin/community-creation-requests/{$request->id}/reject", [
            'rejection_reason' => 'Revisión inicial.',
        ])->assertOk();

        $this->authenticatedPatch($admin, "/api/admin/community-creation-requests/{$request->id}/approve")
            ->assertConflict();
    }

    private function authenticatedGet(User $user, string $uri)
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Accept', 'application/json')
            ->getJson($uri);
    }

    private function authenticatedPatch(User $user, string $uri, array $payload = [])
    {
        return $this->actingAs($user, 'sanctum')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withHeader('Accept', 'application/json')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->patchJson($uri, $payload);
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
}
