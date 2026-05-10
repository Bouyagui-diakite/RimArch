<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class VerifyEmailNotification extends VerifyEmail
{
    protected function verificationUrl($notifiable): string
    {
        $temporaryUrl = URL::temporarySignedRoute(
            'verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id'   => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );

        $query    = parse_url($temporaryUrl, PHP_URL_QUERY);
        $frontend = rtrim(config('app.frontend_url', 'http://localhost:3001'), '/');
        $id       = $notifiable->getKey();
        $hash     = sha1($notifiable->getEmailForVerification());

        return "{$frontend}/verify-email/{$id}/{$hash}?{$query}";
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Vérifiez votre adresse email — RIMArch')
            ->greeting('Bonjour ' . $notifiable->name . ' !')
            ->line('Merci de vous être inscrit sur RIMArch.')
            ->line('Cliquez sur le bouton ci-dessous pour vérifier votre adresse email.')
            ->action('Vérifier mon email', $this->verificationUrl($notifiable))
            ->line('Ce lien expirera dans 60 minutes.')
            ->line('Si vous n\'avez pas créé de compte, ignorez cet email.');
    }
}
