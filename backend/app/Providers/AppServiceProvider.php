<?php

namespace App\Providers;

use App\Models\Community;
use App\Models\Event;
use App\Policies\CommunityPolicy;
use App\Policies\EventPolicy;
use App\Services\Gemma\GeminiApiGemmaClient;
use App\Services\Gemma\GemmaClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\HttpFoundation\Response;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(GemmaClient::class, fn () => GeminiApiGemmaClient::fromConfig());
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Community::class, CommunityPolicy::class);
        Gate::policy(Event::class, EventPolicy::class);

        RateLimiter::for('ai-search', fn (Request $request) => Limit::perMinute(
            config('services.gemma.rate_limit_per_minute'),
        )->by($request->user() ? 'user:'.$request->user()->id : 'ip:'.$request->ip())->response(fn (Request $request, array $headers) => response()->json([
            'message' => 'Hiciste demasiadas búsquedas seguidas. Espera un minuto e inténtalo de nuevo.',
        ], Response::HTTP_TOO_MANY_REQUESTS, $headers)));
    }
}
