<?php

namespace App\Providers;

use App\Models\PurchasedOrder;
use App\Models\SalesOrder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Relation::enforceMorphMap([
            'purchased_order' => PurchasedOrder::class,
            'sales_order' => SalesOrder::class,
        ]);
    }
}
