<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Http\Resources\HealthCheckResource;
use Modules\Superadmin\Services\ServiceHealthChecker;

class HealthController extends Controller
{
    protected const CACHE_KEY = 'health:all';

    protected const CACHE_TTL = 30; // secondes

    public function __construct(
        protected ServiceHealthChecker $healthChecker
    ) {
    }

    /**
     * GET /api/superadmin/health
     * Dashboard santé global avec cache
     */
    public function index(): JsonResponse
    {
        $cacheHit = Cache::has(self::CACHE_KEY);

        $results = Cache::remember(
            self::CACHE_KEY,
            self::CACHE_TTL,
            fn () => $this->healthChecker->checkAll()
        );

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
            ])
            ->header('X-Cache-Status', $cacheHit ? 'HIT' : 'MISS')
            ->header('X-Cache-TTL', self::CACHE_TTL);
    }

    /**
     * POST /api/superadmin/health/test-all
     * Test complet de connectivité - invalide le cache et log dans audit trail
     */
    public function testAll(): JsonResponse
    {
        $startTime = microtime(true);

        // Exécuter les tests complets
        $results = $this->healthChecker->testAll(fullTest: true);

        // Invalider et rafraîchir le cache
        Cache::forget(self::CACHE_KEY);
        Cache::put(self::CACHE_KEY, $results, self::CACHE_TTL);

        $totalTime = (microtime(true) - $startTime) * 1000;

        // Logger le test manuel dans l'audit trail
        Log::channel('superadmin')->info('Health check performed', [
                'action' => 'health.test_all',
                'overall_status' => $results->getOverallStatus(),
                'services_tested' => count($results->getResults()),
                'failed_services' => $this->getFailedServices($results),
                'degraded_services' => $this->getDegradedServices($results),
                'total_time_ms' => round($totalTime, 2),
                'user_id' => auth()->id(),
            ]);

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
                'meta' => [
                    'fullTest' => true,
                    'totalTimeMs' => round($totalTime, 2),
                ],
            ])
            ->header('X-Cache-Status', 'REFRESH');
    }

    /**
     * POST /api/superadmin/health/refresh
     * Force un rafraîchissement du cache
     */
    public function refresh(): JsonResponse
    {
        Cache::forget(self::CACHE_KEY);

        $results = $this->healthChecker->checkAll();
        Cache::put(self::CACHE_KEY, $results, self::CACHE_TTL);

        return response()
            ->json([
                'data' => new HealthCheckResource($results),
            ])
            ->header('X-Cache-Status', 'REFRESH');
    }

    /**
     * Extraire les services en échec
     */
    protected function getFailedServices($results): array
    {
        $failed = [];
        foreach ($results->getResults() as $result) {
            if (!$result->healthy) {
                $failed[] = [
                    'service' => $result->service,
                    'message' => $result->message,
                ];
            }
        }

        return $failed;
    }

    /**
     * Extraire les services dégradés
     */
    protected function getDegradedServices($results): array
    {
        $degraded = [];
        foreach ($results->getResults() as $result) {
            if ($result->healthy && method_exists($result, 'isDegraded') && $result->isDegraded()) {
                $degraded[] = [
                    'service' => $result->service,
                    'latencyMs' => $result->latencyMs,
                ];
            }
        }

        return $degraded;
    }
}
