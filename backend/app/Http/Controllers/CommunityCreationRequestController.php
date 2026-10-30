<?php

namespace App\Http\Controllers;

use App\Enums\CommunityCreationRequestStatus;
use App\Enums\MembershipStatus;
use App\Http\Requests\ListCommunityCreationRequestsRequest;
use App\Http\Requests\RejectCommunityCreationRequest;
use App\Http\Requests\StoreCommunityCreationRequest;
use App\Http\Resources\CommunityCreationRequestResource;
use App\Models\Community;
use App\Models\CommunityCreationRequest as CommunityCreationRequestModel;
use App\Models\CommunityMembership;
use App\Models\CommunityRole;
use App\Services\CommunitySlugService;
use App\Services\PublicImageStorageService;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class CommunityCreationRequestController extends Controller
{
    public function __construct(
        private readonly PublicImageStorageService $imageStorage,
        private readonly CommunitySlugService $slugService,
    ) {}

    public function store(StoreCommunityCreationRequest $request): JsonResponse
    {
        $data = $request->validated();
        $slug = $this->slugService->fromName($data['name']);
        $this->ensureNameCanBeRequested($data['name'], $slug);

        $imagePath = isset($data['image'])
            ? $this->imageStorage->store($data['image'], 'community-requests')
            : null;

        try {
            $creationRequest = CommunityCreationRequestModel::query()->create([
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'image_path' => $imagePath,
                'requested_by' => $request->user()->id,
                'status' => CommunityCreationRequestStatus::Pending->value,
            ]);
        } catch (Throwable $exception) {
            $this->imageStorage->delete($imagePath);

            if ($this->isPendingSlugUniqueViolation($exception)) {
                throw ValidationException::withMessages([
                    'name' => 'Ya existe una solicitud pendiente con ese identificador.',
                ]);
            }

            throw $exception;
        }

        return (new CommunityCreationRequestResource($creationRequest))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function mine(ListCommunityCreationRequestsRequest $request): JsonResponse
    {
        $requests = CommunityCreationRequestModel::query()
            ->where('requested_by', $request->user()->id)
            ->with('community')
            ->orderByDesc('created_at')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return CommunityCreationRequestResource::collection($requests)->response();
    }

    public function adminIndex(ListCommunityCreationRequestsRequest $request): JsonResponse
    {
        $statusCode = $request->validated('status', CommunityCreationRequestStatus::Pending->value);

        $requests = CommunityCreationRequestModel::query()
            ->where('status', $statusCode)
            ->with(['requester', 'community'])
            ->orderBy('created_at')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return CommunityCreationRequestResource::collection($requests)->response();
    }

    public function approve(Request $request, CommunityCreationRequestModel $communityCreationRequest): JsonResponse
    {
        $sourceImagePath = null;
        $targetImagePath = null;

        try {
            $approvedRequest = DB::transaction(function () use (
                $request,
                $communityCreationRequest,
                &$sourceImagePath,
                &$targetImagePath,
            ) {
                $lockedRequest = CommunityCreationRequestModel::query()
                    ->whereKey($communityCreationRequest->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->ensurePending($lockedRequest);
                abort_if(
                    Community::query()
                        ->where(function ($query) use ($lockedRequest) {
                            $query
                                ->where('name', $lockedRequest->name)
                                ->orWhere('slug', $lockedRequest->slug);
                        })
                        ->exists(),
                    Response::HTTP_CONFLICT,
                    'Ya existe una comunidad con ese nombre o identificador.',
                );

                $sourceImagePath = $lockedRequest->image_path;
                $targetImagePath = $sourceImagePath
                    ? $this->imageStorage->move($sourceImagePath, 'communities')
                    : null;

                $community = Community::query()->create([
                    'name' => $lockedRequest->name,
                    'slug' => $lockedRequest->slug,
                    'description' => $lockedRequest->description,
                    'is_active' => true,
                    'image_path' => $targetImagePath,
                ]);

                CommunityMembership::query()->create([
                    'community_id' => $community->id,
                    'user_id' => $lockedRequest->requested_by,
                    'community_role_id' => CommunityRole::query()->where('code', 'organizer')->sole()->id,
                    'status' => MembershipStatus::Active->value,
                    'requested_at' => $lockedRequest->created_at,
                    'reviewed_at' => now(),
                    'reviewed_by' => $request->user()->id,
                ]);

                $lockedRequest->update([
                    'status' => CommunityCreationRequestStatus::Approved->value,
                    'reviewed_by' => $request->user()->id,
                    'reviewed_at' => now(),
                    'community_id' => $community->id,
                    'image_path' => $targetImagePath,
                ]);

                return $lockedRequest->load(['requester', 'community']);
            });
        } catch (Throwable $exception) {
            $this->restoreMovedImage($targetImagePath, $sourceImagePath);

            throw $exception;
        }

        return CommunityCreationRequestResource::make($approvedRequest)->response();
    }

    public function reject(
        RejectCommunityCreationRequest $request,
        CommunityCreationRequestModel $communityCreationRequest,
    ): CommunityCreationRequestResource {
        $imagePath = null;

        $rejectedRequest = DB::transaction(function () use (
            $request,
            $communityCreationRequest,
            &$imagePath,
        ) {
            $lockedRequest = CommunityCreationRequestModel::query()
                ->whereKey($communityCreationRequest->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->ensurePending($lockedRequest);
            $imagePath = $lockedRequest->image_path;

            $lockedRequest->update([
                'status' => CommunityCreationRequestStatus::Rejected->value,
                'reviewed_by' => $request->user()->id,
                'reviewed_at' => now(),
                'rejection_reason' => $request->validated('rejection_reason'),
                'image_path' => null,
            ]);

            return $lockedRequest->load(['requester', 'community']);
        });

        $this->imageStorage->delete($imagePath);

        return new CommunityCreationRequestResource($rejectedRequest);
    }

    private function ensureNameCanBeRequested(string $name, string $slug): void
    {
        $communityExists = Community::query()
            ->where(function ($query) use ($name, $slug) {
                $query
                    ->where('name', $name)
                    ->orWhere('slug', $slug);
            })
            ->exists();
        $pendingRequestExists = CommunityCreationRequestModel::query()
            ->where(function ($query) use ($name, $slug) {
                $query
                    ->where('name', $name)
                    ->orWhere('slug', $slug);
            })
            ->where('status', CommunityCreationRequestStatus::Pending->value)
            ->exists();

        if ($communityExists || $pendingRequestExists) {
            throw ValidationException::withMessages([
                'name' => 'Ya existe una comunidad o solicitud pendiente con ese nombre o identificador.',
            ]);
        }
    }

    private function ensurePending(CommunityCreationRequestModel $creationRequest): void
    {
        abort_unless(
            $creationRequest->status === CommunityCreationRequestStatus::Pending,
            Response::HTTP_CONFLICT,
            'La solicitud ya fue procesada.',
        );
    }

    private function isPendingSlugUniqueViolation(Throwable $exception): bool
    {
        if (! $exception instanceof QueryException) {
            return false;
        }

        $message = strtolower($exception->getMessage());

        return str_contains($message, 'community_creation_requests_pending_slug_unique')
            || str_contains($message, 'community_creation_requests.pending_slug')
            || str_contains($message, 'community_creation_requests.slug');
    }

    private function restoreMovedImage(?string $targetPath, ?string $sourcePath): void
    {
        if ($targetPath === null) {
            return;
        }

        try {
            if ($sourcePath !== null) {
                $this->imageStorage->moveTo($targetPath, $sourcePath);
            } else {
                $this->imageStorage->delete($targetPath);
            }
        } catch (Throwable) {
            // The original exception is more useful to the API caller.
        }
    }
}
