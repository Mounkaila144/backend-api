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
        Schema::table('t_sites', function (Blueprint $table) {
            $table->enum('is_uptodate', ['YES', 'NO'])->default('NO')->after('site_frontend_available');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_sites', function (Blueprint $table) {
            $table->dropColumn('is_uptodate');
        });
    }
};
