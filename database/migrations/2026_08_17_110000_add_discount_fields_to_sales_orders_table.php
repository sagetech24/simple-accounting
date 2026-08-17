<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->decimal('subtotal', 14, 2)->default(0)->after('customer_name');
            $table->string('discount_type')->default('none')->after('subtotal');
            $table->decimal('discount_value', 14, 2)->default(0)->after('discount_type');
            $table->decimal('discount_amount', 14, 2)->default(0)->after('discount_value');
        });

        DB::table('sales_orders')->update([
            'subtotal' => DB::raw('grand_total'),
            'discount_type' => 'none',
            'discount_value' => 0,
            'discount_amount' => 0,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn([
                'subtotal',
                'discount_type',
                'discount_value',
                'discount_amount',
            ]);
        });
    }
};
