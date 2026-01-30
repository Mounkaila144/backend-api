<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Http;
use Modules\Superadmin\Services\ServiceConfigManager;

class MeilisearchHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'meilisearch';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $config = $config ?? $this->getConfig();

            if (!$config) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No Meilisearch configuration found',
                    details: []
                );
            }

            $url = rtrim($config['url'], '/');
            $apiKey = $config['api_key'];

            // Check health endpoint
            $healthResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/health");

            if (!$healthResponse->successful()) {
                throw new \Exception('Health check failed: '.$healthResponse->status());
            }

            // Get version info
            $versionResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/version");

            $version = $versionResponse->json();

            // Get stats
            $statsResponse = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
            ])->timeout(10)->get("{$url}/stats");

            $stats = $statsResponse->json();

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Meilisearch connection successful',
                details: [
                    'url' => $url,
                    'version' => $version['pkgVersion'] ?? 'Unknown',
                    'database_size' => $stats['databaseSize'] ?? 0,
                    'indexes_count' => count($stats['indexes'] ?? []),
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Meilisearch error: '.$e->getMessage(),
                details: [],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    protected function getConfig(): ?array
    {
        return app(ServiceConfigManager::class)->get('meilisearch');
    }
}
