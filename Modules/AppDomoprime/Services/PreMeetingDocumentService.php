<?php

namespace Modules\AppDomoprime\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Modules\AppDomoprime\Entities\DomoprimePreMeetingModel;
use Modules\AppDomoprime\Entities\DomoprimePreMeetingModelI18n;
use Modules\AppDomoprime\Entities\PartnerPolluterPreMeeting;
use Modules\CustomersContracts\Entities\CustomerContract;
use RuntimeException;

class PreMeetingDocumentService
{
    protected PdftkService $pdftkService;
    protected LogoOverlayService $logoOverlayService;
    protected DocumentParameterLoader $parameterLoader;

    public function __construct(
        PdftkService $pdftkService,
        LogoOverlayService $logoOverlayService,
        DocumentParameterLoader $parameterLoader
    ) {
        $this->pdftkService = $pdftkService;
        $this->logoOverlayService = $logoOverlayService;
        $this->parameterLoader = $parameterLoader;
    }

    /**
     * Generate a pre-meeting PDF document for the given contract.
     *
     * Reproduces the exact flow of the old Symfony system:
     * 1. Load contract, polluter, pre-meeting model
     * 2. Get template PDF and variable names
     * 3. Load all data and flatten for form fields
     * 4. PDFtk fill_form with XFDF
     * 5. If logos configured: burst, stamp, merge
     * 6. Return path to final PDF
     *
     * @return string|null Path to generated PDF, or null if not applicable
     */
    public function generate(CustomerContract $contract): ?string
    {
        // 1. Load polluter and pre-meeting model
        $polluterPreMeeting = PartnerPolluterPreMeeting::where('polluter_id', $contract->polluter_id)->first();
        if (!$polluterPreMeeting) {
            Log::debug('[PreMeetingDocument] No pre-meeting config for polluter_id=' . $contract->polluter_id);
            return null;
        }

        $model = $polluterPreMeeting->preMeetingModel;
        if (!$model) {
            Log::debug('[PreMeetingDocument] No pre-meeting model found for model_id=' . $polluterPreMeeting->model_id);
            return null;
        }

        // 2. Get i18n with template file
        $i18n = $model->translations()->first();
        if (!$i18n || empty($i18n->file)) {
            Log::debug('[PreMeetingDocument] No i18n or template file for model ' . $model->id);
            return null;
        }

        // 3. Resolve template PDF path
        $templatePath = $this->resolveTemplatePath($i18n);
        if (!$templatePath || !file_exists($templatePath)) {
            Log::warning('[PreMeetingDocument] Template PDF not found: ' . ($templatePath ?? 'null'));
            return null;
        }

        // 4. Load all data
        $data = $this->parameterLoader->loadForPdf($contract);

        // 5. Flatten data according to template variable names
        $variableNames = $i18n->variables ?? '';
        $formData = $this->parameterLoader->flatten($data, $variableNames);

        // 6. Create working directory
        $workDir = storage_path('app/temp/domoprime/premeeting/' . Str::uuid());
        if (!is_dir($workDir)) {
            mkdir($workDir, 0755, true);
        }

        try {
            // 7. Fill form fields
            $filledPdf = $workDir . DIRECTORY_SEPARATOR . 'filled.pdf';
            $this->pdftkService->fillForm($templatePath, $formData, $filledPdf);

            if (!file_exists($filledPdf)) {
                throw new RuntimeException('PDFtk fill_form produced no output');
            }

            // 8. Apply logos if configured
            $options = $this->logoOverlayService->parseOptions($model->options ?? '');
            if ($this->logoOverlayService->hasLogos($options)) {
                $outputPdf = $this->applyLogos($filledPdf, $options, $contract, $workDir);
            } else {
                $outputPdf = $filledPdf;
            }

            // 9. Copy final PDF to a predictable output location
            $finalPath = $workDir . DIRECTORY_SEPARATOR . 'output.pdf';
            if ($outputPdf !== $finalPath) {
                copy($outputPdf, $finalPath);
            }

            return $finalPath;
        } catch (\Exception $e) {
            Log::error('[PreMeetingDocument] Generation failed: ' . $e->getMessage(), [
                'contract_id' => $contract->id,
                'trace' => $e->getTraceAsString(),
            ]);

            // Clean up on error
            $this->cleanupDirectory($workDir);

            return null;
        }
    }

