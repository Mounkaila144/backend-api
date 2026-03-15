<?php

namespace Modules\AppDomoprime\Services;

use FPDF;
use Illuminate\Support\Facades\Log;

class LogoOverlayService
{
    /**
     * Parse serialized PHP options string from the model.
     * Returns an array with keys: polluter_logo, company_logo, company_header, company_footer, layer_logo
     * Each value is a string like "100,60,40|1;75,50,50|2"
     */
    public function parseOptions(string $optionsString): array
    {
        if (empty($optionsString)) {
            return [];
        }

        $options = @unserialize($optionsString);

        if ($options === false && $optionsString !== 'b:0;') {
            // Try JSON decode as fallback
            $options = json_decode($optionsString, true);
        }

        if (!is_array($options)) {
            return [];
        }

        return $options;
    }

    /**
     * Check if options have any logo placements defined.
     */
    public function hasLogos(array $options): bool
    {
        return !empty($options['company_logo'])
            || !empty($options['polluter_logo'])
            || !empty($options['layer_logo'])
            || !empty($options['company_header'])
            || !empty($options['company_footer']);
    }

    /**
     * Parse a placement string into structured data.
     * Input: "100,60,40|1;75,50,50|2"
     * Output: [
     *   ['ratio' => 1.0, 'x_cm' => 60, 'y_cm' => 40, 'page' => 1],
     *   ['ratio' => 0.75, 'x_cm' => 50, 'y_cm' => 50, 'page' => 2],
     * ]
     */
    public function parsePlacements(string $placementString): array
    {
        if (empty($placementString)) {
            return [];
        }

        $placements = [];
        $entries = explode(';', $placementString);

        foreach ($entries as $entry) {
            $entry = trim($entry);
            if (empty($entry)) {
                continue;
            }

            $parts = explode('|', $entry);
            if (count($parts) < 2) {
                continue;
            }

            $canvas = explode(',', $parts[0]);
            if (count($canvas) < 3) {
                continue;
            }

            $placements[] = [
                'ratio' => floatval($canvas[0]) / 100,
                'x_cm' => floatval($canvas[1]),
                'y_cm' => floatval($canvas[2]),
                'page' => intval($parts[1]) ?: 1,
                'id' => md5($entry),
            ];
        }

        return $placements;
    }

    /**
     * Create an A4 PDF overlay with a logo positioned at the given coordinates.
     * Replaces ImageMagick + PDFJam workflow.
     *
     * @param string $logoPath Path to the logo image (PNG, JPG, etc.)
     * @param float $ratio Scale factor (1.0 = 100%)
     * @param float $xCm X offset in centimeters from left
     * @param float $yCm Y offset in centimeters from top
     * @param string $outputPath Path for the generated overlay PDF
     */
    public function createOverlayPdf(
        string $logoPath,
        float $ratio,
        float $xCm,
        float $yCm,
        string $outputPath
    ): void {
        if (!file_exists($logoPath)) {
            Log::warning('[LogoOverlayService] Logo file not found: ' . $logoPath);
            return;
        }

        $fpdf = new FPDF('P', 'mm', 'A4');
        $fpdf->SetAutoPageBreak(false);
        $fpdf->AddPage();

        // Convert cm to mm
        $xMm = $xCm * 10;
        $yMm = $yCm * 10;

        // Get image dimensions to calculate scaled width
        $imageInfo = $this->getImageDimensions($logoPath);
        if ($imageInfo === null) {
            Log::warning('[LogoOverlayService] Could not read image dimensions: ' . $logoPath);
            return;
        }

        // Calculate width based on ratio (base width ~50mm for a standard logo)
        $widthMm = $imageInfo['width_mm'] * $ratio;

        // Ensure the image doesn't overflow the page
        $maxWidth = 210 - $xMm; // A4 width = 210mm
        if ($widthMm > $maxWidth && $maxWidth > 0) {
            $widthMm = $maxWidth;
        }

        try {
            $fpdf->Image($logoPath, $xMm, $yMm, $widthMm);
        } catch (\Exception $e) {
            Log::error('[LogoOverlayService] Failed to add image: ' . $e->getMessage());
            return;
        }

        $outputDir = dirname($outputPath);
        if (!is_dir($outputDir)) {
            mkdir($outputDir, 0755, true);
        }

        $fpdf->Output('F', $outputPath);
    }

    /**
     * Get image dimensions in mm (at 72 DPI baseline, then converted).
     */
    protected function getImageDimensions(string $imagePath): ?array
    {
        $info = @getimagesize($imagePath);
        if ($info === false) {
            return null;
        }

        $widthPx = $info[0];
        $heightPx = $info[1];

        // Convert pixels to mm at 96 DPI (standard screen resolution)
        // 1 inch = 25.4mm, 96 pixels = 1 inch
        $widthMm = ($widthPx / 96) * 25.4;
        $heightMm = ($heightPx / 96) * 25.4;

        return [
            'width_px' => $widthPx,
            'height_px' => $heightPx,
            'width_mm' => $widthMm,
            'height_mm' => $heightMm,
        ];
    }

    /**
     * Generate all overlay PDFs for a given logo type and return page-indexed paths.
     *
     * @param string $logoPath Path to the logo image
     * @param string $placementString The placement configuration string
     * @param string $workDir Working directory for temporary files
     * @param string $prefix File prefix (e.g., 'polluter', 'company')
     * @return array Indexed by page number: [pageNum => overlayPdfPath]
     */
    public function generateOverlays(
        string $logoPath,
        string $placementString,
        string $workDir,
        string $prefix
    ): array {
        $placements = $this->parsePlacements($placementString);
        if (empty($placements)) {
            return [];
        }

        $overlayDir = $workDir . DIRECTORY_SEPARATOR . 'overlays' . DIRECTORY_SEPARATOR . $prefix;
        if (!is_dir($overlayDir)) {
            mkdir($overlayDir, 0755, true);
        }

        $overlaysByPage = [];

        foreach ($placements as $placement) {
            $overlayPath = $overlayDir . DIRECTORY_SEPARATOR . $placement['id'] . '.pdf';

            $this->createOverlayPdf(
                $logoPath,
                $placement['ratio'],
                $placement['x_cm'],
                $placement['y_cm'],
                $overlayPath
            );

            if (file_exists($overlayPath)) {
                $page = $placement['page'];
                if (!isset($overlaysByPage[$page])) {
                    $overlaysByPage[$page] = [];
                }
                $overlaysByPage[$page][] = $overlayPath;
            }
        }

        return $overlaysByPage;
    }
}
