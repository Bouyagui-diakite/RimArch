<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RolePermissionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $archiviste;
    private User $lecteur;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        Role::create(['name' => 'admin',      'label' => 'Administrateur']);
        Role::create(['name' => 'archiviste', 'label' => 'Archiviste']);
        Role::create(['name' => 'consultant', 'label' => 'Consultant']);
        Role::create(['name' => 'lecteur',    'label' => 'Lecteur']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        $this->admin->markEmailAsVerified();

        $this->archiviste = User::factory()->create();
        $this->archiviste->assignRole('archiviste');
        $this->archiviste->markEmailAsVerified();

        $this->lecteur = User::factory()->create();
        $this->lecteur->assignRole('lecteur');
        $this->lecteur->markEmailAsVerified();
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $this->actingAs($this->admin)->getJson('/api/admin/users')->assertStatus(200);
    }

    public function test_lecteur_cannot_access_admin_routes(): void
    {
        $this->actingAs($this->lecteur)->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_archiviste_cannot_access_admin_routes(): void
    {
        $this->actingAs($this->archiviste)->getJson('/api/admin/users')->assertStatus(403);
    }

    public function test_archiviste_can_upload_document(): void
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');
        $this->actingAs($this->archiviste)
             ->postJson('/api/documents', ['title' => 'Doc Archiviste', 'categorie' => 'RH', 'file' => $file])
             ->assertStatus(201);
    }

    public function test_admin_can_get_stats(): void
    {
        $this->actingAs($this->admin)
             ->getJson('/api/admin/stats')
             ->assertStatus(200)
             ->assertJsonStructure(['users', 'documents', 'storage', 'roles']);
    }

    public function test_non_admin_cannot_get_stats(): void
    {
        $this->actingAs($this->lecteur)->getJson('/api/admin/stats')->assertStatus(403);
    }

    public function test_admin_can_change_user_role(): void
    {
        $target = User::factory()->create();
        $target->assignRole('lecteur');

        $this->actingAs($this->admin)
             ->putJson("/api/admin/users/{$target->id}/role", ['role' => 'archiviste'])
             ->assertStatus(200)
             ->assertJsonFragment(['name' => 'archiviste']);
    }

    public function test_admin_can_delete_user(): void
    {
        $target = User::factory()->create();
        $target->assignRole('lecteur');

        $this->actingAs($this->admin)
             ->deleteJson("/api/admin/users/{$target->id}")
             ->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $this->actingAs($this->admin)
             ->deleteJson("/api/admin/users/{$this->admin->id}")
             ->assertStatus(403);
    }

    public function test_admin_can_access_logs(): void
    {
        $this->actingAs($this->admin)
             ->getJson('/api/admin/logs')
             ->assertStatus(200)
             ->assertJsonStructure(['data', 'total']);
    }

    public function test_lecteur_cannot_access_logs(): void
    {
        $this->actingAs($this->lecteur)->getJson('/api/admin/logs')->assertStatus(403);
    }
}
