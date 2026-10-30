<?php

namespace App\Http\Controllers;

use App\Enums\EventStatus;
use App\Enums\RegistrationStatus;
use App\Http\Requests\ListMyRegistrationsRequest;
use App\Http\Resources\RegistrationResource;
use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RegistrationController extends Controller
{
    public function store(Request $request, Event $event): JsonResponse
    {
        $user = $request->user();
        [$registration, $wasReactivated] = DB::transaction(function () use ($event, $user) {
            $lockedEvent = Event::query()->lockForUpdate()->findOrFail($event->id);
            $this->ensureNotCancelled($lockedEvent);

            $hasActiveRegistration = Registration::query()
                ->where('event_id', $lockedEvent->id)
                ->where('user_id', $user->id)
                ->where('status', RegistrationStatus::Active->value)
                ->exists();
            abort_if($hasActiveRegistration, Response::HTTP_CONFLICT, 'Ya estás inscrito en este evento.');

            $activeCount = Registration::query()
                ->where('event_id', $lockedEvent->id)
                ->where('status', RegistrationStatus::Active->value)
                ->count();
            abort_if($activeCount >= $lockedEvent->capacity, Response::HTTP_CONFLICT, 'El evento alcanzó su capacidad máxima.');

            $cancelledRegistration = Registration::query()
                ->where('event_id', $lockedEvent->id)
                ->where('user_id', $user->id)
                ->where('status', RegistrationStatus::Cancelled->value)
                ->first();

            if ($cancelledRegistration) {
                $cancelledRegistration->update([
                    'status' => RegistrationStatus::Active->value,
                    'registered_at' => now(),
                    'cancelled_at' => null,
                ]);

                return [$cancelledRegistration, true];
            }

            $registration = Registration::query()->create([
                'event_id' => $lockedEvent->id,
                'user_id' => $user->id,
                'status' => RegistrationStatus::Active->value,
                'registered_at' => now(),
                'cancelled_at' => null,
            ]);

            return [$registration, false];
        });

        return (new RegistrationResource($this->loadRegistration($registration)))
            ->response()
            ->setStatusCode($wasReactivated ? Response::HTTP_OK : Response::HTTP_CREATED);
    }

    public function destroy(Request $request, Event $event): RegistrationResource
    {
        $user = $request->user();
        $registration = DB::transaction(function () use ($event, $user) {
            Event::query()->lockForUpdate()->findOrFail($event->id);

            $registration = Registration::query()
                ->where('event_id', $event->id)
                ->where('user_id', $user->id)
                ->where('status', RegistrationStatus::Active->value)
                ->first();

            abort_if(! $registration, Response::HTTP_NOT_FOUND, 'No tienes una inscripción activa en este evento.');

            $registration->update([
                'status' => RegistrationStatus::Cancelled->value,
                'cancelled_at' => now(),
            ]);

            return $registration;
        });

        return new RegistrationResource($this->loadRegistration($registration));
    }

    public function index(Request $request, Event $event): JsonResponse
    {
        $organizer = $request->user();
        $this->ensureManagesEventCommunity($organizer, $event);

        $attendees = Registration::query()
            ->where('event_id', $event->id)
            ->where('status', RegistrationStatus::Active->value)
            ->with('user')
            ->orderBy('registered_at')
            ->get();

        $activeCount = $attendees->count();

        return RegistrationResource::collection($attendees)
            ->additional([
                'summary' => [
                    'capacity' => $event->capacity,
                    'active_registrations' => $activeCount,
                    'available_capacity' => max(0, $event->capacity - $activeCount),
                ],
            ])
            ->response();
    }

    public function myRegistrations(ListMyRegistrationsRequest $request): JsonResponse
    {
        $user = $request->user();
        $registrations = Registration::query()
            ->where('user_id', $user->id)
            ->where('status', RegistrationStatus::Active->value)
            ->with([
                'event' => fn ($query) => $query->with($this->eventRelations())->withCount('activeRegistrations'),
            ])
            ->orderByDesc('registered_at')
            ->paginate($request->validated('per_page', 12))
            ->withQueryString();

        return RegistrationResource::collection($registrations)->response();
    }

    private function ensureNotCancelled(Event $event): void
    {
        abort_if(
            $event->status === EventStatus::Cancelled,
            Response::HTTP_CONFLICT,
            'El evento está cancelado.',
        );
    }

    private function ensureManagesEventCommunity(User $organizer, Event $event): void
    {
        abort_unless(
            $organizer->isActiveOrganizerOf($event->community_id),
            Response::HTTP_FORBIDDEN,
            'El organizador no administra la comunidad del evento.',
        );
    }

    private function loadRegistration(Registration $registration): Registration
    {
        return $registration->load([
            'event' => fn ($query) => $query->with($this->eventRelations())->withCount('activeRegistrations'),
        ]);
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
