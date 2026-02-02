<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Crée la table t_users dans la base CENTRALE pour les SuperAdmins
     */
    public function up(): void
    {
        Schema::connection('mysql')->create('t_users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 100)->unique();
            $table->string('email', 255)->nullable();
            $table->string('password', 255);
            $table->string('salt', 255)->nullable()->comment('Legacy salt field');
            $table->string('firstname', 100)->nullable();
            $table->string('lastname', 100)->nullable();
            $table->enum('application', ['superadmin', 'admin'])->default('admin');
            $table->enum('is_active', ['YES', 'NO'])->default('YES');
            $table->enum('status', ['ACTIVE', 'INACTIVE', 'SUSPENDED'])->default('ACTIVE');
            $table->timestamp('lastlogin')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->index(['username', 'application']);
            $table->index(['is_active', 'status']);
        });

        // Créer un utilisateur SuperAdmin par défaut
        DB::connection('mysql')->table('t_users')->insert([
            'username' => 'superadmin',
            'email' => 'superadmin@example.com',
            'password' => Hash::make('password'), // Changez ce mot de passe!
            'firstname' => 'Super',
            'lastname' => 'Admin',
            'application' => 'superadmin',
            'is_active' => 'YES',
            'status' => 'ACTIVE',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mysql')->dropIfExists('t_users');
    }
};
