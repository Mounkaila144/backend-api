<?php

namespace Modules\AppDomoprimeISO3\Services\Documents;

use Barryvdh\Snappy\PdfWrapper as SnappyPdf;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Services\Pdf\SmartyTemplateRenderer;
use RuntimeException;
use Throwable;

/**
 * Symfony-parity PDF generation pipeline:
 *   model resolve  →  variables build  →  Smarty render  →  wkhtmltopdf.
 *
 * Mirrors Symfony's DomoprimeQuotationPDF2Base which calls wkhtmltopdf
 * exclusively. There is **no fallback** — if the wkhtmltopdf binary is
 * missing or fails, generation throws so the deployment problem surfaces
 * loudly rather than silently producing a different rendering.
 */
class QuotationPdfGenerator
{
    public function __construct(
        private readonly QuotationPdfModelResolver $modelResolver,
        private readonly QuotationDataBuilder $dataBuilder,
        private readonly SmartyTemplateRenderer $smarty,
    ) {
    }

    public function generateToTempFile(DomoprimeQuotation $quotation, string $lang = 'fr'): string
    {
        $this->assertWkhtmltopdfAvailable();

        $model = $this->modelResolver->resolve($quotation, $lang);
        $variables = $this->dataBuilder->build($quotation, $model['lang']);
        $variables['model'] = [
            'id' => $model['model_id'],
            'subject' => $model['subject'],
        ];

        $html = $this->smarty->render($model['body'], $variables);
        if (trim($html) === '') {
            throw new RuntimeException(
                sprintf('Smarty rendered empty HTML for quotation %d.', $quotation->id)
            );
        }

        $tempPath = tempnam(sys_get_temp_dir(), 'iso3_quotation_pdf_').'.pdf';

        try {
            /** @var SnappyPdf $pdf */
            $pdf = app('snappy.pdf.wrapper');
            $pdf->loadHTML($html)->save($tempPath, true);
        } catch (Throwable $e) {
            throw new RuntimeException('wkhtmltopdf rendering failed: '.$e->getMessage(), 0, $e);
        }

        if (! file_exists($tempPath) || filesize($tempPath) === 0) {
            throw new RuntimeException('PDF generation failed: empty or missing file at '.$tempPath);
        }

        return $tempPath;
    }

    private function assertWkhtmltopdfAvailable(): void
    {
        $binary = (string) config('snappy.pdf.binary', '');
        if ($binary === '') {
            throw new RuntimeException(
                'wkhtmltopdf binary is not configured. Set WKHTMLTOPDF_BINARY in .env '
                .'(e.g. "C:/Program Files/wkhtmltopdf/bin/wkhtmltopdf.exe" on Windows, '
                .'/usr/local/bin/wkhtmltopdf on Linux).'
            );
        }
        if (! is_file($binary)) {
            throw new RuntimeException(
                sprintf('wkhtmltopdf binary not found at "%s". Install wkhtmltopdf 0.12.6+ with patched Qt.', $binary)
            );
        }
    }
}
