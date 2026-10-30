<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CatalogAdminController;
use App\Http\Controllers\CommunityCreationRequestController;
use App\Http\Controllers\CommunityDirectoryController;
use App\Http\Controllers\CommunityImageController;
use App\Http\Controllers\CommunityMembershipController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\ReferenceDataController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'application' => 'PoliLink',
        'status' => 'ok',
    ]);
});

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::middleware('auth:sanctum')->group(function () {
        Route::delete('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/community-creation-requests', [CommunityCreationRequestController::class, 'store']);
    Route::get('/me/community-creation-requests', [CommunityCreationRequestController::class, 'mine']);
    Route::post('/communities/{community}/membership-requests', [CommunityMembershipController::class, 'store']);
    Route::delete('/communities/{community}/membership-requests', [CommunityMembershipController::class, 'destroy']);
    Route::get('/communities/{community}/membership-requests', [CommunityMembershipController::class, 'index']);
    Route::patch('/community-memberships/{communityMembership}/approve', [CommunityMembershipController::class, 'approve']);
    Route::patch('/community-memberships/{communityMembership}/reject', [CommunityMembershipController::class, 'reject']);
    Route::post('/communities/{community}/image', [CommunityImageController::class, 'store']);
    Route::delete('/communities/{community}/image', [CommunityImageController::class, 'remove']);
    Route::get('/me/memberships', [CommunityMembershipController::class, 'mine']);
    Route::get('/me/communities', [DashboardController::class, 'communities']);
    Route::get('/me/events', [DashboardController::class, 'events']);
    Route::post('/events', [EventController::class, 'store']);
    Route::patch('/events/{event}', [EventController::class, 'update']);
    Route::post('/events/{event}/image', [EventController::class, 'storeImage']);
    Route::delete('/events/{event}/image', [EventController::class, 'removeImage']);
    Route::patch('/events/{event}/cancel', [EventController::class, 'cancel']);
    Route::post('/events/{event}/registrations', [RegistrationController::class, 'store']);
    Route::delete('/events/{event}/registrations', [RegistrationController::class, 'destroy']);
    Route::get('/events/{event}/registrations', [RegistrationController::class, 'index']);
    Route::get('/me/registrations', [RegistrationController::class, 'myRegistrations']);
});

Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin/catalog')
    ->group(function () {
        Route::get('/event-categories', [CatalogAdminController::class, 'categories']);
        Route::post('/event-categories', [CatalogAdminController::class, 'storeCategory']);
        Route::patch('/event-categories/{eventCategory}', [CatalogAdminController::class, 'updateCategory']);

        Route::get('/event-modalities', [CatalogAdminController::class, 'modalities']);
        Route::post('/event-modalities', [CatalogAdminController::class, 'storeModality']);
        Route::patch('/event-modalities/{eventModality}', [CatalogAdminController::class, 'updateModality']);

        Route::get('/locations', [CatalogAdminController::class, 'locations']);
        Route::post('/locations', [CatalogAdminController::class, 'storeLocation']);
        Route::patch('/locations/{location}', [CatalogAdminController::class, 'updateLocation']);
    });

Route::middleware(['auth:sanctum', 'admin'])
    ->prefix('admin/community-creation-requests')
    ->group(function () {
        Route::get('/', [CommunityCreationRequestController::class, 'adminIndex']);
        Route::patch('/{communityCreationRequest}/approve', [CommunityCreationRequestController::class, 'approve']);
        Route::patch('/{communityCreationRequest}/reject', [CommunityCreationRequestController::class, 'reject']);
    });

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/event-categories', [ReferenceDataController::class, 'categories']);
Route::get('/event-modalities', [ReferenceDataController::class, 'modalities']);
Route::get('/locations', [ReferenceDataController::class, 'locations']);
Route::get('/communities/discover', [CommunityDirectoryController::class, 'index']);
Route::get('/communities/{community:slug}', [CommunityDirectoryController::class, 'show']);
Route::get('/communities', [ReferenceDataController::class, 'communities']);
