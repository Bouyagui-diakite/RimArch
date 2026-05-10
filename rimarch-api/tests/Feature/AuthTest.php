<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'admin',      'label' => 'Administrateur']);
        Role::create(['name' => 'archiviste', 'label' => 'Archiviste']);
        Role::create(['name' => 'consultant', 'label' => 'Consultant']);
        Role::create(['name' => 'lecteur',    'label' => 'Lecteur']);
    }

    public function test_register_creates_user_and_returns_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name'                  => 'Jean Test',
            'email'                 => 'jean@test.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['user' => ['id', 'name', 'email', 'roles'], 'token']);
        $this->assertDatabaseHas('users', ['email' => 'jean@test.com']);
    }

    public function test_register_assigns_lecteur_role_by_default(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Lecteur Test', 'email' => 'lecteur@test.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ]);
        $response->assertStatus(201);
        $this->assertEquals('lecteur', $response->json('user.roles.0.name'));
    }

    public function test_register_validates_required_fields(): void
    {
        $this->postJson('/api/auth/register', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_register_rejects_duplicate_email(): void
    {
        User::factory()->create(['email' => 'dup@test.com']);
        $this->postJson('/api/auth/register', [
            'name' => 'Dup', 'email' => 'dup@test.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_login_returns_token_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => Hash::make('password123')]);
        $user->assignRole('lecteur');
        $user->markEmailAsVerified();

        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'password123'])
             ->assertStatus(200)
             ->assertJsonStructure(['user', 'token']);
    }

    public function test_login_rejects_wrong_password(): void
    {
        $user = User::factory()->create(['password' => Hash::make('correct')]);
        $this->postJson('/api/auth/login', ['email' => $user->email, 'password' => 'wrong'])
             ->assertStatus(422);
    }

    public function test_login_rejects_unknown_email(): void
    {
        $this->postJson('/api/auth/login', ['email' => 'nobody@test.com', 'password' => 'password123'])
             ->assertStatus(422);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $user = User::factory()->create();
        $user->assignRole('lecteur');
        $user->markEmailAsVerified();

        $this->actingAs($user)
             ->getJson('/api/auth/me')
             ->assertStatus(200)
             ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_logout_invalidates_token(): void
    {
        $user  = User::factory()->create();
        $user->assignRole('lecteur');
        $user->markEmailAsVerified();
        $token = $user->createToken('test')->plainTextToken;

        $this->assertDatabaseCount('personal_access_tokens', 1);

        $this->withToken($token)
             ->postJson('/api/auth/logout')
             ->assertStatus(200);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_forgot_password_sends_email_for_valid_user(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/auth/forgot-password', ['email' => $user->email])
             ->assertStatus(200)
             ->assertJsonFragment(['message' => 'Email de réinitialisation envoyé.']);
    }

    public function test_forgot_password_fails_for_unknown_email(): void
    {
        $this->postJson('/api/auth/forgot-password', ['email' => 'nobody@test.com'])
             ->assertStatus(422);
    }

    public function test_reset_password_updates_password(): void
    {
        $user  = User::factory()->create();
        $token = Password::createToken($user);

        $this->postJson('/api/auth/reset-password', [
            'token' => $token, 'email' => $user->email,
            'password' => 'newpassword123', 'password_confirmation' => 'newpassword123',
        ])->assertStatus(200);

        $this->assertTrue(Hash::check('newpassword123', $user->fresh()->password));
    }

    public function test_reset_password_fails_with_invalid_token(): void
    {
        $user = User::factory()->create();
        $this->postJson('/api/auth/reset-password', [
            'token' => 'invalid-token', 'email' => $user->email,
            'password' => 'newpassword123', 'password_confirmation' => 'newpassword123',
        ])->assertStatus(422);
    }
}
