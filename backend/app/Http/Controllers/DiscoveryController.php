<?php

namespace App\Http\Controllers;

use App\Http\Requests\DiscoverySearchRequest;
use App\Http\Resources\DiscoveryResultResource;
use App\Services\Discovery\DiscoveryInterpreter;
use App\Services\Discovery\DiscoveryService;

class DiscoveryController extends Controller
{
    public function __construct(
        private readonly DiscoveryInterpreter $interpreter,
        private readonly DiscoveryService $discovery,
    ) {}

    public function search(DiscoverySearchRequest $request): DiscoveryResultResource
    {
        $interpretation = $this->interpreter->interpret($request->validated('query'));

        return new DiscoveryResultResource($this->discovery->search($interpretation, $request->discoveryScope()));
    }
}