    /**
     * Apply logo overlays to the filled PDF.
     * Reproduces DomoprimePreMeetingDocumentGeneratorPdf::process()
     *
     * Flow:
     * 1. Burst filled PDF into pages
     * 2. For each logo type, generate overlay PDFs
     * 3. Stamp each page with its overlays
     * 4. Merge all pages
     */
    protected function applyLogos(
        string $filledPdf,
        array $options,
        CustomerContract $contract,
        string $workDir
    ): string {
        $pagesDir = $workDir . DIRECTORY_SEPARATOR . 'pages';

        // Step 1: Burst into pages
        $pageCount = $this->pdftkService->burst($filledPdf, $pagesDir);
        if ($pageCount === 0) {
            Log::warning('[PreMeetingDocument] Burst produced 0 pages');
            return $filledPdf;
        }

        // Step 2: Collect all overlays per page
        $overlaysByPage = $this->collectOverlays($options, $contract, $workDir);

        // Step 3: Stamp each page with its overlays
        $stampedDir = $workDir . DIRECTORY_SEPARATOR . 'stamped';
        if (!is_dir($stampedDir)) {
            mkdir($stampedDir, 0755, true);
        }

        for ($page = 1; $page <= $pageCount; $page++) {
            $pagePdf = $pagesDir . DIRECTORY_SEPARATOR . $page . '.pdf';

            if (isset($overlaysByPage[$page])) {
                $currentPdf = $pagePdf;

                foreach ($overlaysByPage[$page] as $idx => $overlayPath) {
                    $stampedPath = $stampedDir . DIRECTORY_SEPARATOR . $page . '_stamp_' . $idx . '.pdf';
                    $this->pdftkService->stamp($currentPdf, $overlayPath, $stampedPath);

                    if (file_exists($stampedPath)) {
                        $currentPdf = $stampedPath;
                    }
                }

                // Copy final stamped version back as the page
                $finalPagePath = $stampedDir . DIRECTORY_SEPARATOR . $page . '.pdf';
                if ($currentPdf !== $finalPagePath) {
                    copy($currentPdf, $finalPagePath);
                }
            } else {
                // No overlay for this page, copy as-is
                copy($pagePdf, $stampedDir . DIRECTORY_SEPARATOR . $page . '.pdf');
            }
        }

        // Step 4: Merge all pages
        $outputPath = $workDir . DIRECTORY_SEPARATOR . 'output.pdf';
        $pagesToMerge = [];
        for ($page = 1; $page <= $pageCount; $page++) {
            $pagesToMerge[] = $stampedDir . DIRECTORY_SEPARATOR . $page . '.pdf';
        }

        $this->pdftkService->merge($pagesToMerge, $outputPath);

        return $outputPath;
    }

    /**
     * Collect all overlay PDFs organized by page number.
     */
    protected function collectOverlays(
        array $options,
        CustomerContract $contract,
        string $workDir
    ): array {
        $allOverlays = [];

        // Polluter logo
        if (!empty($options['polluter_logo']) && $contract->polluter) {
            $logoPath = $this->resolveLogoPath($contract->polluter->logo, 'polluter');
            if ($logoPath) {
                $overlays = $this->logoOverlayService->generateOverlays(
                    $logoPath, $options['polluter_logo'], $workDir, 'polluter'
                );
                $allOverlays = $this->mergeOverlaysByPage($allOverlays, $overlays);
            }
        }

        // Company logo
        if (!empty($options['company_logo']) && $contract->company) {
            $logoPath = $this->resolveLogoPath($contract->company->logo ?? null, 'company');
            if ($logoPath) {
                $overlays = $this->logoOverlayService->generateOverlays(
                    $logoPath, $options['company_logo'], $workDir, 'company'
                );
                $allOverlays = $this->mergeOverlaysByPage($allOverlays, $overlays);
            }
        }

        // Company header
        if (!empty($options['company_header']) && $contract->company) {
            $logoPath = $this->resolveLogoPath($contract->company->logo ?? null, 'company');
            if ($logoPath) {
                $overlays = $this->logoOverlayService->generateOverlays(
                    $logoPath, $options['company_header'], $workDir, 'company_header'
                );
                $allOverlays = $this->mergeOverlaysByPage($allOverlays, $overlays);
            }
        }

        // Company footer
        if (!empty($options['company_footer']) && $contract->company) {
            $logoPath = $this->resolveLogoPath($contract->company->logo ?? null, 'company');
            if ($logoPath) {
                $overlays = $this->logoOverlayService->generateOverlays(
                    $logoPath, $options['company_footer'], $workDir, 'company_footer'
                );
                $allOverlays = $this->mergeOverlaysByPage($allOverlays, $overlays);
            }
        }

        // Layer logo
        if (!empty($options['layer_logo']) && $contract->partnerLayer) {
            $logoPath = $this->resolveLogoPath($contract->partnerLayer->logo, 'layer');
            if ($logoPath) {
                $overlays = $this->logoOverlayService->generateOverlays(
                    $logoPath, $options['layer_logo'], $workDir, 'layer'
                );
                $allOverlays = $this->mergeOverlaysByPage($allOverlays, $overlays);
            }
        }

        return $allOverlays;
    }

