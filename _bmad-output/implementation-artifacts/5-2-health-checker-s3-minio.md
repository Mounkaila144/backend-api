# Story 5.2: Health Checker S3/Minio

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **tester la connexion S3/Minio**,
so that **je sais si le storage est accessible**.

---

## Acceptance Criteria

1. **Given** une config S3 valide
   **When** j'appelle `check()`
   **Then** je reçois un résultat positif avec les détails

2. **Given** une config S3 invalide
   **When** j'appelle `check()`
   **Then** je reçois un résultat négatif avec l'erreur

3. **Given** le health check
   **When** je teste la connexion
   **Then** il vérifie: credentials, bucket accessibility, permissions

---

## Tasks / Subtasks

- [x] **Task 1: Créer S3HealthChecker** (AC: #1, #2, #3)
  - [x] Créer `Modules/Superadmin/Services/Checkers/S3HealthChecker.php`
  - [x] Tester les credentials
  - [x] Tester l'accès au bucket
  - [x] Tester les permissions (list, put, get)

- [x] **Task 2: Créer l'interface commune** (AC: #1, #2)
  - [x] `HealthCheckerInterface`
  - [x] Retourner `HealthCheckResult`

---

## Dev Notes

### S3HealthChecker

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Storage;
use Aws\S3\S3Client;
use Aws\Exception\AwsException;

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
            $testKey = '.health-check-' . time();
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

    protected function getConfig(): ?array
    {
        $serviceConfig = app(ServiceConfigManager::class);
        return $serviceConfig->get('s3');
    }
}
```

### HealthCheckerInterface

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

interface HealthCheckerInterface
{
    public function check(?array $config = null): HealthCheckResult;
}
```

### HealthCheckResult

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

class HealthCheckResult
{
    public function __construct(
        public string $service,
        public bool $healthy,
        public string $message,
        public array $details = [],
        public ?float $latencyMs = null
    ) {}

    public function toArray(): array
    {
        return [
            'service' => $this->service,
            'healthy' => $this->healthy,
            'status' => $this->healthy ? 'connected' : 'disconnected',
            'message' => $this->message,
            'details' => $this->details,
            'latency_ms' => $this->latencyMs,
            'checked_at' => now()->toIso8601String(),
        ];
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR43, FR44]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé l'interface HealthCheckerInterface pour standardiser les health checks
- Créé HealthCheckResult pour encapsuler les résultats des health checks
- Implémenté S3HealthChecker avec vérification complète: credentials, accès bucket, permissions (read/write/delete)
- Supporte AWS S3 et Minio via endpoint configurable

### File List
- Modules/Superadmin/Services/Checkers/HealthCheckerInterface.php (new)
- Modules/Superadmin/Services/Checkers/HealthCheckResult.php (new)
- Modules/Superadmin/Services/Checkers/S3HealthChecker.php (new)

