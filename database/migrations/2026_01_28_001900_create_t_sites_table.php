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
        Schema::create('t_sites', function (Blueprint $table) {
            $table->integer('site_id')->primary();
            $table->string('site_host', 255);
            $table->string('site_name', 255)->nullable();
            $table->string('site_db_name', 100);
            $table->string('site_db_host', 100)->default('localhost');
            $table->string('site_db_login', 100);
            $table->string('site_db_password', 255);
            $table->enum('site_available', ['YES', 'NO'])->default('YES');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_sites');
    }
};
