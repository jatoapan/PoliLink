<?php

namespace App\Http\Controllers;

use App\Enums\MembershipStatus;
use App\Http\Requests\ListCommunityMembershipsRequest;
use App\Http\Requests\ListMyMembershipsRequest;
use App\Http\Resources\CommunityMembershipResource;
use App\Models\Community;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class CommunityMembershipController extends Controller
{
    public function store(Request $request, Community $community): JsonResponse
    {
        $user = $request->user();
        [$membership, $wasReactivated] = DB::transaction(function () use ($community, $user) {
            $lockedCommunity = Community::query()
                ->lockForUpdate()
                ->findOrFail($community->id);

            abort_unless(
                $lockedCommunity->is_active,
                Response::HTTP_UNPROCESSABLE_ENTITY,
                'No puedes solicitar una membresía en una comunidad inactiva.',
            );

            $membership = CommunityMembership::query()
                ->where('community_id', $community->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            $memberRoleId = CommunityRole::query()->where('code', 'member')->sole()->id;

            if ($membership === null) {
                return [
                    CommunityMembership::query()->create([
                        'community_id' => $community->id,
                        'user_id' => $user->id,
                        'community_role_id' => $memberRoleId,
                        'status' => MembershipStatus::Pending->value,
                        'requested_at' => now(),
                    ]),
                    false,
                ];
            }

            $membership->load('role');

            abort_if(
                in_array($membership->status, [MembershipStatus::Pending, MembershipStatus::Active], true),
                Response::HTTP_CONFLICT,
                $membership->status === MembershipStatus::Pending
                    ? 'Ya tienes una solicitud pendiente para esta comunidad.'
                    : 'Ya tienes una membresía activa en esta comunidad.',
            );

            $membership->update([
                'community_role_id' => $memberRoleId,
                'status' => MembershipStatus::Pending->value,
                'requested_at' => now(),
                'reviewed_at' => null,
                'reviewed_by' => null,
            ]);

            return [$membership, true];
        });

        return (new CommunityMembershipResource($this->loadMembership($membership)))
            ->response()
            ->setStatusCode($wasReactivated ? Response::HTTP_OK : Response::HTTP_CREATED);
    }

    public function destroy(Request $request, Community $community): CommunityMembershipResource
    {
        $user = $request->user();
        $membership = DB::transaction(function () use ($community, $user) {
            $membership = CommunityMembership::query()
                ->where('community_id', $community->id)
                ->where('user_id', $user->id)
                ->lockForUpdate()
                ->first();

            abort_if(
                $membership === null,
                Response::HTTP_NOT_FOUND,
                'No tienes una solicitud o membresía en esta comunidad.',
            );

            $membership->load('role');

            abort_unless(
                in_array($membership->status, [MembershipStatus::Pending, MembershipStatus::Active], true),
                Response::HTTP_NOT_FOUND,
                'No tienes una solicitud o membresía cancelable en esta comunidad.',
            );

            abort_if(
                $membership->status === MembershipStatus::Active
                    && $membership->role->code === 'organizer',
                Response::HTTP_CONFLICT,
                'Un organizer activo no puede abandonar la comunidad todavía.',
            );

            $membership->update([
                'status' => MembershipStatus::Left->value,
            ]);

            return $membership;
        });

        return new CommunityMembershipResource($this->loadMembership($membership));
    }

    public function mine(ListMyMembershipsRequest $request)
    {
        $memberships = CommunityMembership::query()
            ->where('user_id', $request->user()->id)
            ->join('communities', 'communities.id', '=', 'community_memberships.community_id')
            ->select('community_memberships.*')
            ->with(['community', 'role'])
            ->orderBy('communities.name')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return CommunityMembershipResource::collection($memberships);
    }

    public function index(ListCommunityMembershipsRequest $request, Community $community): JsonResponse
    {
        Gate::forUser($request->user())->authorize('manageMemberships', $community);

        $statusCode = $request->validated('status', MembershipStatus::Pending->value);

        $memberships = CommunityMembership::query()
            ->where('community_id', $community->id)
            ->where('status', $statusCode)
            ->with(['user', 'role', 'community'])
            ->orderBy('requested_at')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return CommunityMembershipResource::collection($memberships)->response();
    }

    public function approve(Request $request, CommunityMembership $communityMembership): JsonResponse
    {
        $approvedMembership = DB::transaction(function () use ($request, $communityMembership) {
            $lockedMembership = CommunityMembership::query()
                ->whereKey($communityMembership->id)
                ->lockForUpdate()
                ->firstOrFail();

            Gate::forUser($request->user())->authorize('manageMemberships', $lockedMembership->community);

            $this->ensurePending($lockedMembership);

            $lockedMembership->update([
                'status' => MembershipStatus::Active->value,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
            ]);

            return $lockedMembership;
        });

        return (new CommunityMembershipResource($this->loadReviewedMembership($approvedMembership)))->response();
    }

    public function reject(Request $request, CommunityMembership $communityMembership): JsonResponse
    {
        $rejectedMembership = DB::transaction(function () use ($request, $communityMembership) {
            $lockedMembership = CommunityMembership::query()
                ->whereKey($communityMembership->id)
                ->lockForUpdate()
                ->firstOrFail();

            Gate::forUser($request->user())->authorize('manageMemberships', $lockedMembership->community);

            $this->ensurePending($lockedMembership);

            $lockedMembership->update([
                'status' => MembershipStatus::Rejected->value,
                'reviewed_at' => now(),
                'reviewed_by' => $request->user()->id,
            ]);

            return $lockedMembership;
        });

        return (new CommunityMembershipResource($this->loadReviewedMembership($rejectedMembership)))->response();
    }

    private function ensurePending(CommunityMembership $membership): void
    {
        abort_unless(
            $membership->status === MembershipStatus::Pending,
            Response::HTTP_CONFLICT,
            'La solicitud ya fue procesada.',
        );
    }

    private function loadMembership(CommunityMembership $membership): CommunityMembership
    {
        return $membership->load(['community', 'role']);
    }

    private function loadReviewedMembership(CommunityMembership $membership): CommunityMembership
    {
        return $membership->load(['community', 'role', 'user']);
    }
}
