<?php

namespace Tests\Feature;

use App\Enums\MembershipStatus;
use App\Models\Community;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CommunityMembershipApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_membership_routes_require_authentication(): void
    {
        $this->seed();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->postJson('/api/communities/'.$community->id.'/membership-requests')->assertUnauthorized();
        $this->deleteJson('/api/communities/'.$community->id.'/membership-requests')->assertUnauthorized();
        $this->getJson('/api/me/memberships')->assertUnauthorized();
    }

    public function test_user_can_create_a_pending_member_request(): void
    {
        $this->seed();
        $student = $this->student();
        $community = Community::factory()->create(['name' => 'CIAP']);

        $this->authenticatedPost($student, '/api/communities/'.$community->id.'/membership-requests', [
            'user_id' => User::query()->where('email', 'organizer@espol.edu.ec')->sole()->id,
            'community_role_id' => CommunityRole::query()->where('code', 'tutor')->sole()->id,
            'status' => MembershipStatus::Active->value,
        ])
            ->assertCreated()
            ->assertJsonPath('data.community.id', $community->id)
            ->assertJsonPath('data.community.slug', 'ciap')
            ->assertJsonPath('data.role.code', 'member')
            ->assertJsonPath('data.status.code', 'pending');

        $this->assertDatabaseHas('community_memberships', [
            'community_id' => $community->id,
            'user_id' => $student->id,
            'community_role_id' => CommunityRole::query()->where('code', 'member')->sole()->id,
            'status' => MembershipStatus::Pending->value,
        ]);
    }

    public function test_pending_and_active_memberships_cannot_request_again(): void
    {
        $this->seed();
        $student = $this->student();
        $pendingCommunity = Community::factory()->create(['name' => 'Comunidad pendiente']);

        $this->authenticatedPost($student, '/api/communities/'.$pendingCommunity->id.'/membership-requests')
            ->assertCreated();

        $this->authenticatedPost($student, '/api/communities/'.$pendingCommunity->id.'/membership-requests')
            ->assertConflict();

        $activeCommunity = Community::query()->where('name', 'TAWS')->sole();

        $this->authenticatedPost($student, '/api/communities/'.$activeCommunity->id.'/membership-requests')
            ->assertConflict();

        $activeTutorCommunity = Community::factory()->create(['name' => 'Comunidad tutor activa']);
        $this->createMembership($student, $activeTutorCommunity, 'tutor', 'active');

        $this->authenticatedPost($student, '/api/communities/'.$activeTutorCommunity->id.'/membership-requests')
            ->assertConflict();
    }

    public function test_inactive_communities_reject_new_and_reactivated_membership_requests(): void
    {
        $this->seed();
        $student = $this->student();

        $newCommunity = Community::factory()->create([
            'name' => 'Comunidad inactiva nueva',
            'is_active' => false,
        ]);

        $this->authenticatedPost($student, '/api/communities/'.$newCommunity->id.'/membership-requests')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'No puedes solicitar una membresía en una comunidad inactiva.');

        $rejectedCommunity = Community::factory()->create([
            'name' => 'Comunidad inactiva rechazada',
            'is_active' => false,
        ]);
        $membership = $this->createMembership($student, $rejectedCommunity, 'member', 'rejected');

        $this->authenticatedPost($student, '/api/communities/'.$rejectedCommunity->id.'/membership-requests')
            ->assertUnprocessable()
            ->assertJsonPath('message', 'No puedes solicitar una membresía en una comunidad inactiva.');

        $this->assertDatabaseHas('community_memberships', [
            'id' => $membership->id,
            'status' => MembershipStatus::Rejected->value,
        ]);
    }

    public function test_user_can_leave_a_membership_in_an_inactive_community(): void
    {
        $this->seed();
        $student = $this->student();
        $community = Community::factory()->create([
            'name' => 'Comunidad inactiva para salir',
            'is_active' => false,
        ]);
        $this->createMembership($student, $community, 'member', 'active');

        $this->authenticatedDelete($student, '/api/communities/'.$community->id.'/membership-requests')
            ->assertOk()
            ->assertJsonPath('data.status.code', 'left');
    }

    public function test_rejected_and_left_memberships_are_reactivated_as_pending_members(): void
    {
        $this->seed();
        $student = $this->student();

        foreach (['rejected', 'left'] as $statusCode) {
            $community = Community::factory()->create(['name' => 'Reintento '.$statusCode]);
            $membership = $this->createMembership($student, $community, 'member', $statusCode);
            $membership->update([
                'reviewed_at' => now(),
                'reviewed_by' => User::query()->where('email', 'organizer@espol.edu.ec')->sole()->id,
            ]);

            $this->authenticatedPost($student, '/api/communities/'.$community->id.'/membership-requests')
                ->assertOk()
                ->assertJsonPath('data.role.code', 'member')
                ->assertJsonPath('data.status.code', 'pending')
                ->assertJsonPath('data.reviewed_at', null);

            $this->assertDatabaseHas('community_memberships', [
                'id' => $membership->id,
                'status' => MembershipStatus::Pending->value,
                'reviewed_at' => null,
                'reviewed_by' => null,
            ]);
        }
    }

    public function test_user_can_leave_pending_member_and_tutor_memberships(): void
    {
        $this->seed();
        $student = $this->student();

        $pendingCommunity = Community::factory()->create(['name' => 'Salida pendiente']);
        $this->authenticatedPost($student, '/api/communities/'.$pendingCommunity->id.'/membership-requests')
            ->assertCreated();

        $activeMemberCommunity = Community::factory()->create(['name' => 'Salida miembro']);
        $this->createMembership($student, $activeMemberCommunity, 'member', 'active');

        $activeTutorCommunity = Community::factory()->create(['name' => 'Salida tutor']);
        $this->createMembership($student, $activeTutorCommunity, 'tutor', 'active');

        foreach ([$pendingCommunity, $activeMemberCommunity, $activeTutorCommunity] as $community) {
            $this->authenticatedDelete($student, '/api/communities/'.$community->id.'/membership-requests')
                ->assertOk()
                ->assertJsonPath('data.status.code', 'left');

            $this->assertDatabaseHas('community_memberships', [
                'community_id' => $community->id,
                'user_id' => $student->id,
                'status' => MembershipStatus::Left->value,
            ]);
        }
    }

    public function test_active_organizer_cannot_leave_the_community(): void
    {
        $this->seed();
        $organizer = User::query()->where('email', 'organizer@espol.edu.ec')->sole();
        $community = Community::query()->where('name', 'TAWS')->sole();

        $this->authenticatedDelete($organizer, '/api/communities/'.$community->id.'/membership-requests')
            ->assertConflict();

        $this->assertDatabaseHas('community_memberships', [
            'community_id' => $community->id,
            'user_id' => $organizer->id,
            'status' => MembershipStatus::Active->value,
            'community_role_id' => CommunityRole::query()->where('code', 'organizer')->sole()->id,
        ]);
    }

    public function test_user_can_list_all_own_membership_states_with_pagination(): void
    {
        $this->seed();
        $student = $this->student();
        $this->createMembership($student, Community::factory()->create(['name' => 'A Pendiente']), 'member', 'pending');
        $this->createMembership($student, Community::factory()->create(['name' => 'B Rechazada']), 'member', 'rejected');
        $this->createMembership($student, Community::factory()->create(['name' => 'C Retirada']), 'member', 'left');

        $otherUser = User::factory()->create();
        $this->createMembership($otherUser, Community::factory()->create(['name' => 'Otra comunidad']), 'member', 'active');

        $this->authenticatedGet($student, '/api/me/memberships?per_page=50')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'community',
                    'role',
                    'status',
                    'requested_at',
                    'reviewed_at',
                ]],
                'links',
                'meta',
            ])
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.community.name', 'A Pendiente')
            ->assertJsonPath('data.0.status.code', 'pending')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonMissing(['name' => 'Otra comunidad']);
    }

    public function test_membership_list_validates_pagination(): void
    {
        $this->seed();
        $student = $this->student();

        $this->authenticatedGet($student, '/api/me/memberships?page=0&per_page=51')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['page', 'per_page']);
    }

    public function test_missing_membership_cannot_be_cancelled(): void
    {
        $this->seed();
        $student = $this->student();
        $community = Community::factory()->create(['name' => 'Sin membresía']);

        $this->authenticatedDelete($student, '/api/communities/'.$community->id.'/membership-requests')
            ->assertNotFound();
    }

    public function test_only_the_communitys_organizer_can_review_membership_requests(): void
    {
        $this->seed();
        $community = Community::factory()->create(['name' => 'Comunidad revisión']);
        $organizer = User::factory()->create();
        $this->createMembership($organizer, $community, 'organizer', 'active');
        $requester = User::factory()->create();
        $membership = $this->createMembership($requester, $community, 'member', 'pending');

        $otherCommunity = Community::factory()->create(['name' => 'Otra comunidad organizador']);
        $otherOrganizer = User::factory()->create();
        $this->createMembership($otherOrganizer, $otherCommunity, 'organizer', 'active');

        $this->getJson('/api/communities/'.$community->id.'/membership-requests')->assertUnauthorized();

        $this->authenticatedGet($requester, '/api/communities/'.$community->id.'/membership-requests')
            ->assertForbidden();

        $this->authenticatedGet($otherOrganizer, '/api/communities/'.$community->id.'/membership-requests')
            ->assertForbidden();

        $this->authenticatedPatch($otherOrganizer, '/api/community-memberships/'.$membership->id.'/approve')
            ->assertForbidden();
    }

    public function test_organizer_can_list_approve_and_reject_membership_requests(): void
    {
        $this->seed();
        $community = Community::factory()->create(['name' => 'Comunidad revisión de miembros']);
        $organizer = User::factory()->create();
        $this->createMembership($organizer, $community, 'organizer', 'active');

        $approvedCandidate = User::factory()->create(['email' => 'aprobado@espol.edu.ec']);
        $rejectedCandidateUser = User::factory()->create(['email' => 'rechazado@espol.edu.ec']);

        $this->createMembership($approvedCandidate, $community, 'member', 'pending');
        $rejectedCandidate = $this->createMembership($rejectedCandidateUser, $community, 'member', 'pending');

        $this->authenticatedGet($organizer, '/api/communities/'.$community->id.'/membership-requests')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'community' => ['id', 'name', 'slug', 'description', 'image_url'],
                    'role' => ['code', 'name'],
                    'status' => ['code', 'name'],
                    'requested_by' => ['id', 'first_name', 'last_name', 'email'],
                    'requested_at',
                    'reviewed_at',
                ]],
                'links',
                'meta',
            ])
            ->assertJsonPath('data.0.community.id', $community->id)
            ->assertJsonFragment(['email' => 'aprobado@espol.edu.ec'])
            ->assertJsonFragment(['email' => 'rechazado@espol.edu.ec']);

        $approvedMembership = CommunityMembership::query()
            ->where('community_id', $community->id)
            ->where('user_id', $approvedCandidate->id)
            ->sole();

        $this->authenticatedPatch($organizer, '/api/community-memberships/'.$approvedMembership->id.'/approve')
            ->assertOk()
            ->assertJsonPath('data.status.code', 'active')
            ->assertJsonPath('data.role.code', 'member');

        $this->assertDatabaseHas('community_memberships', [
            'id' => $approvedMembership->id,
            'status' => MembershipStatus::Active->value,
            'reviewed_by' => $organizer->id,
        ]);

        $this->authenticatedPatch($organizer, '/api/community-memberships/'.$rejectedCandidate->id.'/reject')
            ->assertOk()
            ->assertJsonPath('data.status.code', 'rejected');

        $this->assertDatabaseHas('community_memberships', [
            'id' => $rejectedCandidate->id,
            'status' => MembershipStatus::Rejected->value,
            'reviewed_by' => $organizer->id,
        ]);

        $this->authenticatedGet($organizer, '/api/communities/'.$community->id.'/membership-requests')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_a_processed_membership_request_cannot_be_reviewed_twice(): void
    {
        $this->seed();
        $community = Community::factory()->create(['name' => 'Comunidad doble revisión']);
        $organizer = User::factory()->create();
        $this->createMembership($organizer, $community, 'organizer', 'active');
        $membership = $this->createMembership(User::factory()->create(), $community, 'member', 'pending');

        $this->authenticatedPatch($organizer, '/api/community-memberships/'.$membership->id.'/approve')
            ->assertOk();

        $this->authenticatedPatch($organizer, '/api/community-memberships/'.$membership->id.'/reject')
            ->assertConflict();
    }

    private function student(): User
    {
        return User::query()->where('email', 'student@espol.edu.ec')->sole();
    }

    private function createMembership(
        User $user,
        Community $community,
        string $roleCode,
        string $statusCode,
    ): CommunityMembership {
        return CommunityMembership::factory()->create([
            'community_id' => $community->id,
            'user_id' => $user->id,
            'community_role_id' => CommunityRole::query()->where('code', $roleCode)->sole()->id,
            'status' => $statusCode,
        ]);
    }

    private function authenticatedGet(User $user, string $uri)
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->getJson($uri);
    }

    private function authenticatedPost(User $user, string $uri, array $payload = [])
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->postJson($uri, $payload);
    }

    private function authenticatedDelete(User $user, string $uri)
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->deleteJson($uri);
    }

    private function authenticatedPatch(User $user, string $uri, array $payload = [])
    {
        return $this->actingAs($user, 'web')
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/')
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->patchJson($uri, $payload);
    }
}
