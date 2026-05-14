<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/notifications',                          [NotificationController::class, 'index']);
    Route::post('/notifications/{notification}/read',     [NotificationController::class, 'markRead']);
    Route::post('/notifications/read-all',                [NotificationController::class, 'markAllRead']);
    Route::get('/export/documents',                       [ExportController::class, 'documents']);
    Route::get('/documents',                  [DocumentController::class, 'index']);
    Route::post('/documents',                 [DocumentController::class, 'store']);
    Route::get('/documents/{document}',       [DocumentController::class, 'show']);
    Route::put('/documents/{document}',       [DocumentController::class, 'update']);
    Route::delete('/documents/{document}',    [DocumentController::class, 'destroy']);
    Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    Route::get('/documents/{document}/preview',  [DocumentController::class, 'preview']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/stats',                          [AdminController::class, 'getStats']);
    Route::get('/logs',                           [AdminController::class, 'getLogs']);
    Route::get('/export/logs',                    [ExportController::class, 'logs']);
    Route::get('/export/logs/pdf',                [ExportController::class, 'logsPdf']);
    Route::get('/roles',                          [AdminController::class, 'getRoles']);
    Route::get('/users',                          [AdminController::class, 'getUsers']);
    Route::post('/users',                         [AdminController::class, 'createUser']);
    Route::put('/users/{user}/role',              [AdminController::class, 'updateUserRole']);
    Route::delete('/users/{user}',                [AdminController::class, 'deleteUser']);
});

Route::prefix('auth')->group(function () {
    Route::post('/register',        [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login',           [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password',  [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me',               [AuthController::class, 'me']);
        Route::post('/logout',          [AuthController::class, 'logout']);
        Route::put('/profile',          [AuthController::class, 'updateProfile']);
        Route::put('/password',         [AuthController::class, 'updatePassword']);
        Route::post('/email/resend',    [AuthController::class, 'resendVerification']);
    });

    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed'])
        ->name('verification.verify');
});
