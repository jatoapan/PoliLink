<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommunityImageRequest;
use App\Http\Resources\CommunityResource;
use App\Models\Community;
use App\Services\PublicImageStorageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Throwable;

class CommunityImageController extends Controller
{
    public function __construct(
        private readonly PublicImageStorageService $imageStorage,
    ) {}

    public function store(StoreCommunityImageRequest $request, Community $community): CommunityResource
    {
        Gate::forUser($request->user())->authorize('manageImage', $community);

        $previousImagePath = $community->image_path;
        $imagePath = $this->imageStorage->store($request->file('image'), 'communities');

        try {
            $community->update(['image_path' => $imagePath]);
        } catch (Throwable $exception) {
            $this->imageStorage->delete($imagePath);

            throw $exception;
        }

        $this->imageStorage->delete($previousImagePath);

        return new CommunityResource($community->refresh());
    }

    public function remove(Request $request, Community $community): CommunityResource
    {
        Gate::forUser($request->user())->authorize('manageImage', $community);

        $previousImagePath = $community->image_path;
        $community->update(['image_path' => null]);
        $this->imageStorage->delete($previousImagePath);

        return new CommunityResource($community->refresh());
    }
}
