<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// ====== PUBLIC ROUTES ======
// Authentication
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

// Templates (view only)
Route::get('/templates', [TemplateController::class, 'index']);
Route::get('/templates/{template}', [TemplateController::class, 'show']);
Route::get('/templates/{template}/demo', [TemplateController::class, 'demo']);

// Public invitation preview
Route::get('/invitations/{subdomain}', [InvitationController::class, 'preview']);

// Subscription subdomain check
Route::post('/subscriptions/check-subdomain', [SubscriptionController::class, 'checkSubdomain']);

// ====== PROTECTED ROUTES ======
Route::middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'currentUser']);

    // User subscriptions and purchases
    Route::get('/subscriptions', [SubscriptionController::class, 'userSubscriptions']);
    Route::post('/subscriptions', [SubscriptionController::class, 'create']);
    Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show']);
    Route::post('/subscriptions/{subscription}/activate', [SubscriptionController::class, 'activate']);

    // Invitation management
    Route::get('/subscriptions/{subscription}/invitation', [InvitationController::class, 'show']);
    Route::put('/subscriptions/{subscription}/invitation', [InvitationController::class, 'update']);

    // Transactions & Payments
    Route::get('/transactions', [TransactionController::class, 'userTransactions']);
    Route::post('/transactions/initiate', [PaymentController::class, 'initiate']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);

    // ====== ADMIN ROUTES ======
    Route::middleware('can:isAdmin')->group(function () {
        // Admin Dashboard
        Route::get('/admin/stats', [AdminController::class, 'stats']);

        // User Management
        Route::get('/admin/users', [AdminController::class, 'listUsers']);
        Route::get('/admin/users/{user}', [AdminController::class, 'getUserDetail']);
        Route::post('/admin/users/{user}/suspend', [AdminController::class, 'suspendUser']);

        // Template Management
        Route::get('/admin/templates', [AdminController::class, 'listTemplates']);
        Route::post('/admin/templates', [AdminController::class, 'storeTemplate']);
        Route::put('/templates/{template}', [TemplateController::class, 'update']);
        Route::delete('/templates/{template}', [TemplateController::class, 'destroy']);

        // Transaction Logs
        Route::get('/admin/transactions', [AdminController::class, 'listTransactions']);
        Route::get('/admin/transactions/{transaction}', [AdminController::class, 'getTransactionDetail']);
    });
});

// ====== WEBHOOK ROUTES (protected with Midtrans signature verification) ======
Route::post('/webhooks/midtrans', [PaymentController::class, 'webhook']);
