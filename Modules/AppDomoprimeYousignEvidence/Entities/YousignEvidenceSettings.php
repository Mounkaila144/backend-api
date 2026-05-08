<?php

namespace Modules\AppDomoprimeYousignEvidence\Entities;

/**
 * Per-tenant Yousign Evidence configuration singleton.
 *
 * Symfony stored these in mfSettingsBase (a generic key-value config store).
 * In Laravel we read from env/config first; optionally override with values
 * pulled from t_yousign_evidence_settings if/when that table is created.
 *
 * Phase A only consumes the read-side configuration (no API calls). Phase C
 * adds API-key resolution. Tenancy MUST be initialized before resolving any
 * tenant-specific override.
 */
class YousignEvidenceSettings
{
    public const ENV_DEV = 'dev';

    public const ENV_PROD = 'prod';

    private string $env;

    private string $apiKey;

    private string $baseUrl;

    private ?string $webhookSecret;

    public function __construct(string $env, string $apiKey, string $baseUrl, ?string $webhookSecret)
    {
        $this->env = $env;
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
        $this->webhookSecret = $webhookSecret;
    }

    /**
     * Resolve current tenant settings. Reads from config('appdomoprimeyousignevidence.api')
     * and env. Tenant-specific override hook is left as a TODO for Phase C.
     */
    public static function resolve(): self
    {
        $env = env('YOUSIGN_EVIDENCE_ENV', self::ENV_DEV);
        $apiKey = (string) env('YOUSIGN_EVIDENCE_API_KEY', '');
        $webhookSecret = env('YOUSIGN_EVIDENCE_WEBHOOK_SECRET');

        $config = config('appdomoprimeyousignevidence.api', []);
        $baseUrl = $env === self::ENV_PROD
            ? ($config['base_url'] ?? 'https://api.yousign.app/v3')
            : ($config['sandbox_base_url'] ?? 'https://api-sandbox.yousign.app/v3');

        return new self($env, $apiKey, $baseUrl, $webhookSecret);
    }

    public function isConfigured(): bool
    {
        return $this->apiKey !== '';
    }

    public function getEnv(): string
    {
        return $this->env;
    }

    public function getApiKey(): string
    {
        return $this->apiKey;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function getWebhookSecret(): ?string
    {
        return $this->webhookSecret;
    }
}
