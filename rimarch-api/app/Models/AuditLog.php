<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'description',
        'ip_address',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log(
        string $action,
        string $description,
        ?Model $model = null,
        ?int $userId = null
    ): void {
        try {
            $request = app(Request::class);
            self::create([
                'user_id'    => $userId ?? auth()->id(),
                'action'     => $action,
                'model_type' => $model ? class_basename($model) : null,
                'model_id'   => $model?->getKey(),
                'description'=> $description,
                'ip_address' => $request->ip(),
            ]);
        } catch (\Throwable) {
            // Ne jamais bloquer l'app si le log échoue
        }
    }
}
