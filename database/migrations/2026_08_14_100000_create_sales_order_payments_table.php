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
        Schema::create('sales_order_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')
                ->constrained('sales_orders')
                ->cascadeOnDelete();
            $table->string('method');
            $table->decimal('amount', 14, 2);
            $table->text('notes')->nullable();
            $table->string('platform')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('bank_name')->nullable();
            $table->foreignId('bank_check_id')
                ->nullable()
                ->unique()
                ->constrained('bank_checks')
                ->nullOnDelete();
            $table->string('recorded_by');
            $table->timestamp('paid_at');
            $table->timestamps();

            $table->index('method');
            $table->index('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales_order_payments');
    }
};