    /**
     * Merge two page-indexed overlay arrays.
     */
    protected function mergeOverlaysByPage(array $existing, array $new): array
    {
        foreach ($new as $page => $overlayPaths) {
            if (!isset($existing[$page])) {
                $existing[$page] = [];
            }
            $existing[$page] = array_merge($existing[$page], (array) $overlayPaths);
        }
        return $existing;
    }

    /**
     * Resolve the template PDF filesystem path from the I18n record.
     *
     * Old system path: {sites_dir}/{siteName}/frontend/data/models/documents/domoprime/{i18n_id}/{file}
     * New system: uses tenant storage or the same shared filesystem.
     */
    protected function resolveTemplatePath(DomoprimePreMeetingModelI18n $i18n): ?string
    {
        $basePath = config('appdomoprime.template_base_path', '');

        if (!empty($basePath)) {
            // Custom configured path
            $path = rtrim($basePath, '/\\') . DIRECTORY_SEPARATOR . $i18n->id . DIRECTORY_SEPARATOR . $i18n->file;
            if (file_exists($path)) {
                return $path;
            }
        }

        // Try the old Symfony filesystem path structure (same server, shared data)
        // {sites_dir}/{siteName}/frontend/data/models/documents/domoprime/{i18n_id}/{file}
        $symlinkPaths = $this->getOldSystemPaths($i18n);
        foreach ($symlinkPaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        // Try storage path
        $storagePath = storage_path('app/domoprime/models/documents/' . $i18n->id . '/' . $i18n->file);
        if (file_exists($storagePath)) {
            return $storagePath;
        }

        return null;
    }

    /**
     * Get possible old system paths for a template file.
     */
    protected function getOldSystemPaths(DomoprimePreMeetingModelI18n $i18n): array
    {
        $paths = [];

        // Try to get the tenant/site name from the current tenant context
        $tenantDb = config('database.connections.tenant.database', '');
        $siteName = $tenantDb; // In the old system, site name = database name

        if (!empty($siteName)) {
            // Standard Symfony data path
            $baseDirs = [
                'C:\\xampp\\htdocs\\project\\sites',
                '/var/www/project/sites',
                config('appdomoprime.sites_dir', ''),
            ];

            foreach ($baseDirs as $baseDir) {
                if (empty($baseDir)) continue;
                $paths[] = $baseDir . DIRECTORY_SEPARATOR . $siteName
                    . DIRECTORY_SEPARATOR . 'frontend' . DIRECTORY_SEPARATOR . 'data'
                    . DIRECTORY_SEPARATOR . 'models' . DIRECTORY_SEPARATOR . 'documents'
                    . DIRECTORY_SEPARATOR . 'domoprime' . DIRECTORY_SEPARATOR . $i18n->id
                    . DIRECTORY_SEPARATOR . $i18n->file;
            }
        }

        return $paths;
    }

    /**
     * Resolve the filesystem path to a logo file.
     *
     * @param string|null $logoFilename The logo filename from the database
     * @param string $type Logo type (polluter, company, layer)
     */
    protected function resolveLogoPath(?string $logoFilename, string $type): ?string
    {
        if (empty($logoFilename)) {
            return null;
        }

        // Try tenant storage
        $tenantDb = config('database.connections.tenant.database', '');
        $siteName = $tenantDb;

        $possiblePaths = [];

        // Old Symfony filesystem paths
        if (!empty($siteName)) {
            $baseDirs = [
                'C:\\xampp\\htdocs\\project\\sites',
                '/var/www/project/sites',
                config('appdomoprime.sites_dir', ''),
            ];

            $subDirs = [
                'polluter' => 'frontend/data/polluters',
                'company' => 'frontend/data/company',
                'layer' => 'frontend/data/layers',
            ];

            $subDir = $subDirs[$type] ?? 'frontend/data/' . $type;

            foreach ($baseDirs as $baseDir) {
                if (empty($baseDir)) continue;
                $possiblePaths[] = $baseDir . DIRECTORY_SEPARATOR . $siteName
                    . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $subDir)
                    . DIRECTORY_SEPARATOR . $logoFilename;
            }
        }

        // Laravel storage paths
        $possiblePaths[] = storage_path('app/domoprime/' . $type . '/' . $logoFilename);
        $possiblePaths[] = storage_path('app/logos/' . $type . '/' . $logoFilename);
        $possiblePaths[] = public_path('uploads/' . $type . '/' . $logoFilename);

        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                return $path;
            }
        }

        Log::debug('[PreMeetingDocument] Logo not found for ' . $type . ': ' . $logoFilename);
        return null;
    }

    /**
     * Clean up a temporary directory and all its contents.
     */
    public function cleanupDirectory(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isDir()) {
                @rmdir($file->getRealPath());
            } else {
                @unlink($file->getRealPath());
            }
        }

        @rmdir($dir);
    }
}
