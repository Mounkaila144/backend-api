<?php
/**
 * Convertit un dump SQL avec INSERTs single-row en INSERTs multi-row.
 *
 * Pourquoi : les exports phpMyAdmin/Symfony ancienne école produisent
 *   INSERT INTO `t` VALUES (1,'a');
 *   INSERT INTO `t` VALUES (2,'b');
 *   INSERT INTO `t` VALUES (3,'c');
 * Sur une DB cloud distante, chaque ligne = 1 round-trip réseau (~100 ms via
 * proxy Railway). 100 000 INSERTs = 2-3 heures.
 *
 * Ce script regroupe les INSERTs consécutifs sur la même table :
 *   INSERT INTO `t` VALUES (1,'a'),(2,'b'),(3,'c');
 * Résultat : 1 round-trip pour 1000 lignes au lieu de 1000.
 *
 * Usage :
 *   php optimize-sql-dump.php input.sql output.sql [batch_size=1000]
 */

if ($argc < 3) {
    fwrite(STDERR, "Usage: php optimize-sql-dump.php <input.sql> <output.sql> [batch_size]\n");
    exit(1);
}

$input  = $argv[1];
$output = $argv[2];
$batch  = (int) ($argv[3] ?? 1000);

if (!is_readable($input)) {
    fwrite(STDERR, "Fichier introuvable: $input\n");
    exit(1);
}

$in  = fopen($input, 'r');
$out = fopen($output, 'w');

$startTime         = microtime(true);
$totalLines        = 0;
$insertCount       = 0;
$mergedCount       = 0;
$currentTable      = null;
$currentInsertCols = null;          // partie "INSERT INTO `t` (cols) VALUES " pour préserver les colonnes si présentes
$batchValues       = [];

/**
 * Capture la "tête" de l'INSERT (avant VALUES) et les VALUES tuples.
 * Retourne [tableSignature, header, values] ou null si pas un INSERT simple.
 */
function parseInsertLine(string $line): ?array {
    if (!str_starts_with($line, 'INSERT INTO ')) return null;

    // Cherche " VALUES " (insensible à la casse) — sépare en tête + valeurs
    if (!preg_match('/^(INSERT INTO\s+`?[^`\s]+`?(?:\s*\([^)]*\))?\s+VALUES\s*)(.*?);\s*$/is', $line, $m)) {
        return null;
    }

    return [
        'header' => rtrim($m[1]),     // "INSERT INTO `t` VALUES" ou "INSERT INTO `t` (a,b) VALUES"
        'values' => trim($m[2]),      // "(1,'a'),(2,'b')" ou "(1,'a')"
    ];
}

function flushBatch($out, ?string $header, array &$values, int &$mergedCount): void {
    if (empty($values) || $header === null) {
        $values = [];
        return;
    }
    if (count($values) === 1) {
        // Single value, write as-is
        fwrite($out, $header . ' ' . $values[0] . ";\n");
    } else {
        // Multi-row : merge
        fwrite($out, $header . ' ' . implode(',', $values) . ";\n");
        $mergedCount += count($values) - 1;  // chaque ligne fusionnée économise 1 round-trip
    }
    $values = [];
}

while (($line = fgets($in)) !== false) {
    $totalLines++;

    $parsed = parseInsertLine($line);

    if ($parsed === null) {
        // Pas un INSERT — flush le batch en cours et écrit la ligne
        flushBatch($out, $currentInsertCols, $batchValues, $mergedCount);
        $currentInsertCols = null;
        fwrite($out, $line);
        continue;
    }

    $insertCount++;

    // Si on change de table OU si batch plein → flush
    if ($currentInsertCols !== $parsed['header'] || count($batchValues) >= $batch) {
        flushBatch($out, $currentInsertCols, $batchValues, $mergedCount);
        $currentInsertCols = $parsed['header'];
    }

    $batchValues[] = $parsed['values'];
}

// Flush final
flushBatch($out, $currentInsertCols, $batchValues, $mergedCount);

fclose($in);
fclose($out);

$duration = microtime(true) - $startTime;
$inputSize  = filesize($input);
$outputSize = filesize($output);

printf("\n");
printf("  Lignes lues          : %d\n", $totalLines);
printf("  INSERTs originaux    : %d\n", $insertCount);
printf("  INSERTs après merge  : %d  (économie de %d round-trips)\n",
    $insertCount - $mergedCount, $mergedCount);
printf("  Réduction taille     : %.1f MB → %.1f MB\n",
    $inputSize / 1024 / 1024, $outputSize / 1024 / 1024);
printf("  Durée traitement     : %.1f s\n", $duration);
printf("\n");
printf("  Sortie : %s\n", $output);
