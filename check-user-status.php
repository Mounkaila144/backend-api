<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;

$tenant = Tenant::where('site_host', 'tenant1.local')->first();
tenancy()->initialize($tenant);

$user = DB::connection('tenant')
    ->table('t_users')
    ->where('username', 'superadmin')
    ->first();

echo "Utilisateur: {$user->username}\n";
echo "is_active: {$user->is_active}\n";
echo "status: {$user->status}\n";
