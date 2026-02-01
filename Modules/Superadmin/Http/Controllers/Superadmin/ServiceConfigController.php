<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Http\Requests\UpdateMeilisearchConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateResendConfigRequest;
use Modules\Superadmin\Http\Requests\UpdateS3ConfigRequest;
use Modules\Superadmin\Services\Checkers\MeilisearchHealthChecker;
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
     * GET /api/superadmin/config/s3/test
     * Teste la connexion S3 avec la config sauvegardée
     */
    public function testS3Connection(): JsonResponse
    {
        // Utiliser uniquement la config sauvegardée
        $config = $this->configManager->get('s3');

        if (!$config) {
            return response()->json([
                'data' => [
                    'service' => 's3',
                    'status' => 'unhealthy',
                    'healthy' => false,
                    'message' => 'No S3 configuration found. Please save configuration first.',
                    'details' => [],
                    'latencyMs' => null,
                    'checkedAt' => now()->toIso8601String(),
                ],
            ]);
        }

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
     * GET /api/superadmin/config/resend/test
     * Teste la connexion Resend avec la config sauvegardée
     */
    public function testResendConnection(): JsonResponse
    {
        $config = $this->configManager->get('resend');

        if (!$config) {
            return response()->json([
                'data' => [
                    'service' => 'resend',
                    'status' => 'unhealthy',
                    'healthy' => false,
                    'message' => 'No Resend configuration found. Please save configuration first.',
                    'details' => [],
                    'latencyMs' => null,
                    'checkedAt' => now()->toIso8601String(),
                ],
            ]);
        }

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
     * GET /api/superadmin/config/meilisearch/test
     * Teste la connexion Meilisearch avec la config sauvegardée
     */
    public function testMeilisearchConnection(): JsonResponse
    {
        $config = $this->configManager->get('meilisearch');

        if (!$config) {
            return response()->json([
                'data' => [
                    'service' => 'meilisearch',
                    'status' => 'unhealthy',
                    'healthy' => false,
                    'message' => 'No Meilisearch configuration found. Please save configuration first.',
                    'details' => [],
                    'latencyMs' => null,
                    'checkedAt' => now()->toIso8601String(),
                ],
            ]);
        }

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
