<?php

namespace Modules\Superadmin\Services;

use Modules\Superadmin\Services\Checkers\DatabaseHealthChecker;
use Modules\Superadmin\Services\Checkers\HealthCheckResult;
use Modules\Superadmin\Services\Checkers\HealthCheckResultCollection;
use Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker;
use Modules\Superadmin\Services\Checkers\RedisHealthChecker;
use Modules\Superadmin\Services\Checkers\ResendHealthChecker;
use Modules\Superadmin\Services\Checkers\S3HealthChecker;
use Illuminate\Support\Facades\Log;

class ServiceHealthChecker
{
    protected array $checkers = [];

    public function __construct(
        protected S3HealthChecker $s3Checker,
        protected DatabaseHealthChecker $databaseChecker,
        protected RedisHealthChecker $redisChecker,
        protected ResendHealthChecker $resendChecker,
        protected MeilisearchHealthChecker $meilisearchChecker
    ) {
        $this->checkers = [
            's3' => $s3Checker,
            'database' => $databaseChecker,
            'redis-cache' => $redisChecker,
            'redis-queue' => $redisChecker, // Same checker, different config
            'resend' => $resendChecker,
            'meilisearch' => $meilisearchChecker,
        ];
    }

    public function checkAll(): HealthCheckResultCollection
    {
        $results = [];
        $startTime = microtime(true);

        // Execute checks in parallel using concurrent requests
        foreach ($this->checkers as $serviceName => $checker) {
            try {
                $results[$serviceName] = $checker->check();
            } catch (\Throwable $e) {
                Log::channel('superadmin')->error("Health check failed for {$serviceName}", [
                    'error' => $e->getMessage(),
                ]);

                $results[$serviceName] = new HealthCheckResult(
                    service: $serviceName,
                    healthy: false,
                    message: 'Check failed: ' . $e->getMessage(),
                    details: []
                );
            }
        }

        $totalTime = (microtime(true) - $startTime) * 1000;

        return new HealthCheckResultCollection($results, $totalTime);
    }

    public function checkService(string $serviceName): HealthCheckResult
    {
        if (!isset($this->checkers[$serviceName])) {
            return new HealthCheckResult(
                service: $serviceName,
                healthy: false,
                message: "Unknown service: {$serviceName}",
                details: []
            );
        }

        try {
            return $this->checkers[$serviceName]->check();
        } catch (\Throwable $e) {
            Log::channel('superadmin')->error("Health check failed for {$serviceName}", [
                'error' => $e->getMessage(),
            ]);

            return new HealthCheckResult(
                service: $serviceName,
                healthy: false,
                message: 'Check failed: ' . $e->getMessage(),
                details: []
            );
        }
    }

    public function testAll(bool $fullTest = true): HealthCheckResultCollection
    {
        $results = [];
        $startTime = microtime(true);

        // Execute full tests (write/read/delete operations)
        foreach ($this->checkers as $serviceName => $checker) {
            try {
                // Use fullTest() method if available, otherwise fall back to check()
                if ($fullTest && method_exists($checker, 'fullTest')) {
                    $results[$serviceName] = $checker->fullTest();
                } else {
                    $results[$serviceName] = $checker->check();
                }
            } catch (\Throwable $e) {
                Log::channel('superadmin')->error("Health full test failed for {$serviceName}", [
                    'error' => $e->getMessage(),
                ]);

                $results[$serviceName] = new HealthCheckResult(
                    service: $serviceName,
                    healthy: false,
                    message: 'Full test failed: ' . $e->getMessage(),
                    details: []
                );
            }
        }

        $totalTime = (microtime(true) - $startTime) * 1000;

        return new HealthCheckResultCollection($results, $totalTime);
    }

    public function getAvailableServices(): array
    {
        return array_keys($this->checkers);
    }
}
