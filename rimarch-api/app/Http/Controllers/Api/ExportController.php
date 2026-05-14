<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Document;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ExportController extends Controller
{
    public function documents(Request $request)
    {
        $query = Document::with('uploader:id,name,email');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%')
                  ->orWhere('file_name', 'like', '%' . $request->search . '%');
            });
        }
        if ($request->filled('categorie'))   $query->where('categorie', $request->categorie);
        if ($request->filled('file_type'))   $query->where('file_type', 'like', '%' . $request->file_type . '%');
        if ($request->filled('date_from'))   $query->whereDate('created_at', '>=', $request->date_from);
        if ($request->filled('date_to'))     $query->whereDate('created_at', '<=', $request->date_to);
        if ($request->filled('size_min'))    $query->where('file_size', '>=', (int)$request->size_min * 1024);
        if ($request->filled('size_max'))    $query->where('file_size', '<=', (int)$request->size_max * 1024);
        if ($request->filled('uploader_id')) $query->where('uploaded_by', $request->uploader_id);

        $documents = $query->orderBy('created_at', 'desc')->get();

        AuditLog::log('export', "Export CSV de {$documents->count()} document(s)");

        $filename = 'rimarch_documents_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ];

        $callback = function () use ($documents) {
            $handle = fopen('php://output', 'w');

            // BOM UTF-8 pour Excel
            fputs($handle, "\xEF\xBB\xBF");

            // En-têtes colonnes
            fputcsv($handle, [
                'ID',
                'Titre',
                'Description',
                'Catégorie',
                'Fichier',
                'Type',
                'Taille (Ko)',
                'Uploadé par',
                'Email uploader',
                'Date ajout',
            ], ';');

            foreach ($documents as $doc) {
                fputcsv($handle, [
                    $doc->id,
                    $doc->title,
                    $doc->description ?? '',
                    $doc->categorie,
                    $doc->file_name,
                    $doc->file_type,
                    round($doc->file_size / 1024, 1),
                    $doc->uploader?->name ?? 'Inconnu',
                    $doc->uploader?->email ?? '',
                    $doc->created_at->format('d/m/Y H:i'),
                ], ';');
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function logs(Request $request)
    {
        $query = \App\Models\AuditLog::with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($request->filled('action'))  $query->where('action', $request->action);
        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);
        if ($request->filled('from'))    $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to'))      $query->whereDate('created_at', '<=', $request->to);

        $logs = $query->get();

        $filename = 'rimarch_logs_' . now()->format('Ymd_His') . '.csv';

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Cache-Control'       => 'no-cache, no-store, must-revalidate',
        ];

        $callback = function () use ($logs) {
            $handle = fopen('php://output', 'w');
            fputs($handle, "\xEF\xBB\xBF");

            fputcsv($handle, ['ID', 'Action', 'Description', 'Utilisateur', 'Email', 'Entité', 'ID Entité', 'IP', 'Date'], ';');

            foreach ($logs as $log) {
                fputcsv($handle, [
                    $log->id,
                    $log->action,
                    $log->description,
                    $log->user?->name ?? 'Système',
                    $log->user?->email ?? '',
                    $log->model_type ?? '',
                    $log->model_id ?? '',
                    $log->ip_address ?? '',
                    \Carbon\Carbon::parse($log->created_at)->format('d/m/Y H:i:s'),
                ], ';');
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function logsPdf(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')->orderByDesc('created_at');

        if ($request->filled('action'))  $query->where('action', $request->action);
        if ($request->filled('user_id')) $query->where('user_id', $request->user_id);
        if ($request->filled('from'))    $query->whereDate('created_at', '>=', $request->from);
        if ($request->filled('to'))      $query->whereDate('created_at', '<=', $request->to);

        $logs = $query->get();

        $filterUser = null;
        if ($request->filled('user_id')) {
            $filterUser = \App\Models\User::find($request->user_id)?->name;
        }

        $actionLabels = [
            'login'       => 'Connexion',
            'logout'      => 'Déconnexion',
            'upload'      => 'Upload',
            'download'    => 'Téléchargement',
            'update'      => 'Modification',
            'delete'      => 'Suppression',
            'user_create' => 'Nouvel user',
            'user_delete' => 'User supprimé',
            'role_change' => 'Rôle modifié',
            'export'      => 'Export',
        ];

        $pdf = Pdf::loadView('exports.logs', [
            'logs'         => $logs,
            'actionLabels' => $actionLabels,
            'hasFilters'   => $request->hasAny(['action', 'user_id', 'from', 'to']),
            'filterAction' => $request->filled('action') ? ($actionLabels[$request->action] ?? $request->action) : null,
            'filterUser'   => $filterUser,
            'filterFrom'   => $request->from,
            'filterTo'     => $request->to,
        ])->setPaper('a4', 'landscape');

        $filename = 'rimarch_logs_' . now()->format('Ymd_His') . '.pdf';

        return $pdf->download($filename);
    }
}
