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
        Schema::create('t_site_modules', function (Blueprint $table) {
            $table->id();
            $table->integer('site_id');
            $table->string('module_name', 100);
            $table->enum('is_active', ['YES', 'NO'])->default('YES');
            $table->dateTime('installed_at')->nullable();
            $table->dateTime('uninstalled_at')->nullable();
            $table->json('config')->nullable();

            // Contraintes
            $table->unique(['site_id', 'module_name'], 'unique_site_module');
            $table->foreign('site_id', 'fk_site_modules_site')
                  ->references('site_id')
                  ->on('t_sites')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_site_modules');
    }
};
