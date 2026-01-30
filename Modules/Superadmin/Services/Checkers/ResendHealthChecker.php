<?php

namespace Modules\Superadmin\Services\Checkers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Services\ServiceConfigManager;
use Resend;

class ResendHealthChecker implements HealthCheckerInterface
{
    protected string $serviceName = 'resend';

    public function check(?array $config = null): HealthCheckResult
    {
        $startTime = microtime(true);

        try {
            $config = $config ?? $this->getConfig();

            if (!$config || empty($config['api_key'])) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'No Resend configuration found',
                    details: ['error' => 'API key is missing']
                );
            }

            $apiKey = $config['api_key'];

            // Validation du format de l'API key Resend (commence par "re_")
            if (!str_starts_with($apiKey, 're_')) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'Invalid Resend API key format',
                    details: ['error' => 'API key must start with "re_"']
                );
            }

            // VALIDATION RÉELLE avec le client HTTP de Laravel
            // Utilise l'endpoint /domains qui nécessite une authentification valide
            $response = Http::withToken($apiKey)
                ->timeout(15)
                ->withOptions([
                    'verify' => true, // Vérification SSL activée
                ])
                ->get('https://api.resend.com/domains');

            $httpCode = $response->status();
            $responseBody = $response->json();

            // Log pour debug
            Log::channel('superadmin')->debug('Resend API health check', [
                'http_code' => $httpCode,
                'response_body' => $responseBody,
                'api_key_prefix' => substr($apiKey, 0, 10) . '***',
            ]);

            // Vérifier les codes d'erreur d'authentification
            if ($httpCode === 401) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'Invalid Resend API key - Authentication failed',
                    details: [
                        'error' => 'API key is invalid or expired',
                        'http_code' => $httpCode,
                        'api_error' => $responseBody['message'] ?? 'Unauthorized',
                    ]
                );
            }

            if ($httpCode === 403) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'Resend API access forbidden',
                    details: [
                        'error' => 'API key does not have required permissions',
                        'http_code' => $httpCode,
                        'api_error' => $responseBody['message'] ?? 'Forbidden',
                    ]
                );
            }

            // Vérifier si la réponse est un succès (2xx)
            if (!$response->successful()) {
                return new HealthCheckResult(
                    service: $this->serviceName,
                    healthy: false,
                    message: 'Resend API returned error',
                    details: [
                        'error' => $responseBody['message'] ?? 'Unknown error',
                        'http_code' => $httpCode,
                    ]
                );
            }

            // Si on arrive ici, l'API key est valide
            $latency = (microtime(true) - $startTime) * 1000;

            $domainsCount = isset($responseBody['data']) ? count($responseBody['data']) : 0;

            $details = [
                'from_address' => $config['from_address'] ?? null,
                'from_name' => $config['from_name'] ?? null,
                'api_key_valid' => true,
                'domains_count' => $domainsCount,
            ];

            // Si un email de test est fourni, essayer d'envoyer un email
            if (!empty($config['test_email'])) {
                try {
                    // Validation de l'adresse email
                    if (!filter_var($config['from_address'] ?? '', FILTER_VALIDATE_EMAIL)) {
                        throw new \Exception('Invalid from_address email format');
                    }

                    $resend = Resend::client($apiKey);

                    $testResult = $resend->emails->send([
                        'from' => ($config['from_name'] ?? 'Test') . ' <' . ($config['from_address'] ?? 'onboarding@resend.dev') . '>',
                        'to' => [$config['test_email']],
                        'subject' => 'Test de configuration Resend',
                        'html' => '<p>Ceci est un email de test envoyé depuis votre configuration Resend.</p><p>Si vous recevez cet email, votre configuration fonctionne correctement !</p>',
                        'reply_to' => !empty($config['reply_to']) ? $config['reply_to'] : null,
                    ]);

                    $details['test_email_sent'] = true;
                    $details['test_email_id'] = $testResult->id ?? null;
                    $details['test_email_to'] = $config['test_email'];
                } catch (\Exception $e) {
                    // Si l'envoi d'email échoue, le health check échoue aussi
                    throw new \Exception('Failed to send test email: ' . $e->getMessage());
                }
            }

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: true,
                message: 'Resend connection successful',
                details: $details,
                latencyMs: $latency
            );

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            // Erreur de connexion (timeout, DNS, SSL, etc.)
            Log::channel('superadmin')->error('Resend API connection error', [
                'error' => $e->getMessage(),
            ]);

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Failed to connect to Resend API',
                details: [
                    'error' => 'Connection failed: ' . $e->getMessage(),
                ],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        } catch (\Exception $e) {
            Log::channel('superadmin')->error('Resend health check error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return new HealthCheckResult(
                service: $this->serviceName,
                healthy: false,
                message: 'Resend connection failed: ' . $e->getMessage(),
                details: [
                    'error' => $e->getMessage(),
                ],
                latencyMs: (microtime(true) - $startTime) * 1000
            );
        }
    }

    protected function getConfig(): ?array
    {
        return app(ServiceConfigManager::class)->get('resend');
    }
}
