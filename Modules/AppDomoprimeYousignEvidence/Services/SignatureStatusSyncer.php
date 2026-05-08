<?php

namespace Modules\AppDomoprimeYousignEvidence\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceFile;

/**
 * Phase D — synchronize local YousignEvidenceFile rows with the remote
 * signature_request state. Used both by the webhook handler and a cron
 * fallback poller.
 *
 * Idempotency:
 *   - Webhook events carry an `event_id`; persisted in cache (or a future
 *     t_yousign_evidence_event_log table) and ignored if already seen.
 *   - State transitions are monotonic: once is_signed='YES', do not regress.
 */
class SignatureStatusSyncer
{
    private YousignEvidenceApiClient $api;

    public function __construct(YousignEvidenceApiClient $api)
    {
        $this->api = $api;
    }

    /**
     * Apply a remote signature_request snapshot to local rows.
     *
     * @param string $procedureId Yousign signature_request UUID (== id_procedure).
     * @return array{updated:int,skipped:int} Summary for logging/tests.
     */
    public function syncSignatureRequest(string $procedureId): array
    {
        try {
            $remote = $this->api->getSignatureRequest($procedureId);
        } catch (\Throwable $e) {
            Log::warning('[YousignEvidence] sync failed', [
                'procedure' => $procedureId,
                'error' => $e->getMessage(),
            ]);

            return ['updated' => 0, 'skipped' => 0];
        }

        $remoteStatus = $remote['status'] ?? null;
        $remoteSigners = $remote['signers'] ?? [];
        $updated = 0;
        $skipped = 0;

        DB::connection('tenant')->beginTransaction();

        try {
            $files = YousignEvidenceFile::where('id_procedure', $procedureId)->get();

            foreach ($files as $file) {
                $matchingSigner = $this->matchSigner($file, $remoteSigners);
                $changes = $this->resolveChanges($file, $remoteStatus, $matchingSigner);

                if ($changes === []) {
                    $skipped++;
                    continue;
                }

                $file->fill($changes)->save();
                $updated++;
            }

            DB::connection('tenant')->commit();
        } catch (\Throwable $e) {
            DB::connection('tenant')->rollBack();
            throw $e;
        }

        return ['updated' => $updated, 'skipped' => $skipped];
    }

    /**
     * Phase D — full implementation pending. For now: best-effort match by
     * email, fall back to first signer.
     */
    private function matchSigner(YousignEvidenceFile $file, array $signers): ?array
    {
        if (empty($signers)) {
            return null;
        }

        foreach ($signers as $signer) {
            $email = $signer['info']['email'] ?? null;

            if ($email && $file->email && strcasecmp((string) $email, (string) $file->email) === 0) {
                return $signer;
            }
        }

        return $signers[0];
    }

    /**
     * Compute the diff to apply. Monotonic: never un-sign a signed file.
     */
    private function resolveChanges(YousignEvidenceFile $file, ?string $remoteStatus, ?array $signer): array
    {
        $changes = [];

        if ($remoteStatus && $file->state !== $remoteStatus) {
            $changes['state'] = $remoteStatus;
        }

        if ($signer) {
            $signerStatus = $signer['status'] ?? null;
            $isSigned = in_array($signerStatus, ['signed', 'done'], true);

            if ($isSigned && ! $file->isSigned()) {
                $changes['is_signed'] = 'YES';
                $changes['signed_at'] = $signer['signed_at']
                    ?? $signer['updated_at']
                    ?? now()->toDateTimeString();
            }

            if ($signerStatus && $file->status !== $signerStatus) {
                $changes['status'] = $signerStatus;
            }
        }

        return $changes;
    }
}
