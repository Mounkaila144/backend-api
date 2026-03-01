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
            // Theme columns
            $table->string('site_admin_theme', 100)->default('default')->after('site_available');
            $table->string('site_admin_theme_base', 100)->default('default')->after('site_admin_theme');
            $table->string('site_frontend_theme', 100)->default('default')->after('site_admin_theme_base');
            $table->string('site_frontend_theme_base', 100)->default('default')->after('site_frontend_theme');

            // Access control
            $table->tinyInteger('site_access_restricted')->default(0)->after('site_frontend_theme_base');
            $table->string('site_master', 255)->default('')->after('site_access_restricted');

            // Media columns
            $table->string('logo', 255)->default('')->after('site_master');
            $table->string('picture', 255)->default('')->after('logo');
            $table->string('banner', 255)->default('')->after('picture');
            $table->string('favicon', 255)->default('')->after('banner');

            // Pricing and sizing
            $table->decimal('price', 10, 2)->default(0.00)->after('favicon');
            $table->bigInteger('site_db_size')->default(0)->after('price');
            $table->bigInteger('site_size')->default(0)->after('site_db_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_sites', function (Blueprint $table) {
            $table->dropColumn([
                'site_admin_theme',
                'site_admin_theme_base',
                'site_frontend_theme',
                'site_frontend_theme_base',
                'site_access_restricted',
                'site_master',
                'logo',
                'picture',
                'banner',
                'favicon',
                'price',
                'site_db_size',
                'site_size',
            ]);
        });
    }
};
