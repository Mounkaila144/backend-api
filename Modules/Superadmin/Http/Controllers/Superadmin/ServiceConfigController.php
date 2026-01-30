<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Http\Requests\UpdateMeilisearchConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateRedisCacheConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateRedisQueueConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateResendConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateS3ConfigRequest;
use Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker;
use Modules\Superadmin\Services\Checkers\RedisHealthChecker;
use Modules\Superadmin\Services\Checkers\ResendHealthChecker;
use Modules\Superadmin\Services\Checkers\S3HealthChecker;
use Modules\Superadmin\Services\ServiceConfigManager;

class ServiceConfigController extends Controller
{
    public function __construct(
        private ServiceConfigManager $configManager,
        private S3HealthChecker $s3Checker,
        private ResendHealthChecker $resendChecker,
        private MeilisearchHealthChecker $meilisearchChecker
    ) {
    }

    /**
     * GET /api/superadmin/config/s3
     */
    public function getS3Config(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('s3');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('s3'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/s3
     */
    public function updateS3Config(UpdateS3ConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('s3', $request->validated());

        return response()->json([
            'message' => 'S3 configuration saved',
            'data' => $this->configManager->getForDisplay('s3'),
        ]);
    }

    /**
     * POST /api/superadmin/config/s3/test
     */
    public function testS3Connection(UpdateS3ConfigRequest $request): JsonResponse
    {
        // Tester avec la config fournie (pas encore sauvegardée)
        $config = $request->validated();
        $result = $this->s3Checker->check($config);

        // Audit trail
        Log::channel('superadmin')->info('Service s3 connection test', [
                'action' => 'service.connection.tested',
                'service' => 's3',
                'result' => $result->healthy ? 'success' : 'failed',
                'message' => $result->message,
                'user_id' => auth()->id(),
            ]);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }

    /**
     * GET /api/superadmin/config/redis-cache
     */
    public function getRedisCacheConfig(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('redis-cache');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('redis-cache'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/redis-cache
     */
    public function updateRedisCacheConfig(UpdateRedisCacheConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('redis-cache', $request->validated());

        return response()->json([
            'message' => 'Redis cache configuration saved',
            'data' => $this->configManager->getForDisplay('redis-cache'),
        ]);
    }

    /**
     * POST /api/superadmin/config/redis-cache/test
     */
    public function testRedisCacheConnection(UpdateRedisCacheConfigRequest $request): JsonResponse
    {
        $config = $request->validated();

        // Fusionner avec la config enregistrée pour obtenir les valeurs manquantes (comme le password)
        $savedConfig = $this->configManager->get('redis-cache') ?? [];
        $config = array_merge($savedConfig, array_filter($config, fn($value) => $value !== null && $value !== ''));

        $checker = RedisHealthChecker::forCache();
        $result = $checker->check($config);

        // Audit trail
        Log::channel('superadmin')->info('Service redis-cache connection test', [
                'action' => 'service.connection.tested',
                'service' => 'redis-cache',
                'result' => $result->healthy ? 'success' : 'failed',
                'message' => $result->message,
                'user_id' => auth()->id(),
            ]);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }

    /**
     * GET /api/superadmin/config/redis-queue
     */
    public function getRedisQueueConfig(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('redis-queue');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('redis-queue'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/redis-queue
     */
    public function updateRedisQueueConfig(UpdateRedisQueueConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('redis-queue', $request->validated());

        return response()->json([
            'message' => 'Redis queue configuration saved',
            'data' => $this->configManager->getForDisplay('redis-queue'),
        ]);
    }

    /**
     * POST /api/superadmin/config/redis-queue/test
     */
    public function testRedisQueueConnection(UpdateRedisQueueConfigRequest $request): JsonResponse
    {
        $config = $request->validated();

        // Fusionner avec la config enregistrée pour obtenir les valeurs manquantes (comme le password)
        $savedConfig = $this->configManager->get('redis-queue') ?? [];
        $config = array_merge($savedConfig, array_filter($config, fn($value) => $value !== null && $value !== ''));

        $checker = RedisHealthChecker::forQueue();
        $result = $checker->check($config);

        // Audit trail
        Log::channel('superadmin')->info('Service redis-queue connection test', [
                'action' => 'service.connection.tested',
                'service' => 'redis-queue',
                'result' => $result->healthy ? 'success' : 'failed',
                'message' => $result->message,
                'user_id' => auth()->id(),
            ]);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }

    /**
     * GET /api/superadmin/config/resend
     */
    public function getResendConfig(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('resend');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('resend'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/resend
     */
    public function updateResendConfig(UpdateResendConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('resend', $request->validated());

        return response()->json([
            'message' => 'Resend configuration saved',
            'data' => $this->configManager->getForDisplay('resend'),
        ]);
    }

    /**
     * POST /api/superadmin/config/resend/test
     */
    public function testResendConnection(UpdateResendConfigRequest $request): JsonResponse
    {
        $config = $request->validated();

        // Fusionner avec la config enregistrée pour obtenir les valeurs manquantes (comme l'api_key)
        $savedConfig = $this->configManager->get('resend') ?? [];
        $config = array_merge($savedConfig, array_filter($config, fn($value) => $value !== null && $value !== ''));

        $result = $this->resendChecker->check($config);

        // Audit trail
        Log::channel('superadmin')->info('Service resend connection test', [
                'action' => 'service.connection.tested',
                'service' => 'resend',
                'result' => $result->healthy ? 'success' : 'failed',
                'message' => $result->message,
                'user_id' => auth()->id(),
            ]);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }

    /**
     * GET /api/superadmin/config/meilisearch
     */
    public function getMeilisearchConfig(): JsonResponse
    {
        $config = $this->configManager->getForDisplay('meilisearch');

        return response()->json([
            'data' => $config,
            'schema' => $this->configManager->getServiceSchema('meilisearch'),
        ]);
    }

    /**
     * PUT /api/superadmin/config/meilisearch
     */
    public function updateMeilisearchConfig(UpdateMeilisearchConfigRequest $request): JsonResponse
    {
        $serviceConfig = $this->configManager->save('meilisearch', $request->validated());

        return response()->json([
            'message' => 'Meilisearch configuration saved',
            'data' => $this->configManager->getForDisplay('meilisearch'),
        ]);
    }

    /**
     * POST /api/superadmin/config/meilisearch/test
     */
    public function testMeilisearchConnection(UpdateMeilisearchConfigRequest $request): JsonResponse
    {
        $config = $request->validated();

        // Fusionner avec la config enregistrée pour obtenir les valeurs manquantes (comme l'api_key)
        $savedConfig = $this->configManager->get('meilisearch') ?? [];
        $config = array_merge($savedConfig, array_filter($config, fn($value) => $value !== null && $value !== ''));

        $result = $this->meilisearchChecker->check($config);

        // Audit trail
        Log::channel('superadmin')->info('Service meilisearch connection test', [
                'action' => 'service.connection.tested',
                'service' => 'meilisearch',
                'result' => $result->healthy ? 'success' : 'failed',
                'message' => $result->message,
                'user_id' => auth()->id(),
            ]);

        return response()->json([
            'data' => $result->toArray(),
        ]);
    }
}
