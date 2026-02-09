<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\AdminPageController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Public / Guest Routes
Route::get('/', [PageController::class, 'welcome'])->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [PageController::class, 'login'])->name('login');
    Route::get('/register', [PageController::class, 'register'])->name('register');
    Route::get('/admin/login', [AdminPageController::class, 'login'])->name('admin.login');

    // Action Login/Register ditaruh di sini agar Session Aktif
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// Authenticated Routes (Menggunakan Session)
Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/auth/me', [AuthController::class, 'currentUser']);

    // User Dashboard
    Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/subscriptions/{id}', [PageController::class, 'subscriptionDetail'])->name('subscription.detail');
    Route::put('/dashboard/subscriptions/{subscription}/invitation', [\App\Http\Controllers\InvitationController::class, 'update'])->name('invitation.update');

    // Payments & Orders
    Route::get('/order/create', [OrderController::class, 'create'])->name('order.create');
    Route::post('/order/store', [OrderController::class, 'store'])->name('order.store');
    Route::get('/payment/process', [PaymentController::class, 'process'])->name('payment.process');
    Route::get('/payment/finish', [PaymentController::class, 'finish'])->name('payment.finish');
    Route::get('/payment/error', [PaymentController::class, 'error'])->name('payment.error');
    Route::get('/payment/pending', [PaymentController::class, 'pending'])->name('payment.pending');

    // API endpoints for payment
    Route::post('/api/payment/charge', [PaymentController::class, 'charge'])->name('payment.charge');
    Route::get('/api/subscriptions/{id}/status', [PaymentController::class, 'checkSubscriptionStatus'])->name('subscription.status');
    Route::get('/api/payment/debug', [PaymentController::class, 'debug'])->name('payment.debug');

    // Debug endpoints
    Route::get('/api/debug/invitation/{subscriptionId}', [\App\Http\Controllers\DebugController::class, 'checkInvitation'])->name('debug.invitation');
});

// Admin Dashboard Route
Route::middleware(['auth', 'can:isAdmin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminPageController::class, 'dashboard'])->name('admin.dashboard');
});

// Wildcard Subdomain Routing
Route::domain('{subdomain}.malahproject.test')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.test');
});

Route::domain('{subdomain}.malahproject.com')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.com');
});

Route::domain('{subdomain}.malahproject.local')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.local');
});
