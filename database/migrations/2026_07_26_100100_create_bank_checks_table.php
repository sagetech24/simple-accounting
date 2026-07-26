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
        Schema::create('bank_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')
                ->constrained('bank_accounts')
                ->restrictOnDelete();
            $table->string('check_number');
            $table->decimal('amount', 14, 2);
            $table->date('due_date');
            $table->string('issued_by');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('due_date');
            $table->index('check_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_checks');
    }
};
