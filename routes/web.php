<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SubdomainController;
use App\Http\Controllers\AdminPageController;
use Illuminate\Support\Facades\Route;

Route::get('/', [PageController::class, 'welcome'])->name('home');
Route::get('/login', [PageController::class, 'login'])->name('login');
Route::get('/register', [PageController::class, 'register'])->name('register');

// Admin routes
Route::get('/admin/login', [AdminPageController::class, 'login'])->name('admin.login');
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/admin/dashboard', [AdminPageController::class, 'dashboard'])->name('admin.dashboard');
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');
    Route::get('/dashboard/subscriptions/{id}', [PageController::class, 'subscriptionDetail'])->name('subscription.detail');
    Route::get('/order/create', [OrderController::class, 'create'])->name('order.create');
    Route::get('/payment/process', [PaymentController::class, 'process'])->name('payment.process');
    Route::get('/payment/finish', [PaymentController::class, 'finish'])->name('payment.finish');
    Route::get('/payment/error', [PaymentController::class, 'error'])->name('payment.error');
    Route::get('/payment/pending', [PaymentController::class, 'pending'])->name('payment.pending');
});

// Wildcard subdomain routing for invitations
Route::domain('{subdomain}.malahproject.test')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.test');
});

Route::domain('{subdomain}.malahproject.com')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.com');
});

Route::domain('{subdomain}.malahproject.local')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation.local');
});
