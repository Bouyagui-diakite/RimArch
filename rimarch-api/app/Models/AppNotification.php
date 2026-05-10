<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppNotification extends Model
{
    public $timestamps = false;

    protected $table = 'notifications';

    protected $fillable = ['user_id', 'type', 'title', 'message', 'link', 'read_at'];

    protected $casts = ['created_at' => 'datetime', 'read_at' => 'datetime'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getIsReadAttribute(): bool
    {
        return !is_null($this->read_at);
    }

    // Envoie une notif à un user spécifique
    public static function send(int $userId, string $type, string $title, string $message, ?string $link = null): void
    {
        try {
            self::create([
                'user_id' => $userId,
                'type'    => $type,
                'title'   => $title,
                'message' => $message,
                'link'    => $link,
            ]);
        } catch (\Throwable) {}
    }

    // Envoie à tous les admins
    public static function sendToAdmins(string $type, string $title, string $message, ?string $link = null): void
    {
        try {
            $admins = User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->pluck('id');
            foreach ($admins as $adminId) {
                self::send($adminId, $type, $title, $message, $link);
            }
        } catch (\Throwable) {}
    }
}
