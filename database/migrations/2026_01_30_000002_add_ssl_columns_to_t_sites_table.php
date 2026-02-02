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
            $table->enum('site_db_ssl_enabled', ['YES', 'NO'])->default('NO')->after('site_db_password');
            $table->enum('site_db_ssl_mode', ['DISABLED', 'PREFERRED', 'REQUIRED', 'VERIFY_CA', 'VERIFY_IDENTITY'])->default('PREFERRED')->after('site_db_ssl_enabled');
            $table->text('site_db_ssl_ca')->nullable()->after('site_db_ssl_mode');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_sites', function (Blueprint $table) {
            $table->dropColumn(['site_db_ssl_enabled', 'site_db_ssl_mode', 'site_db_ssl_ca']);
        });
    }
};
