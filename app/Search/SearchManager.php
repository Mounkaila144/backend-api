<?php

namespace App\Search;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SearchManager - Gère toute la logique Meilisearch
 * Un seul fichier pour tout gérer : indexation, recherche, configuration
 */
class SearchManager
{
    protected static ?string $url = null;
    protected static ?string $apiKey = null;
    protected static bool $initialized = false;

    /** Dispatch un job d'indexation (asynchrone) */
    public static function dispatch(Model $model, string $action): void
    {
        $tenantId = tenancy()->tenant?->site_id;
        if (!$tenantId) return;

        IndexJob::dispatch($model::class, $model->getKey(), $tenantId, $action)->onQueue('search');
    }

    /** Initialise la connexion Meilisearch */
    protected static function init(): bool
    {
        if (self::$initialized) return self::$url !== null;

        try {
            $config = app(\Modules\Superadmin\Services\ServiceConfigManager::class)->get('meilisearch');
            if ($config && !empty($config['url']) && !empty($config['api_key'])) {
                self::$url = rtrim($config['url'], '/');
                self::$apiKey = $config['api_key'];
            }
        } catch (\Exception $e) {
            Log::debug('SearchManager: Meilisearch not configured');
        }

        self::$initialized = true;
        return self::$url !== null;
    }

    /** Vérifie si Meilisearch est disponible */
    public static function available(): bool
    {
        return self::init() && self::$url !== null;
    }

    /** Indexe un document */
    public static function index(Model $model): bool
    {
        if (!self::init()) return false;

        try {
            $indexName = $model->getSearchIndexName();
            self::ensureIndex($model);

            $response = Http::withHeaders([
                'Authorization' => "Bearer " . self::$apiKey,
                'Content-Type' => 'application/json',
            ])->post(self::$url . "/indexes/{$indexName}/documents", [$model->toSearchDocument()]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error("SearchManager: Index failed", ['error' => $e->getMessage()]);
            return false;
        }
    }

    /** Supprime un document de l'index */
    public static function delete(Model $model): bool
    {
        if (!self::init()) return false;

        try {
            $indexName = $model->getSearchIndexName();
            $response = Http::withHeaders([
                'Authorization' => "Bearer " . self::$apiKey,
            ])->delete(self::$url . "/indexes/{$indexName}/documents/" . $model->getKey());

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /** Recherche dans un index */
    public static function search(Model $model, string $query, array $options = []): array
    {
        if (!self::init()) return ['hits' => [], 'totalHits' => 0, 'fallback' => true];

        try {
            $indexName = $model->getSearchIndexName();
            self::ensureIndex($model);

            $params = array_merge([
                'q' => $query,
                'limit' => $options['limit'] ?? 20,
                'offset' => $options['offset'] ?? 0,
            ], array_filter([
                'filter' => self::buildFilter($options['filter'] ?? []),
                'sort' => $options['sort'] ?? null,
            ]));

            $response = Http::withHeaders([
                'Authorization' => "Bearer " . self::$apiKey,
                'Content-Type' => 'application/json',
            ])->post(self::$url . "/indexes/{$indexName}/search", $params);

            if (!$response->successful()) {
                return ['hits' => [], 'totalHits' => 0, 'fallback' => true];
            }

            $data = $response->json();
            return [
                'hits' => $data['hits'] ?? [],
                'totalHits' => $data['estimatedTotalHits'] ?? $data['totalHits'] ?? 0,
                'processingTimeMs' => $data['processingTimeMs'] ?? 0,
                'fallback' => false,
            ];
        } catch (\Exception $e) {
            return ['hits' => [], 'totalHits' => 0, 'fallback' => true];
        }
    }

    /** Configure l'index si nécessaire (auto-configuration) */
    protected static function ensureIndex(Model $model): void
    {
        static $configured = [];
        $indexName = $model->getSearchIndexName();

        if (isset($configured[$indexName])) return;

        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer " . self::$apiKey,
            ])->get(self::$url . "/indexes/{$indexName}");

            if ($response->status() === 404) {
                // Créer et configurer l'index
                Http::withHeaders([
                    'Authorization' => "Bearer " . self::$apiKey,
                    'Content-Type' => 'application/json',
                ])->post(self::$url . "/indexes", [
                    'uid' => $indexName,
                    'primaryKey' => 'id',
                ]);

                // Configurer les attributs
                Http::withHeaders([
                    'Authorization' => "Bearer " . self::$apiKey,
                    'Content-Type' => 'application/json',
                ])->patch(self::$url . "/indexes/{$indexName}/settings", [
                    'searchableAttributes' => $model->getSearchableAttributes(),
                    'filterableAttributes' => $model->getFilterableAttributes(),
                    'sortableAttributes' => $model->getSortableAttributes(),
                ]);

                Log::info("SearchManager: Index {$indexName} auto-configured");
            }

            $configured[$indexName] = true;
        } catch (\Exception $e) {
            Log::warning("SearchManager: ensureIndex failed", ['error' => $e->getMessage()]);
        }
    }

    /** Construit le filtre Meilisearch à partir d'un tableau */
    protected static function buildFilter(array $filters): ?string
    {
        if (empty($filters)) return null;

        $parts = [];
        foreach ($filters as $key => $value) {
            if (is_bool($value)) {
                $parts[] = $value ? $key . " = true" : $key . " = false";
            } elseif (is_array($value)) {
                $parts[] = $key . " IN [" . implode(',', $value) . "]";
            } else {
                $parts[] = $key . " = " . (is_numeric($value) ? $value : "\"$value\"");
            }
        }

        return implode(' AND ', $parts);
    }

    /** Réindexe tous les documents d'un modèle */
    public static function reindexAll(string $modelClass, int $chunkSize = 500): int
    {
        if (!self::init()) return 0;

        $count = 0;
        $modelClass::query()->chunk($chunkSize, function ($models) use (&$count) {
            foreach ($models as $model) {
                if (self::index($model)) $count++;
            }
        });

        return $count;
    }
}
