<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $lecteur;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');

        Role::create(['name' => 'admin',     'label' => 'Administrateur']);
        Role::create(['name' => 'archiviste','label' => 'Archiviste']);
        Role::create(['name' => 'lecteur',   'label' => 'Lecteur']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');
        $this->admin->markEmailAsVerified();

        $this->lecteur = User::factory()->create();
        $this->lecteur->assignRole('lecteur');
        $this->lecteur->markEmailAsVerified();
    }

    private function uploadDoc(User $user, array $overrides = [])
    {
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');
        return $this->actingAs($user)->postJson('/api/documents', array_merge([
            'title' => 'Rapport Test', 'categorie' => 'RH', 'file' => $file,
        ], $overrides));
    }

    public function test_admin_can_upload_document(): void
    {
        $this->uploadDoc($this->admin)
             ->assertStatus(201)
             ->assertJsonStructure(['id', 'title', 'categorie', 'file_name', 'uploader']);
        $this->assertDatabaseHas('documents', ['title' => 'Rapport Test']);
    }

    public function test_upload_requires_title_and_file(): void
    {
        $this->actingAs($this->admin)
             ->postJson('/api/documents', [])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['title', 'file']);
    }

    public function test_upload_requires_authentication(): void
    {
        $file = UploadedFile::fake()->create('doc.pdf', 100);
        $this->postJson('/api/documents', ['title' => 'Test', 'file' => $file])
             ->assertStatus(401);
    }

    public function test_authenticated_user_can_list_documents(): void
    {
        $this->uploadDoc($this->admin);
        $this->actingAs($this->lecteur)
             ->getJson('/api/documents')
             ->assertStatus(200)
             ->assertJsonStructure(['data', 'total', 'per_page']);
    }

    public function test_unauthenticated_user_cannot_list_documents(): void
    {
        $this->getJson('/api/documents')->assertStatus(401);
    }

    public function test_search_filter_works(): void
    {
        $this->uploadDoc($this->admin, ['title' => 'Rapport Financier']);
        $this->uploadDoc($this->admin, ['title' => 'Contrat RH']);

        $response = $this->actingAs($this->lecteur)->getJson('/api/documents?search=Financier');
        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
        $this->assertEquals('Rapport Financier', $response->json('data.0.title'));
    }

    public function test_categorie_filter_works(): void
    {
        $this->uploadDoc($this->admin, ['categorie' => 'RH']);
        $this->uploadDoc($this->admin, ['categorie' => 'Finance']);

        $response = $this->actingAs($this->lecteur)->getJson('/api/documents?categorie=Finance');
        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('total'));
    }

    public function test_user_can_view_document_detail(): void
    {
        $id = $this->uploadDoc($this->admin)->json('id');
        $this->actingAs($this->lecteur)
             ->getJson("/api/documents/{$id}")
             ->assertStatus(200)
             ->assertJsonFragment(['id' => $id]);
    }

    public function test_document_not_found_returns_404(): void
    {
        $this->actingAs($this->lecteur)
             ->getJson('/api/documents/99999')
             ->assertStatus(404);
    }

    public function test_admin_can_update_document(): void
    {
        $id = $this->uploadDoc($this->admin)->json('id');
        $this->actingAs($this->admin)
             ->putJson("/api/documents/{$id}", ['title' => 'Nouveau Titre', 'categorie' => 'Finance'])
             ->assertStatus(200)
             ->assertJsonFragment(['title' => 'Nouveau Titre']);
    }

    public function test_user_can_download_document(): void
    {
        $id = $this->uploadDoc($this->admin)->json('id');
        $this->actingAs($this->lecteur)
             ->get("/api/documents/{$id}/download")
             ->assertStatus(200);
    }

    public function test_admin_can_delete_document(): void
    {
        $id = $this->uploadDoc($this->admin)->json('id');
        $this->actingAs($this->admin)
             ->deleteJson("/api/documents/{$id}")
             ->assertStatus(200);
        $this->assertDatabaseMissing('documents', ['id' => $id]);
    }

    public function test_delete_nonexistent_document_returns_404(): void
    {
        $this->actingAs($this->admin)
             ->deleteJson('/api/documents/99999')
             ->assertStatus(404);
    }

    public function test_export_returns_csv(): void
    {
        $this->uploadDoc($this->admin);
        $response = $this->actingAs($this->admin)->get('/api/export/documents');
        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
    }
}
