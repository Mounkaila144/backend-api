<?php

namespace Modules\AppDomoprimeYousignEvidence\Services;

use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceSettings;
use Modules\AppDomoprimeYousignEvidence\Exceptions\YousignEvidenceNotConfiguredException;

/**
 * Adapter for Yousign API V3.
 *
 * Phase C deliverable. Endpoints reference:
 *   - https://developers.yousign.com/reference (Signature Requests)
 *   - Symfony reference: services_yousign_evidence3/common/lib/YouSign3Api/YouSign3Api.php
 *
 * All methods throw YousignEvidenceNotConfiguredException if no API key is
 * set yet. This keeps the codebase importable in Phase A/B where credentials
 * may be absent.
 */
class YousignEvidenceApiClient
{
    private HttpFactory $http;

    private YousignEvidenceSettings $settings;

    public function __construct(HttpFactory $http, ?YousignEvidenceSettings $settings = null)
    {
        $this->http = $http;
        $this->settings = $settings ?? YousignEvidenceSettings::resolve();
    }

    /**
     * Create a draft signature request.
     * POST /signature_requests
     *
     * @param array $payload Yousign V3 envelope: name, delivery_mode, signers, documents...
     * @return array Decoded response body.
     */
    public function createSignatureRequest(array $payload): array
    {
        return $this->json($this->client()->post('/signature_requests', $payload));
    }

    /**
     * Move a draft to "ongoing" so signers can sign.
     * POST /signature_requests/{id}/activate
     */
    public function activateSignatureRequest(string $id): array
    {
        return $this->json($this->client()->post("/signature_requests/{$id}/activate"));
    }

    /**
     * Fetch the current state of a signature request.
     * GET /signature_requests/{id}
     */
    public function getSignatureRequest(string $id): array
    {
        return $this->json($this->client()->get("/signature_requests/{$id}"));
    }

    /**
     * Download the signed (or current) version of a document.
     * GET /signature_requests/{id}/documents/download?version=current
     *
     * @return string Raw PDF bytes.
     */
    public function downloadSignedDocument(string $id, string $version = 'current'): string
    {
        $response = $this->client()
            ->withOptions(['stream' => false])
            ->get("/signature_requests/{$id}/documents/download", ['version' => $version]);

        if (! $response->successful()) {
            throw new \RuntimeException('Yousign download failed: ' . $response->status());
        }

        return (string) $response->body();
    }

    public function deleteSignatureRequest(string $id): void
    {
        $response = $this->client()->delete("/signature_requests/{$id}");

        if (! $response->successful() && $response->status() !== 404) {
            throw new \RuntimeException('Yousign delete failed: ' . $response->status());
        }
    }

    private function client(): PendingRequest
    {
        if (! $this->settings->isConfigured()) {
            throw new YousignEvidenceNotConfiguredException(
                'Yousign Evidence API key is not configured. Set YOUSIGN_EVIDENCE_API_KEY.'
            );
        }

        return $this->http
            ->baseUrl($this->settings->getBaseUrl())
            ->withToken($this->settings->getApiKey())
            ->acceptJson()
            ->timeout((int) (config('appdomoprimeyousignevidence.api.timeout') ?? 30));
    }

    private function json(Response $response): array
    {
        if (! $response->successful()) {
            throw new \RuntimeException(
                'Yousign API error ' . $response->status() . ': ' . $response->body()
            );
        }

        return $response->json() ?? [];
    }
}
