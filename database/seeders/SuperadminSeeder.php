<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * Crée (ou met à jour) le user superadmin par défaut dans la DB centrale.
 *
 * Idempotent : peut être relancé sans dupliquer. À chaque run, le mot de passe
 * est REMIS à `DEFAULT_PASSWORD`. C'est volontaire pour le dev local — change
 * `DEFAULT_PASSWORD` (ou supprime ce seeder de la prod) avant déploiement.
 */
class SuperadminSeeder extends Seeder
{
    private const DEFAULT_USERNAME = 'superadmin';
    private const DEFAULT_PASSWORD = '123';
    private const DEFAULT_EMAIL    = 'superadmin@example.com';

    public function run(): void
    {
        $now = now();

        DB::connection('mysql')->table('t_users')->updateOrInsert(
            ['username' => self::DEFAULT_USERNAME],
            [
                'email'       => self::DEFAULT_EMAIL,
                'password'    => Hash::make(self::DEFAULT_PASSWORD),
                'firstname'   => 'Super',
                'lastname'    => 'Admin',
                'application' => 'superadmin',
                'is_active'   => 'YES',
                'status'      => 'ACTIVE',
                'updated_at'  => $now,
                'created_at'  => $now,
            ]
        );

        $this->command?->info(sprintf(
            'Superadmin: username=%s  password=%s  (DB centrale)',
            self::DEFAULT_USERNAME,
            self::DEFAULT_PASSWORD
        ));
    }
}
