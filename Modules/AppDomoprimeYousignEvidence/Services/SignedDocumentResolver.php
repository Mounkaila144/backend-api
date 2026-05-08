<?php

namespace Modules\AppDomoprimeYousignEvidence\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Modules\AppDomoprimeYousignEvidence\Entities\YousignEvidenceFile;

/**
 * Resolves a signed-document file across the storage tiers used by the
 * legacy Symfony app and the new Laravel one. Mirrors the resolution order
 * used by Modules\AppDomoprimeISO3 export endpoints.
 *
 * Lookup order:
 *   1. Cloud disk (S3 / MinIO) via TenantStorageManager
 *   2. Local Laravel private storage
 *   3. Legacy Symfony filesystem path (fallback)
 *
 * Returns 404 JSON if no copy is found anywhere or the file row is missing.
 */
class SignedDocumentResolver
{
    public function respondWithSignedFile(?YousignEvidenceFile $file, string $displayName)
    {
        if (! $file) {
            return response()->json([
                'success' => false,
                'message' => 'No signature record found.',
            ], 404);
        }

        if (! $file->isSigned()) {
            return response()->json([
                'success' => false,
                'message' => 'Document not yet signed.',
                'state' => $file->state,
                'status' => $file->status,
            ], 409);
        }

        $relativePath = $this->relativePathForFile($file);
        $headers = [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $displayName . '"',
            'Cache-Control' => 'no-cache, must-revalidate',
        ];

        // 1) Cloud disk
        try {
            $tenant = \App\Models\Tenant::first();

            if ($tenant) {
                $storageManager = app(\Modules\Superadmin\Services\TenantStorageManager::class);
                $fullPath = $storageManager->getTenantPath($tenant->site_id) . '/' . $relativePath;
                $disk = $storageManager->getCurrentDisk();

                if (Storage::disk($disk)->exists($fullPath)) {
                    return response()->streamDownload(
                        fn () => print Storage::disk($disk)->get($fullPath),
                        $displayName,
                        $headers
                    );
                }
            }
        } catch (\Throwable $e) {
            // fall through
        }

        // 2/3) Filesystem fallbacks
        $siteName = DB::connection('tenant')->getDatabaseName();
        $candidates = [
            storage_path("app/private/sites/{$siteName}/{$relativePath}"),
            base_path("sites/{$siteName}/{$relativePath}"),
            rtrim((string) config('migration.legacy_path'), '/\\') . "/sites/{$siteName}/{$relativePath}",
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return response()->file($path, $headers);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'Signed file not yet available on this server.',
            'sign_id' => $file->id,
        ], 404);
    }

    /**
     * Mirrors the Symfony storage convention:
     *   frontend/data/yousign_evidence/{procedure_id}/{filename}
     *
     * The procedure id (Yousign signature_request UUID) is the canonical
     * grouping; multiple files (signers) share it.
     */
    private function relativePathForFile(YousignEvidenceFile $file): string
    {
        $procedure = $file->id_procedure ?: 'unknown';
        $filename = $file->filename ?: ($file->id_file . '.pdf');

        return "frontend/data/yousign_evidence/{$procedure}/{$filename}";
    }
}
