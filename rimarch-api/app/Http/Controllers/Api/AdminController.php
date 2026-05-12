<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\AuditLog;
use App\Models\Document;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function getUsers()
    {
        $users = User::with('roles')
            ->withCount('documents as documents_count')
            ->latest()
            ->get();

        return response()->json($users);
    }

    public function createUser(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role'     => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($data['role']);
        AuditLog::log('user_create', "Création de l'utilisateur \"{$user->name}\" ({$data['role']})", $user);
        AppNotification::sendToAdmins('user_create', 'Nouvel utilisateur', "Le compte de {$user->name} a été créé avec le rôle {$data['role']}.", '/admin/utilisateurs');

        return response()->json($user->load('roles'), 201);
    }

    public function updateUserRole(Request $request, User $user)
    {
        $data = $request->validate([
            'role' => 'required|string|exists:roles,name',
        ]);

        $user->roles()->detach();
        $user->assignRole($data['role']);
        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }
        AuditLog::log('role_change', "Rôle de \"{$user->name}\" changé en \"{$data['role']}\"", $user);
        AppNotification::send($user->id, 'role_change', 'Votre rôle a été modifié', "Votre rôle a été changé en \"{$data['role']}\" par un administrateur.", '/profil');

        return response()->json($user->load('roles'));
    }

    public function deleteUser(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Impossible de supprimer votre propre compte.'], 403);
        }

        AuditLog::log('user_delete', "Suppression de l'utilisateur \"{$user->name}\"", $user);
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès.']);
    }

    public function getLogs(Request $request)
    {
        $query = AuditLog::with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        return response()->json($query->paginate(30));
    }

    public function getRoles()
    {
        return response()->json(Role::all());
    }

    public function getStats()
    {
        $bytes = Document::sum('file_size');

        if ($bytes < 1024 * 1024) {
            $storage = round($bytes / 1024, 1) . ' Ko';
        } else {
            $storage = round($bytes / (1024 * 1024), 1) . ' Mo';
        }

        // Activité récente — 8 derniers logs
        $activity = AuditLog::with('user:id,name')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get()
            ->map(fn($log) => [
                'action'      => $log->action,
                'description' => $log->description,
                'user'        => $log->user?->name ?? 'Système',
                'created_at'  => $log->created_at,
            ]);

        // Uploads par jour sur 7 jours
        $uploads = Document::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $uploadsChart = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->format('Y-m-d');
            $uploadsChart->push([
                'date'  => now()->subDays($i)->format('d/m'),
                'count' => $uploads->get($date)?->count ?? 0,
            ]);
        }

        return response()->json([
            'users'         => User::count(),
            'documents'     => Document::count(),
            'roles'         => Role::all(),
            'storage'       => $storage,
            'activity'      => $activity,
            'uploads_chart' => $uploadsChart,
        ]);
    }
}
