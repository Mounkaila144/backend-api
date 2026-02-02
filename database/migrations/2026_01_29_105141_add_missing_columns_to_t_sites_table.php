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
            // Colonne pour indiquer si c'est un client
            $table->enum('is_customer', ['YES', 'NO'])->default('NO')->after('site_available');

            // Colonnes de disponibilité admin et frontend
            $table->enum('site_admin_available', ['YES', 'NO'])->default('YES')->after('is_customer');
            $table->enum('site_frontend_available', ['YES', 'NO'])->default('YES')->after('site_admin_available');

            // Type de site
            $table->string('site_type', 50)->nullable()->after('site_frontend_available');

            // Nom de l'entreprise/société
            $table->string('site_company', 255)->nullable()->after('site_type');

            // Date de dernière connexion
            $table->timestamp('site_last_connection')->nullable()->after('site_company');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_sites', function (Blueprint $table) {
            $table->dropColumn([
                'is_customer',
                'site_admin_available',
                'site_frontend_available',
                'site_type',
                'site_company',
                'site_last_connection',
            ]);
        });
    }
};
