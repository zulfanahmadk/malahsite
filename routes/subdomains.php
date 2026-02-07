<?php

use App\Http\Controllers\SubdomainController;
use Illuminate\Support\Facades\Route;

// Wildcard subdomain routing for invitations
Route::domain('{subdomain}.malahproject.test')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation');
});

// Also support production domain
Route::domain('{subdomain}.malahproject.com')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation');
});

// Local development
Route::domain('{subdomain}.malahproject.local')->group(function () {
    Route::get('/', [SubdomainController::class, 'show'])->name('invitation');
});
