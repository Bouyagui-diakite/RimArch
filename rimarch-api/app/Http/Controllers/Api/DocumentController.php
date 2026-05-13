<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $query = Document::with('uploader:id,name,email');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%')
                  ->orWhere('file_name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('categorie')) {
            $query->where('categorie', $request->categorie);
        }

        if ($request->filled('file_type')) {
            $query->where('file_type', 'like', '%' . $request->file_type . '%');
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('size_min')) {
            $query->where('file_size', '>=', (int)$request->size_min * 1024);
        }

        if ($request->filled('size_max')) {
            $query->where('file_size', '<=', (int)$request->size_max * 1024);
        }

        if ($request->filled('uploader_id')) {
            $query->where('uploaded_by', $request->uploader_id);
        }

        $sort = $request->get('sort', 'created_at');
        $dir  = $request->get('dir', 'desc');
        $allowed = ['created_at', 'title', 'file_size', 'categorie'];
        if (in_array($sort, $allowed)) {
            $query->orderBy($sort, $dir === 'asc' ? 'asc' : 'desc');
        } else {
            $query->latest();
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'categorie'   => 'nullable|string|max:100',
            'file'        => 'required|file|max:51200',
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'local');

        $document = Document::create([
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'categorie'   => $data['categorie'] ?? 'general',
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'file_type'   => $file->getClientMimeType(),
            'file_size'   => $file->getSize(),
            'uploaded_by' => $request->user()->id,
        ]);

        AuditLog::log('upload', "Upload du document \"{$document->title}\"", $document);
        AppNotification::sendToAdmins(
            'upload',
            'Nouveau document uploadé',
            "\"{$document->title}\" a été ajouté par {$request->user()->name}.",
            '/documents/' . $document->id
        );

        return response()->json($document->load('uploader:id,name,email'), 201);
    }

    public function show(Document $document)
    {
        return response()->json($document->load('uploader:id,name,email'));
    }

    public function update(Request $request, Document $document)
    {
        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'categorie'   => 'nullable|string|max:100',
        ]);

        $document->update($data);
        AuditLog::log('update', "Modification du document \"{$document->title}\"", $document);

        return response()->json($document->load('uploader:id,name,email'));
    }

    public function destroy(Document $document)
    {
        $title = $document->title;
        AuditLog::log('delete', "Suppression du document \"{$title}\"", $document);
        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return response()->json(['message' => 'Document supprimé avec succès.']);
    }

    public function download(Document $document)
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        AuditLog::log('download', "Téléchargement du document \"{$document->title}\"", $document);
        $fullPath = Storage::disk('local')->path($document->file_path);

        return response()->download($fullPath, $document->file_name);
    }

    public function preview(Document $document)
    {
        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $fullPath = Storage::disk('local')->path($document->file_path);

        return response()->file($fullPath, [
            'Content-Type'        => $document->file_type,
            'Content-Disposition' => 'inline',
        ]);
    }
}
