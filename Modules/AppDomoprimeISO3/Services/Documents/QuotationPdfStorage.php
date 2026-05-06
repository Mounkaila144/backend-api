<?php

namespace Modules\AppDomoprimeISO3\Services\Documents;

use Illuminate\Support\Facades\Storage;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\Superadmin\Services\TenantStorageManager;
use RuntimeException;

/**
 * Stores generated quotation PDFs using the tenant-aware storage manager
 * (S3 if available, local fallback). The path layout matches the legacy
 * Symfony app exactly (DomoprimeQuotation::getFilenameForPdf):
 *
 *   sites/{site_db_name}/frontend/data/domoprime/quotations/{id}/devis_{ref}_{id}.pdf
 *
 * Pattern is "cache-then-serve":
 *   - if the file already exists on the configured disk, return its bytes
 *   - otherwise call $generator() which must write a local PDF and return its
 *     absolute path. We then upload it via TenantStorageManager (which handles
 *     S3 vs local automatically), delete the temp file, and return the bytes.
 */
class QuotationPdfStorage
{
    public function __construct(private readonly TenantStorageManager $storage)
    {
    }

    /**
     * Build the relative path (without the tenant root) for the given quotation.
     */
    public function relativePathFor(DomoprimeQuotation $quotation): string
    {
        return sprintf(
            'frontend/data/domoprime/quotations/%d/%s',
            $quotation->id,
            $this->downloadFilename($quotation)
        );
    }

    public function downloadFilename(DomoprimeQuotation $quotation): string
    {
        $reference = (string) ($quotation->reference ?? '');
        return sprintf('devis_%s_%d.pdf', $reference, $quotation->id);
    }

    /**
     * Return the PDF bytes for a quotation, generating + caching it if needed.
     *
     * @param  callable():string  $generator  must return an absolute filesystem path to the freshly generated PDF
     * @param  bool  $deleteAfterUpload  when true (default), the local file is removed once uploaded
     */
    public function getOrCreate(DomoprimeQuotation $quotation, callable $generator, bool $deleteAfterUpload = true): string
    {
        $tenantId = $this->resolveTenantId();
        $relativePath = $this->relativePathFor($quotation);
        $disk = $this->storage->getCurrentDisk();
        $fullPath = "sites/" . $this->resolveSiteDbName() . "/" . $relativePath;

        if (! Storage::disk($disk)->exists($fullPath)) {
            $localPath = $generator();
            if (! is_string($localPath) || $localPath === '' || ! is_readable($localPath)) {
                throw new RuntimeException('PDF generator did not return a readable file');
            }

            $bytes = file_get_contents($localPath);
            if ($bytes === false) {
                throw new RuntimeException("Cannot read generated PDF at {$localPath}");
            }

            // Reuse the existing tenant-aware upload helper (handles S3/local fallback).
            $folder = dirname($relativePath);
            $filename = basename($relativePath);
            $this->storage->uploadFile($tenantId, $folder, $bytes, $filename);

            if ($deleteAfterUpload) {
                @unlink($localPath);
            }
        }

        $bytes = Storage::disk($disk)->get($fullPath);
        if ($bytes === null) {
            throw new RuntimeException("Failed to read PDF from {$disk} at {$fullPath}");
        }

        return $bytes;
    }

    public function regenerate(DomoprimeQuotation $quotation, callable $generator): string
    {
        $this->delete($quotation);
        return $this->getOrCreate($quotation, $generator);
    }

    public function exists(DomoprimeQuotation $quotation): bool
    {
        $disk = $this->storage->getCurrentDisk();
        $fullPath = "sites/" . $this->resolveSiteDbName() . "/" . $this->relativePathFor($quotation);
        return Storage::disk($disk)->exists($fullPath);
    }

    public function delete(DomoprimeQuotation $quotation): bool
    {
        return $this->storage->deleteFile($this->resolveTenantId(), $this->relativePathFor($quotation));
    }

    /**
     * Get a temporary signed URL when on S3, or a public URL when on local.
     * Useful when serving large PDFs without proxying through Laravel.
     */
    public function temporaryUrl(DomoprimeQuotation $quotation, int $minutes = 60): ?string
    {
        return $this->storage->getTemporaryUrl($this->resolveTenantId(), $this->relativePathFor($quotation), $minutes);
    }

    private function resolveTenantId(): int
    {
        $tenant = function_exists('tenant') ? tenant() : null;
        $id = (int) ($tenant?->site_id ?? 0);
        if ($id <= 0) {
            throw new RuntimeException('No tenant initialized — cannot store PDF.');
        }
        return $id;
    }

    private function resolveSiteDbName(): string
    {
        $tenant = function_exists('tenant') ? tenant() : null;
        $name = (string) ($tenant?->site_db_name ?? '');
        if ($name === '') {
            throw new RuntimeException('No tenant initialized — cannot compute Symfony PDF path.');
        }
        return $name;
    }
}
