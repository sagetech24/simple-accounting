<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->unsignedInteger('low_stock_threshold')->nullable()->after('quantity');
        });

        Schema::create('product_selling_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->decimal('previous_price', 12, 2);
            $table->decimal('new_price', 12, 2);
            $table->text('note')->nullable();
            $table->string('created_by')->nullable();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_selling_price_histories');

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('low_stock_threshold');
        });
    }
};
