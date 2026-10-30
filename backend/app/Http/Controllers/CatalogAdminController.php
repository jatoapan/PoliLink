<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEventCategoryRequest;
use App\Http\Requests\StoreEventModalityRequest;
use App\Http\Requests\StoreLocationRequest;
use App\Http\Requests\UpdateEventCategoryRequest;
use App\Http\Requests\UpdateEventModalityRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Http\Resources\AdminEventCategoryResource;
use App\Http\Resources\AdminEventModalityResource;
use App\Http\Resources\AdminLocationResource;
use App\Models\EventCategory;
use App\Models\EventModality;
use App\Models\Location;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CatalogAdminController extends Controller
{
    public function categories(): JsonResponse
    {
        return AdminEventCategoryResource::collection(
            EventCategory::query()->orderBy('name')->get(),
        )->response();
    }

    public function storeCategory(StoreEventCategoryRequest $request): JsonResponse
    {
        $category = EventCategory::query()->create([
            ...$request->validated(),
            'is_active' => true,
        ]);

        return (new AdminEventCategoryResource($category))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function updateCategory(
        UpdateEventCategoryRequest $request,
        EventCategory $eventCategory,
    ): AdminEventCategoryResource {
        $eventCategory->update($request->validated());

        return new AdminEventCategoryResource($eventCategory->refresh());
    }

    public function modalities(): JsonResponse
    {
        return AdminEventModalityResource::collection(
            EventModality::query()->orderBy('name')->get(),
        )->response();
    }

    public function storeModality(StoreEventModalityRequest $request): JsonResponse
    {
        $modality = EventModality::query()->create([
            ...$request->validated(),
            'is_active' => true,
        ]);

        return (new AdminEventModalityResource($modality))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function updateModality(
        UpdateEventModalityRequest $request,
        EventModality $eventModality,
    ): AdminEventModalityResource {
        $eventModality->update($request->validated());

        return new AdminEventModalityResource($eventModality->refresh());
    }

    public function locations(): JsonResponse
    {
        return AdminLocationResource::collection(
            Location::query()->orderBy('name')->get(),
        )->response();
    }

    public function storeLocation(StoreLocationRequest $request): JsonResponse
    {
        $location = Location::query()->create([
            ...$request->validated(),
            'is_active' => true,
        ]);

        return (new AdminLocationResource($location))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function updateLocation(
        UpdateLocationRequest $request,
        Location $location,
    ): AdminLocationResource {
        $location->update($request->validated());

        return new AdminLocationResource($location->refresh());
    }
}
