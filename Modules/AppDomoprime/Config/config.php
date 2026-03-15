<?php

return [
    'name' => 'AppDomoprime',
    'pdftk_binary' => env('PDFTK_BINARY', 'C:\\Program Files (x86)\\PDFtk Server\\bin\\pdftk.exe'),
    'template_base_path' => env('DOMOPRIME_TEMPLATE_PATH', ''),
    'sites_dir' => env('DOMOPRIME_SITES_DIR', 'C:\\xampp\\htdocs\\project\\sites'),
];
