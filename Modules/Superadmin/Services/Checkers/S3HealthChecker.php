<?php

namespace Modules\Superadmin\Services\Checkers;

use Aws\Exception\AwsException;
use Aws\S3\S3Client;
use Modules\Superadmin\Services\ServiceConfigManager;

class S3HealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 's3';

    public function check(?array $config = null): HealthCheckResult
    {
        try {
            $config = $config ?? $this->getConfig();

            if (!$config) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No configuration found',
                    details: []
                );
            }

            $client = $this->createClient($config);
            $bucket = $config['bucket'];

            // Test avec put/get/delete (compatible R2 et S3)
            // Note: headBucket retourne 403 sur Cloudflare R2
            $testKey = '.health-check-' . uniqid();

            // Test 1: Write test file
            $client->putObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
                'Body' => 'health-check',
            ]);

            // Test 2: Read test file
            $client->getObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
            ]);

            // Test 3: Delete test file
            $client->deleteObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
            ]);

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'S3 connection successful',
                details: [
                    'bucket' => $bucket,
                    'region' => $config['region'] ?? 'us-east-1',
                    'endpoint' => $config['endpoint'] ?? 'AWS S3',
                    'permissions' => ['read', 'write', 'delete'],
                ]
            );

        } catch (AwsException $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'S3 connection failed: ' . $e->getAwsErrorMessage(),
                details: [
                    'error_code' => $e->getAwsErrorCode(),
                ]
            );
        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'S3 connection failed: ' . $e->getMessage(),
                details: []
            );
        }
    }

    public function fullTest(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $config = $config ?? $this->getConfig();

            if (!$config) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No configuration found',
                    details: []
                );
            }

            $client = $this->createClient($config);
            $bucket = $config['bucket'];
            $testKey = 'health-check/'.uniqid('test_', true).'.txt';
            $testContent = 'Health check test at '.now()->toIso8601String();

            // Write test
            $client->putObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
                'Body' => $testContent,
            ]);

            // Read test
            $result = $client->getObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
            ]);

            $readContent = (string) $result['Body'];

            if ($readContent !== $testContent) {
                throw new \Exception('Content mismatch after read');
            }

            // Delete test
            $client->deleteObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
            ]);

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Full S3 test passed (write/read/delete)',
                details: [
                    'bucket' => $bucket,
                    'operations' => ['put', 'get', 'delete'],
                ],
                latencyMs: $latency
            );

        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'S3 full test failed: '.$e->getMessage(),
                details: [],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    protected function createClient(array $config): S3Client
    {
        // Convertir use_path_style en booléen (peut être string "1", "true", ou bool)
        $usePathStyle = filter_var($config['use_path_style'] ?? false, FILTER_VALIDATE_BOOLEAN);

        return new S3Client([
            'version' => 'latest',
            'region' => $config['region'] ?? 'us-east-1',
            'credentials' => [
                'key' => $config['access_key'],
                'secret' => $config['secret_key'],
            ],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $usePathStyle,
        ]);
    }

    protected function getConfig(): ?array
    {
        $serviceConfig = app(ServiceConfigManager::class);

        return $serviceConfig->get('s3');
    }
}
