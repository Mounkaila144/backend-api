<?php
/**
 * Remove UTF-8 BOM from all PHP and JSON files in a directory
 */

if ($argc < 2) {
    echo "Usage: php remove-bom.php <directory>\n";
    exit(1);
}

$directory = $argv[1];

if (!is_dir($directory)) {
    echo "Error: Directory not found: $directory\n";
    exit(1);
}

function removeBomFromFiles($dir) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    $filesFixed = 0;

    foreach ($iterator as $file) {
        if ($file->isFile() && preg_match('/\.(php|json)$/', $file->getFilename())) {
            $content = file_get_contents($file->getPathname());

            // Check for UTF-8 BOM
            if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
                // Remove BOM
                $content = substr($content, 3);
                file_put_contents($file->getPathname(), $content);
                $filesFixed++;
                echo "Fixed: " . $file->getPathname() . "\n";
            }
        }
    }

    return $filesFixed;
}

$fixed = removeBomFromFiles($directory);
echo "\nTotal files fixed: $fixed\n";
