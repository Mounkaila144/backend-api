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

            // Créer un client S3 temporaire
            $client = new S3Client([
                'version' => 'latest',
                'region' => $config['region'] ?? 'us-east-1',
                'credentials' => [
                    'key' => $config['access_key'],
                    'secret' => $config['secret_key'],
                ],
                'endpoint' => $config['endpoint'] ?? null,
                'use_path_style_endpoint' => $config['use_path_style'] ?? false,
            ]);

            $bucket = $config['bucket'];

            // Test 1: List bucket (vérifie credentials + accès)
            $client->headBucket(['Bucket' => $bucket]);

            // Test 2: Write test file
            $testKey = '.health-check-'.time();
            $client->putObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
                'Body' => 'health-check',
            ]);

            // Test 3: Read test file
            $client->getObject([
                'Bucket' => $bucket,
                'Key' => $testKey,
            ]);

            // Test 4: Delete test file
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
                    'permissions' => ['list', 'read', 'write', 'delete'],
                ]
            );

        } catch (AwsException $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'S3 connection failed: '.$e->getAwsErrorMessage(),
                details: [
                    'error_code' => $e->getAwsErrorCode(),
                ]
            );
        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'S3 connection failed: '.$e->getMessage(),
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
        return new S3Client([
            'version' => 'latest',
            'region' => $config['region'] ?? 'us-east-1',
            'credentials' => [
                'key' => $config['access_key'],
                'secret' => $config['secret_key'],
            ],
            'endpoint' => $config['endpoint'] ?? null,
            'use_path_style_endpoint' => $config['use_path_style'] ?? false,
        ]);
    }

    protected function getConfig(): ?array
    {
        $serviceConfig = app(ServiceConfigManager::class);

        return $serviceConfig->get('s3');
    }
}
