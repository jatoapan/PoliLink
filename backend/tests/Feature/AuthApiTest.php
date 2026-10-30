<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_without_a_global_community_role(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/register', [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'email' => 'ana@espol.edu.ec',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertCreated()
            ->assertJsonPath('data.email', 'ana@espol.edu.ec')
            ->assertJsonPath('data.is_admin', false)
            ->assertJsonPath('data.community_memberships', []);

        $user = User::query()->where('email', 'ana@espol.edu.ec')->sole();
        $this->assertFalse($user->is_admin);

        $this->assertAuthenticatedAs($user, 'web');
    }

    public function test_registration_validates_unique_email_and_password_confirmation(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/register', [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'email' => 'student@espol.edu.ec',
            'password' => 'password123',
            'password_confirmation' => 'different',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_user_can_login_and_an_authenticated_user_can_read_me(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/login', [
            'email' => 'student@espol.edu.ec',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonPath('data.is_admin', false);

        $this->assertAuthenticated('web');

        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();
        $this->actingAs($student, 'web')
            ->statefulGet('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.id', $student->id);
    }

    public function test_authenticated_user_can_logout(): void
    {
        $this->seed();
        $student = User::query()->where('email', 'student@espol.edu.ec')->sole();

        $this->actingAs($student, 'web')
            ->csrfDelete('/api/auth/logout')
            ->assertNoContent();

        $this->assertGuest('web');
    }

    public function test_login_rejects_invalid_credentials_and_throttles_attempts(): void
    {
        $this->seed();
        $payload = [
            'email' => 'student@espol.edu.ec',
            'password' => 'incorrect-password',
        ];

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->csrfPost('/api/auth/login', $payload)->assertUnauthorized();
        }

        $this->csrfPost('/api/auth/login', $payload)->assertTooManyRequests();
    }

    public function test_registration_rejects_non_espol_email(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/register', [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'email' => 'ana@gmail.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseMissing('users', ['email' => 'ana@gmail.com']);
    }

    public function test_login_rejects_non_espol_email_before_authentication(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/login', [
            'email' => 'student@gmail.com',
            'password' => 'password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertGuest('web');
    }

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/register', [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'email' => 'new-student@espol.edu.ec',
            'password' => 'password123',
            'password_confirmation' => 'different-password',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', [
            'email' => 'new-student@espol.edu.ec',
        ]);
        $this->assertGuest('web');
    }

    public function test_registration_requires_password_confirmation(): void
    {
        $this->seed();

        $this->csrfPost('/api/auth/register', [
            'first_name' => 'Ana',
            'last_name' => 'Torres',
            'email' => 'missing-confirmation@espol.edu.ec',
            'password' => 'password123',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);

        $this->assertDatabaseMissing('users', [
            'email' => 'missing-confirmation@espol.edu.ec',
        ]);
        $this->assertGuest('web');
    }

    public function test_csrf_cookie_endpoint_is_available(): void
    {
        $this->get('/sanctum/csrf-cookie')
            ->assertNoContent()
            ->assertCookie('XSRF-TOKEN');
    }

    private function csrfPost(string $uri, array $payload)
    {
        return $this->stateful()
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->postJson($uri, $payload);
    }

    private function csrfDelete(string $uri)
    {
        return $this->stateful()
            ->withSession(['_token' => 'test-csrf-token'])
            ->withHeader('X-CSRF-TOKEN', 'test-csrf-token')
            ->deleteJson($uri);
    }

    private function statefulGet(string $uri)
    {
        return $this->stateful()->getJson($uri);
    }

    private function stateful()
    {
        return $this
            ->withHeader('Origin', 'http://localhost:5173')
            ->withHeader('Referer', 'http://localhost:5173/');
    }
}
