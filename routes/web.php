<?php

use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\HomeController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

Route::middleware('auth')->group(function () {
    Route::redirect('/', '/products')->name('home');

    Route::get('products', [HomeController::class, 'index'])->name('products');
    Route::inertia('suppliers', 'suppliers/index')->name('suppliers');
    Route::inertia('customers', 'customers/index')->name('customers');
    Route::inertia('request-quotations', 'request-quotations/index')->name('request-quotations');
    Route::inertia('purchased-orders', 'purchased-orders/index')->name('purchased-orders');
    Route::inertia('received-orders', 'received-orders/index')->name('received-orders');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('products/{product}/restore', [ProductController::class, 'restore'])
            ->withTrashed()
            ->name('products.restore');

        Route::resource('products', ProductController::class)->except(['show']);
    });
});
