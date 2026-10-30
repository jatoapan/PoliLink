<?php

namespace App\Http\Controllers;

use App\Http\Requests\DiscoverCommunitiesRequest;
use App\Http\Resources\CommunityResource;
use App\Models\Community;

class CommunityDirectoryController extends Controller
{
    public function index(DiscoverCommunitiesRequest $request)
    {
        $filters = $request->validated();
        $perPage = $filters['per_page'] ?? 12;

        $communities = Community::query()
            ->where('is_active', true)
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return CommunityResource::collection($communities);
    }

    public function show(Community $community): CommunityResource
    {
        abort_unless($community->is_active, 404);

        return new CommunityResource($community);
    }
}
