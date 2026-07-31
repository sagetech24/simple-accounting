<?php

use App\Http\Controllers\AccountsPayableController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\BankAccountController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PurchasedOrderController;
use App\Http\Controllers\RequestQuotationController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SupplierController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
});

Route::get('/', [LandingController::class, 'index'])
    ->middleware('throttle:60,1')
    ->name('home');

Route::middleware('auth')->group(function () {
    Route::get('products', [HomeController::class, 'index'])->name('products');
    Route::redirect('received-orders', '/inventory');
    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/{product}/adjust', [InventoryController::class, 'adjust'])
        ->name('inventory.adjust');
    Route::post('inventory/{product}/settings', [InventoryController::class, 'updateSettings'])
        ->name('inventory.settings');

    Route::post('suppliers/{supplier}/restore', [SupplierController::class, 'restore'])
        ->withTrashed()
        ->name('suppliers.restore');
    Route::resource('suppliers', SupplierController::class)->except(['show', 'create', 'edit']);

    Route::post('customers/{customer}/restore', [CustomerController::class, 'restore'])
        ->withTrashed()
        ->name('customers.restore');
    Route::resource('customers', CustomerController::class)->except(['show', 'create', 'edit']);

    Route::post('request-quotations/{request_quotation}/submit', [RequestQuotationController::class, 'submit'])
        ->name('request-quotations.submit');
    Route::post('request-quotations/{request_quotation}/approve', [RequestQuotationController::class, 'approve'])
        ->name('request-quotations.approve');
    Route::post('request-quotations/{request_quotation}/create-purchase-order', [RequestQuotationController::class, 'createPurchaseOrder'])
        ->name('request-quotations.create-purchase-order');
    Route::post('request-quotations/{request_quotation}/restore', [RequestQuotationController::class, 'restore'])
        ->withTrashed()
        ->name('request-quotations.restore');
    Route::resource('request-quotations', RequestQuotationController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::post('purchased-orders/{purchased_order}/mark-ordered', [PurchasedOrderController::class, 'markOrdered'])
        ->name('purchased-orders.mark-ordered');
    Route::post('purchased-orders/{purchased_order}/mark-received-with-adjustment', [PurchasedOrderController::class, 'markReceivedWithAdjustment'])
        ->name('purchased-orders.mark-received-with-adjustment');
    Route::post('purchased-orders/{purchased_order}/payments', [PurchasedOrderController::class, 'storePayment'])
        ->name('purchased-orders.payments.store');
    Route::post('purchased-orders/{purchased_order}/post-to-accounts-payable', [PurchasedOrderController::class, 'postToAccountsPayable'])
        ->name('purchased-orders.post-to-accounts-payable');
    Route::post('purchased-orders/{purchased_order}/restore', [PurchasedOrderController::class, 'restore'])
        ->withTrashed()
        ->name('purchased-orders.restore');
    Route::resource('purchased-orders', PurchasedOrderController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    Route::get('accounts-payable', [AccountsPayableController::class, 'index'])
        ->name('accounts-payable.index');
    Route::get('accounts-payable/{supplier}', [AccountsPayableController::class, 'supplier'])
        ->withTrashed()
        ->name('accounts-payable.supplier');
    Route::get('accounts-payable/{supplier}/{purchased_order:reference}', [AccountsPayableController::class, 'show'])
        ->withTrashed()
        ->name('accounts-payable.show');
    Route::post('accounts-payable/{supplier}/{purchased_order:reference}/payments', [AccountsPayableController::class, 'storePayment'])
        ->withTrashed()
        ->name('accounts-payable.payments.store');

    Route::post('bank-accounts/{bank_account}/restore', [BankAccountController::class, 'restore'])
        ->withTrashed()
        ->name('bank-accounts.restore');
    Route::resource('bank-accounts', BankAccountController::class)->except(['show', 'create', 'edit']);

    Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::post('products/{product}/restore', [ProductController::class, 'restore'])
            ->withTrashed()
            ->name('products.restore');

        Route::resource('products', ProductController::class)->except(['show']);
    });
});
