# Story 5.9: Health Checker Amazon SES

**Status:** review

---

## Story

As a **SuperAdmin**,
I want **tester la connexion Amazon SES**,
so that **je sais si l'envoi d'emails fonctionne**.

---

## Acceptance Criteria

1. **Given** une config SES valide
   **When** j'appelle `check()`
   **Then** je reçois un résultat positif

2. **Given** une config SES invalide
   **When** j'appelle `check()`
   **Then** je reçois un résultat négatif

---

## Tasks / Subtasks

- [x] **Task 1: Créer SesHealthChecker** (AC: #1, #2)
  - [x] Tester les credentials avec AWS SDK
  - [x] Vérifier le quota d'envoi

---

## Dev Notes

### SesHealthChecker

```php
<?php

namespace Modules\Superadmin\Services\Checkers;

use Aws\Ses\SesClient;
use Aws\Exception\AwsException;

class SesHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'ses';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $config = $config ?? $this->getConfig();

            if (!$config) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No SES configuration found',
                    details: []
                );
            }

            $client = new SesClient([
                'version' => 'latest',
                'region' => $config['region'],
                'credentials' => [
                    'key' => $config['access_key'],
                    'secret' => $config['secret_key'],
                ],
            ]);

            // Get send quota pour vérifier les credentials
            $quota = $client->getSendQuota();

            $latency = (microtime(true) - $startTime) * 1000;

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'SES connection successful',
                details: [
                    'region' => $config['region'],
                    'max_24_hour_send' => $quota['Max24HourSend'] ?? 0,
                    'max_send_rate' => $quota['MaxSendRate'] ?? 0,
                    'sent_last_24_hours' => $quota['SentLast24Hours'] ?? 0,
                ],
                latencyMs: $latency
            );

        } catch (AwsException $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'SES connection failed: ' . $e->getAwsErrorMessage(),
                details: [
                    'error_code' => $e->getAwsErrorCode(),
                ],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        } catch (\Exception $e) {
            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'SES error: ' . $e->getMessage(),
                details: [],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    protected function getConfig(): ?array
    {
        return app(ServiceConfigManager::class)->get('ses');
    }
}
```

### References

- [Source: _bmad-output/planning-artifacts/prd.md#Functional-Requirements - FR63, FR64]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.9]

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (2026-01-28)

### Debug Log References
N/A

### Completion Notes List
- Créé SesHealthChecker pour tester la connexion Amazon SES
- Utilise AWS SDK pour vérifier les credentials
- Récupère le quota d'envoi (max 24h, rate, sent 24h)
- Mesure la latence de connexion

### File List
- Modules/Superadmin/Services/Checkers/SesHealthChecker.php (new)

