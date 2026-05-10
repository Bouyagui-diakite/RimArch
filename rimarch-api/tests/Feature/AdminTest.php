<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'admin',      'label' => 'Administrateur']);
        Role::create(['name' => 'archiviste', 'label' => 'Archiviste']);
        Role::create(['name' => 'consultant', 'label' => 'Consultant']);
        Role::create(['name' => 'lecteur',    'label' => 'Lecteur']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        $this->admin->markEmailAsVerified();
    }

    // ── Liste utilisateurs ────────────────────────────────────────────────
    public function test_admin_can_list_users(): void
    {
        User::factory(3)->create()->each(fn($u) => $u->assignRole('lecteur'));

        $response = $this->actingAs($this->admin)->getJson('/api/admin/users');
        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(4, count($response->json()));
    }

    // ── Créer un utilisateur ──────────────────────────────────────────────
    public function test_admin_can_create_user(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/api/admin/users', [
                 'name'     => 'Nouvel User',
                 'email'    => 'new@test.com',
                 'password' => 'password123',
                 'role'     => 'lecteur',
             ])
             ->assertStatus(201)
             ->assertJsonFragment(['email' => 'new@test.com']);

        $this->assertDatabaseHas('users', ['email' => 'new@test.com']);
    }

    public function test_create_user_validates_required_fields(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/api/admin/users', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_create_user_validates_role_exists(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/api/admin/users', [
                 'name' => 'Test', 'email' => 'test@test.com',
                 'password' => 'password123', 'role' => 'superpouvoirs',
             ])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['role']);
    }

    // ── Stats ─────────────────────────────────────────────────────────────
    public function test_stats_returns_correct_structure(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $response->assertStatus(200)
                 ->assertJsonStructure(['users', 'documents', 'storage', 'roles', 'activity', 'uploads_chart']);
    }

    public function test_stats_user_count_is_accurate(): void
    {
        User::factory(2)->create()->each(fn($u) => $u->assignRole('lecteur'));
        $response = $this->actingAs($this->admin)->getJson('/api/admin/stats');
        $this->assertEquals(3, $response->json('users')); // admin + 2
    }

    // ── Logs ─────────────────────────────────────────────────────────────
    public function test_logs_returns_paginated_results(): void
    {
        AuditLog::log('login', 'Connexion test', null, $this->admin->id);
        AuditLog::log('upload', 'Upload test', null, $this->admin->id);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/logs');
        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'total', 'per_page', 'current_page']);
        $this->assertGreaterThanOrEqual(2, $response->json('total'));
    }

    public function test_logs_can_be_filtered_by_action(): void
    {
        AuditLog::log('login',  'Connexion', null, $this->admin->id);
        AuditLog::log('upload', 'Upload',    null, $this->admin->id);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/logs?action=login');
        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    // ── Rôles ─────────────────────────────────────────────────────────────
    public function test_admin_can_get_roles(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/admin/roles');
        $response->assertStatus(200);
        $this->assertCount(4, $response->json());
    }
}
