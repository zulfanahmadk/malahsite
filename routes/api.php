<?php

use App\Http\Controllers\TemplateController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TransactionController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

// ====== PUBLIC API ROUTES ======
// Templates (view only)
Route::get('/templates', [TemplateController::class, 'index']);
Route::get('/templates/{template}', [TemplateController::class, 'show']);
Route::get('/templates/{template}/demo', [TemplateController::class, 'demo']);

// Public invitation preview
Route::get('/invitations/{subdomain}', [InvitationController::class, 'preview']);

// Public subdomain check (untuk step order)
Route::post('/subscriptions/check-subdomain', [SubscriptionController::class, 'checkSubdomain']);

// ====== PROTECTED API ROUTES (Sanctum) ======
Route::middleware('auth:sanctum')->group(function () {
    // User subscriptions and purchases
    Route::get('/subscriptions', [SubscriptionController::class, 'userSubscriptions']);
    Route::post('/subscriptions', [SubscriptionController::class, 'create']);
    Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show']);
    Route::post('/subscriptions/{subscription}/activate', [SubscriptionController::class, 'activate']);

    // Transactions & Payments
    Route::get('/transactions', [TransactionController::class, 'userTransactions']);
    Route::post('/transactions/initiate', [PaymentController::class, 'initiate']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);

    // ====== ADMIN API ROUTES ======
    Route::middleware('can:isAdmin')->group(function () {
        Route::get('/admin/stats', [AdminController::class, 'stats']);
        Route::get('/admin/users', [AdminController::class, 'listUsers']);
        Route::get('/admin/users/{user}', [AdminController::class, 'getUserDetail']);
        Route::post('/admin/users/{user}/suspend', [AdminController::class, 'suspendUser']);
        Route::get('/admin/templates', [AdminController::class, 'listTemplates']);
        Route::post('/admin/templates', [AdminController::class, 'storeTemplate']);
        Route::get('/admin/transactions', [AdminController::class, 'listTransactions']);
        Route::get('/admin/transactions/{transaction}', [AdminController::class, 'getTransactionDetail']);
    });
});

// Invitation management with dual auth (Sanctum + Session)
Route::middleware('auth.api.or.session')->group(function () {
    Route::get('/subscriptions/{subscription}/invitation', [InvitationController::class, 'show']);
    Route::put('/subscriptions/{subscription}/invitation', [InvitationController::class, 'update']);
});

// Webhook (multiple routes for compatibility)
Route::post('/webhooks/midtrans', [PaymentController::class, 'webhook']);
Route::post('/midtrans/notification', [PaymentController::class, 'webhook']); // Alias for Midtrans default

// Check subscription status (needs authentication)
Route::get('/subscriptions/{id}/status', [PaymentController::class, 'checkSubscriptionStatus'])->middleware('auth');

// Payment endpoints (session-based auth)
Route::middleware('auth')->group(function () {
    Route::post('/payment/charge', [PaymentController::class, 'charge'])->name('payment.charge');
    Route::get('/payment/debug', [PaymentController::class, 'debug'])->name('payment.debug');
});
