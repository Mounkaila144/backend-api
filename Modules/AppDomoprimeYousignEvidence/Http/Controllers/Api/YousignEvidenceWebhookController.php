<?php

namespace Modules\AppDomoprimeYousignEvidence\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceSettings;
use Modules\AppDomoprimeYousignEvidence\Services\SignatureStatusSyncer;

/**
 * Phase D scaffold — webhook receiver for Yousign Evidence events.
 *
 * Yousign signs each webhook with the configured webhook secret; we verify
 * the `X-Yousign-Signature-256` header (HMAC-SHA256 over the raw body) before
 * acting. Events are deduplicated by their `event_id` field (cached for 24h)
 * to handle Yousign's at-least-once delivery.
 *
 * Until credentials/secret are configured this controller short-circuits to
 * 503 so traffic from a misconfigured webhook URL fails loudly.
 */
class YousignEvidenceWebhookController extends Controller
{
    private SignatureStatusSyncer $syncer;

    public function __construct(SignatureStatusSyncer $syncer)
    {
        $this->syncer = $syncer;
    }

    public function handle(Request $request): JsonResponse
    {
        $settings = YousignEvidenceSettings::resolve();
        $secret = $settings->getWebhookSecret();

        if (! $secret) {
            return response()->json([
                'success' => false,
                'message' => 'Yousign Evidence webhook secret not configured (Phase D pending).',
            ], 503);
        }

        if (! $this->verifySignature($request, $secret)) {
            return response()->json(['success' => false, 'message' => 'Invalid signature'], 401);
        }

        $payload = $request->json()->all();
        $eventId = $payload['event_id'] ?? $payload['id'] ?? null;

        if ($eventId) {
            $cacheKey = "yousign_evidence:event:{$eventId}";

            if (Cache::has($cacheKey)) {
                return response()->json(['success' => true, 'duplicate' => true]);
            }

            Cache::put($cacheKey, 1, now()->addDay());
        }

        $procedureId = $payload['signature_request']['id']
            ?? $payload['data']['signature_request']['id']
            ?? null;

        if ($procedureId) {
            try {
                $summary = $this->syncer->syncSignatureRequest((string) $procedureId);
                Log::info('[YousignEvidence] webhook synced', [
                    'event_id' => $eventId,
                    'procedure' => $procedureId,
                    'summary' => $summary,
                ]);
            } catch (\Throwable $e) {
                Log::error('[YousignEvidence] webhook sync error', [
                    'event_id' => $eventId,
                    'error' => $e->getMessage(),
                ]);

                return response()->json(['success' => false, 'message' => 'Sync error'], 500);
            }
        }

        return response()->json(['success' => true]);
    }

    private function verifySignature(Request $request, string $secret): bool
    {
        $headerSignature = $request->header('X-Yousign-Signature-256')
            ?? $request->header('X-Hub-Signature-256');

        if (! $headerSignature) {
            return false;
        }

        $expected = 'sha256=' . hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, (string) $headerSignature);
    }
}
