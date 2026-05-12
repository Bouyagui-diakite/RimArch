<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role'     => 'sometimes|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole($data['role'] ?? 'lecteur');
        try { $user->sendEmailVerificationNotification(); } catch (\Exception $e) {}

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user->load('roles'),
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::log('login', "Connexion de {$user->name}", $user, $user->id);

        return response()->json([
            'user'  => $user->load('roles'),
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('roles');

        $lastLogin = AuditLog::where('user_id', $user->id)
            ->where('action', 'login')
            ->orderByDesc('created_at')
            ->skip(1) // on saute le login actuel
            ->first();

        return response()->json([
            ...$user->toArray(),
            'documents_count' => $user->documents()->count(),
            'last_login'      => $lastLogin?->created_at,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        AuditLog::log('logout', "Déconnexion de {$user->name}", $user);
        $user->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            return response()->json(['message' => 'Lien de vérification invalide.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $user->markEmailAsVerified();

        return response()->json(['message' => 'Email vérifié avec succès.']);
    }

    public function resendVerification(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email déjà vérifié.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Email de vérification renvoyé.']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        try {
            $status = Password::sendResetLink(['email' => $request->email]);
            if ($status !== Password::RESET_LINK_SENT) {
                throw ValidationException::withMessages(['email' => [__($status)]]);
            }
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            // SMTP failed but token was created — still return success
        }

        return response()->json(['message' => 'Email de réinitialisation envoyé.']);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])
                     ->setRememberToken(Str::random(60));
                $user->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
                AuditLog::log('password_reset', "Réinitialisation du mot de passe", $user, $user->id);
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
        ]);

        $request->user()->update($data);

        return response()->json($request->user()->fresh()->load('roles'));
    }

    public function updatePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($data['current_password'], $request->user()->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Mot de passe actuel incorrect.'],
            ]);
        }

        $request->user()->update([
            'password' => Hash::make($data['password']),
        ]);

        return response()->json(['message' => 'Mot de passe mis à jour avec succès.']);
    }
}
