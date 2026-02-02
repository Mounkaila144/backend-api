<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ajoute la colonne installed_version à la table t_site_modules
 *
 * Cette colonne permet de tracker la version installée de chaque module
 * pour gérer les mises à jour incrémentales du système legacy.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('t_site_modules', function (Blueprint $table) {
            // Version actuellement installée (ex: "2.9", "1.5")
            $table->string('installed_version', 20)->nullable()->after('config');

            // Date de dernière mise à jour de version
            $table->timestamp('version_updated_at')->nullable()->after('installed_version');

            // Historique des versions appliquées (JSON array)
            $table->json('version_history')->nullable()->after('version_updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_site_modules', function (Blueprint $table) {
            $table->dropColumn(['installed_version', 'version_updated_at', 'version_history']);
        });
    }
};
