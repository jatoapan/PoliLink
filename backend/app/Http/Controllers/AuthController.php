<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = DB::transaction(function () use ($request) {
            $user = User::query()->create($request->safe()->only([
                'first_name',
                'last_name',
                'email',
                'password',
            ]));

            return $user;
        });

        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return (new UserResource($this->loadUserRelations($user)))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $key = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($key, 5)) {
            return response()->json([
                'message' => 'Demasiados intentos de inicio de sesión. Intenta nuevamente más tarde.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        $credentials = $request->safe()->only(['email', 'password']);

        if (! Auth::guard('web')->attempt($credentials)) {
            RateLimiter::hit($key, 60);

            return response()->json([
                'message' => 'Las credenciales proporcionadas son inválidas.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();

        return (new UserResource($this->loadUserRelations($request->user())))->response();
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(status: Response::HTTP_NO_CONTENT);
    }

    public function me(Request $request): UserResource
    {
        return new UserResource($this->loadUserRelations($request->user()));
    }

    private function loadUserRelations(User $user): User
    {
        return $user->load([
            'memberships.community',
            'memberships.role',
        ]);
    }

    private function throttleKey(LoginRequest $request): string
    {
        return Str::transliterate(Str::lower($request->validated('email')).'|'.$request->ip());
    }
}
