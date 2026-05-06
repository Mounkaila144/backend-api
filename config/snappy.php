<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Snappy PDF / Image Configuration
    |--------------------------------------------------------------------------
    |
    | Mirrors the wkhtmltopdf options used by the legacy Symfony PDF generator
    | (modules/app_domoprime/common/lib/DomoprimeQuotationPdf/DomoprimeQuotationPDF2Base::create):
    |
    |   --encoding 'UTF-8'
    |   --enable-javascript
    |   --margin-bottom 0.0 --margin-left 0.0 --margin-right 0.0 --margin-top 0.0
    |
    | Set WKHTMLTOPDF_BINARY in .env to point to the wkhtmltopdf binary.
    | This is required — when the binary is missing, PDF generation throws
    | (no DomPDF fallback). Install wkhtmltopdf 0.12.6 with patched Qt for
    | Symfony parity (https://wkhtmltopdf.org/downloads.html).
    */

    'pdf' => [
        'enabled' => true,
        'binary' => env('WKHTMLTOPDF_BINARY', env('WKHTML_PDF_BINARY', '/usr/local/bin/wkhtmltopdf')),
        'timeout' => 60,
        'options' => [
            'encoding' => 'UTF-8',
            'enable-javascript' => true,
            'no-stop-slow-scripts' => true,
            'javascript-delay' => 1000,
            'page-size' => 'A4',
            'orientation' => 'Portrait',
            'margin-top' => 0,
            'margin-right' => 0,
            'margin-bottom' => 0,
            'margin-left' => 0,
            'enable-local-file-access' => true,
        ],
        'env' => [],
    ],

    'image' => [
        'enabled' => false,
        'binary' => env('WKHTMLTOIMAGE_BINARY', env('WKHTML_IMG_BINARY', '/usr/local/bin/wkhtmltoimage')),
        'timeout' => false,
        'options' => [],
        'env' => [],
    ],

];
