<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\DB;

class DatabaseHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'database';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            // Test connexion avec query simple
            $version = DB::selectOne('SELECT VERSION() as version');
            $dbName = DB::selectOne('SELECT DATABASE() as db_name');

            // Stats basiques
            $tableCount = DB::selectOne("
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
            ");

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Database connection successful',
                details: [
                    'version' => $version->version ?? 'Unknown',
                    'database' => $dbName->db_name ?? 'Unknown',
                    'table_count' => $tableCount->count ?? 0,
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Database connection failed: '.$e->getMessage(),
                details: [],
                latencyMs: $latency
            );
        }
    }
}
