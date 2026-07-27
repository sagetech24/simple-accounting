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
        Schema::table('purchased_orders', function (Blueprint $table) {
            $table->timestamp('posted_to_ap_at')->nullable()->after('meta');
            $table->index('posted_to_ap_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchased_orders', function (Blueprint $table) {
            $table->dropIndex(['posted_to_ap_at']);
            $table->dropColumn('posted_to_ap_at');
        });
    }
};
