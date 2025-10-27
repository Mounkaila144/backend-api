<?php

$content = file_get_contents('Modules/Product/module.json');

echo "Length: " . strlen($content) . PHP_EOL;
echo "First 20 bytes (hex): " . bin2hex(substr($content, 0, 20)) . PHP_EOL;
echo "Last 20 bytes (hex): " . bin2hex(substr($content, -20)) . PHP_EOL;
echo PHP_EOL;

$decoded = json_decode($content, true);

if ($decoded === null) {
    echo "JSON Error: " . json_last_error_msg() . PHP_EOL;
    echo "Error code: " . json_last_error() . PHP_EOL;
} else {
    echo "JSON OK!" . PHP_EOL;
    print_r($decoded);
}
