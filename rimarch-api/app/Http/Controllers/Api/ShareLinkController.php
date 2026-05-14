<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\SharedLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ShareLinkController extends Controller
{
    public function create(Request $request, Document $document)
    {
        $request->validate([
            'expires_in' => 'required|in:1,7,30',
        ]);

        $link = SharedLink::create([
            'document_id' => $document->id,
            'created_by'  => $request->user()->id,
            'token'       => Str::random(48),
            'expires_at'  => now()->addDays((int) $request->expires_in),
        ]);

        AuditLog::log('update', "Lien de partage créé pour \"{$document->title}\"", $document);

        return response()->json($link, 201);
    }

    public function index(Document $document)
    {
        $links = SharedLink::where('document_id', $document->id)
            ->with('creator:id,name')
            ->latest()
            ->get();

        return response()->json($links);
    }

    public function revoke(Request $request, string $token)
    {
        $link = SharedLink::where('token', $token)->firstOrFail();

        AuditLog::log('update', "Lien de partage révoqué pour le document #{$link->document_id}");

        $link->delete();

        return response()->json(['message' => 'Lien révoqué.']);
    }

    // ── Public endpoints (no auth) ────────────────────────────────────────

    public function show(string $token)
    {
        $link = SharedLink::with('document')->where('token', $token)->firstOrFail();

        if ($link->isExpired()) {
            return response()->json(['message' => 'Ce lien a expiré.'], 410);
        }

        $doc = $link->document;

        return response()->json([
            'title'          => $doc->title,
            'file_name'      => $doc->file_name,
            'file_type'      => $doc->file_type,
            'file_size'      => $doc->file_size,
            'categorie'      => $doc->categorie,
            'expires_at'     => $link->expires_at,
            'download_count' => $link->download_count,
        ]);
    }

    public function download(string $token)
    {
        $link = SharedLink::with('document')->where('token', $token)->firstOrFail();

        if ($link->isExpired()) {
            return response()->json(['message' => 'Ce lien a expiré.'], 410);
        }

        $doc = $link->document;

        if (!Storage::disk('local')->exists($doc->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $link->increment('download_count');

        AuditLog::log('download', "Téléchargement via lien partagé : \"{$doc->title}\"", $doc);

        return response()->download(
            Storage::disk('local')->path($doc->file_path),
            $doc->file_name
        );
    }
}
