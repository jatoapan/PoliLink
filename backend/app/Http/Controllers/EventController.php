<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Http\Requests\CancelEventRequest;
use App\Http\Requests\ListEventsRequest;
use App\Http\Requests\StoreEventImageRequest;
use App\Http\Requests\StoreEventRequest;
use App\Http\Requests\UpdateEventRequest;
use App\Http\Resources\EventResource;
use App\Models\Community;
use App\Models\Event;
use App\Services\EventImageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class EventController extends Controller
{
    public function __construct(
        private readonly EventImageService $eventImageService,
    ) {}

    public function index(ListEventsRequest $request)
    {
        $filters = $request->validated();
        $perPage = $filters['per_page'] ?? 12;

        $events = Event::query()
            ->where('status', EventStatus::Published->value)
            ->whereHas('community', fn ($query) => $query->where('is_active', true))
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->when($filters['date'] ?? null, fn ($query, string $date) => $query->whereDate('starts_at', $date))
            ->when($filters['category'] ?? null, fn ($query, string $category) => $query->whereHas(
                'category',
                fn ($query) => $query->where('code', $category),
            ))
            ->when($filters['modality'] ?? null, fn ($query, string $modality) => $query->whereHas(
                'modality',
                fn ($query) => $query->where('code', $modality),
            ))
            ->when($filters['community_id'] ?? null, fn ($query, int $communityId) => $query->whereHas(
                'community',
                fn ($query) => $query->whereKey($communityId)->where('is_active', true),
            ))
            ->with($this->eventRelations())
            ->withCount('activeRegistrations')
            ->orderBy('starts_at')
            ->paginate($perPage)
            ->withQueryString();

        return EventResource::collection($events);
    }

    public function show(Event $event): EventResource
    {
        abort_unless($event->status === EventStatus::Published, Response::HTTP_NOT_FOUND);
        abort_unless($event->community()->where('is_active', true)->exists(), Response::HTTP_NOT_FOUND);

        return new EventResource($this->loadEvent($event));
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $data = $request->validated();
        $organizer = $request->user();

        $community = Community::query()->findOrFail($data['community_id']);
        Gate::forUser($organizer)->authorize('create', [Event::class, $community]);
        $image = $data['image'] ?? null;
        $imagePath = $image ? $this->eventImageService->store($image) : null;

        try {
            $event = Event::query()->create([
                ...Arr::except($data, ['community_id', 'image']),
                'community_id' => $community->id,
                'status' => EventStatus::Published->value,
                'image_path' => $imagePath,
            ]);
        } catch (Throwable $exception) {
            $this->eventImageService->delete($imagePath);

            throw $exception;
        }

        return (new EventResource($this->loadEvent($event)))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateEventRequest $request, Event $event): EventResource
    {
        $data = $request->validated();
        $organizer = $request->user();

        Gate::forUser($organizer)->authorize('update', $event);
        $this->ensureNotCancelled($event);

        $communityId = $data['community_id'] ?? $event->community_id;
        $community = Community::query()->findOrFail($communityId);
        Gate::forUser($organizer)->authorize('create', [Event::class, $community]);

        $event->fill(Arr::except($data, ['community_id']));
        $event->community_id = $community->id;
        $event->save();

        return new EventResource($this->loadEvent($event));
    }

    public function storeImage(StoreEventImageRequest $request, Event $event): EventResource
    {
        $organizer = $request->user();

        Gate::forUser($organizer)->authorize('update', $event);
        $this->ensureNotCancelled($event);

        $previousImagePath = $event->image_path;
        $imagePath = $this->eventImageService->store($request->file('image'));

        try {
            $event->update(['image_path' => $imagePath]);
        } catch (Throwable $exception) {
            $this->eventImageService->delete($imagePath);

            throw $exception;
        }

        $this->eventImageService->delete($previousImagePath);

        return new EventResource($this->loadEvent($event));
    }

    public function removeImage(Request $request, Event $event): EventResource
    {
        $organizer = $request->user();

        Gate::forUser($organizer)->authorize('update', $event);
        $this->ensureNotCancelled($event);

        $previousImagePath = $event->image_path;
        $event->update(['image_path' => null]);
        $this->eventImageService->delete($previousImagePath);

        return new EventResource($this->loadEvent($event));
    }

    public function cancel(CancelEventRequest $request, Event $event): EventResource
    {
        $organizer = $request->user();

        Gate::forUser($organizer)->authorize('cancel', $event);
        $this->ensureNotCancelled($event);

        $event->update([
            'status' => EventStatus::Cancelled->value,
        ]);

        return new EventResource($this->loadEvent($event));
    }

    private function ensureNotCancelled(Event $event): void
    {
        abort_if(
            $event->status === EventStatus::Cancelled,
            Response::HTTP_CONFLICT,
            'El evento ya está cancelado.',
        );
    }

    private function loadEvent(Event $event): Event
    {
        return $event->load($this->eventRelations())->loadCount('activeRegistrations');
    }

    /**
     * @return array<int, string>
     */
    private function eventRelations(): array
    {
        return [
            'community',
            'category',
            'modality',
            'location',
        ];
    }
}
