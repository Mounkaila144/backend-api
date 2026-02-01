<?php

namespace Modules\User\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Modules\Superadmin\Services\ServiceConfigManager;
use Modules\User\Entities\User;

/**
 * UserSearchService
 * Gère la recherche full-text des utilisateurs avec Meilisearch
 * Compatible multi-tenant avec isolation par tenant (index par tenant)
 */
class UserSearchService
{
    protected ?string $meilisearchUrl = null;
    protected ?string $apiKey = null;
    protected ?string $indexPrefix = null;
    protected ?bool $available = null; // null = not initialized yet (lazy init)
    protected bool $initialized = false;
    protected array $configuredIndexes = []; // Cache des index déjà configurés

    // Attributs à indexer pour la recherche
    protected array $searchableAttributes = [
        'username',
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobile',
    ];

    // Attributs pour le filtrage
    protected array $filterableAttributes = [
        'id',
        'is_active',
        'is_locked',
        'status',
        'sex',
        'application',
        'callcenter_id',
        'team_ids',
        'group_ids',
        'function_ids',
        'profile_ids',
        'created_at_timestamp',
    ];

    // Attributs pour le tri
    protected array $sortableAttributes = [
        'id',
        'username',
        'firstname',
        'lastname',
        'email',
        'created_at_timestamp',
        'lastlogin_timestamp',
    ];

    public function __construct(
        protected ServiceConfigManager $configManager
    ) {
        // LAZY INIT: Don't initialize in constructor - wait until first use
        // This avoids network calls (HTTP health check) during dependency injection
    }

    /**
     * Ensure Meilisearch is initialized (lazy initialization)
     */
    protected function ensureInitialized(): void
    {
        if ($this->initialized) {
            return;
        }
        $this->initialized = true;
        $this->initializeMeilisearch();
    }

    /**
     * Initialise la connexion Meilisearch si la config existe
     */
    protected function initializeMeilisearch(): void
    {
        try {
            $config = $this->configManager->get('meilisearch');

            if ($config && !empty($config['url']) && !empty($config['api_key'])) {
                $this->meilisearchUrl = rtrim($config['url'], '/');
                $this->apiKey = $config['api_key'];
                $this->indexPrefix = $config['index_prefix'] ?? 'saas_';
                // OPTIMIZATION: Skip HTTP health check - just assume Meilisearch is available
                // If Meilisearch is down, search operations will return fallback results
                $this->available = true;
                Log::debug('UserSearchService: Meilisearch configured (lazy connection)');
            } else {
                $this->available = false;
            }
        } catch (\Exception $e) {
            Log::warning('UserSearchService: Meilisearch initialization failed', [
                'error' => $e->getMessage(),
            ]);
            $this->available = false;
        }
    }

    /**
     * Teste la connexion Meilisearch
     */
    protected function testConnection(): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->timeout(5)->get("{$this->meilisearchUrl}/health");

            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Retourne le nom de l'index pour le tenant actuel
     */
    protected function getIndexName(): string
    {
        $tenantId = tenancy()->tenant->site_id ?? 'default';
        return "{$this->indexPrefix}tenant_{$tenantId}_users";
    }

    /**
     * S'assure que l'index est configuré (auto-configuration au premier accès)
     * Utilise un cache mémoire pour éviter les vérifications répétées
     *
     * @return bool
     */
    public function ensureIndexConfigured(): bool
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return false;
        }

        $indexName = $this->getIndexName();

        // Vérifier le cache mémoire
        if (isset($this->configuredIndexes[$indexName])) {
            return true;
        }

        try {
            // Vérifier si l'index existe
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->get("{$this->meilisearchUrl}/indexes/{$indexName}");

            if ($response->status() === 404) {
                // L'index n'existe pas, le créer et le configurer
                Log::info('UserSearchService: Auto-configuring index', [
                    'index' => $indexName,
                ]);

                $this->configureIndex();
            }

            // Marquer comme configuré
            $this->configuredIndexes[$indexName] = true;

            return true;

        } catch (\Exception $e) {
            Log::warning('UserSearchService: Failed to ensure index configured', [
                'index' => $indexName,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Configure l'index pour les utilisateurs
     *
     * @return bool
     */
    public function configureIndex(): bool
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return false;
        }

        try {
            $indexName = $this->getIndexName();

            // Créer l'index s'il n'existe pas
            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$this->meilisearchUrl}/indexes", [
                'uid' => $indexName,
                'primaryKey' => 'id',
            ]);

            // Configurer les attributs searchables
            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->put("{$this->meilisearchUrl}/indexes/{$indexName}/settings/searchable-attributes",
                $this->searchableAttributes
            );

            // Configurer les attributs filtrables
            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->put("{$this->meilisearchUrl}/indexes/{$indexName}/settings/filterable-attributes",
                $this->filterableAttributes
            );

            // Configurer les attributs triables
            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->put("{$this->meilisearchUrl}/indexes/{$indexName}/settings/sortable-attributes",
                $this->sortableAttributes
            );

            Log::info('Meilisearch index configured', [
                'index' => $indexName,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to configure Meilisearch index', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Indexe un utilisateur
     *
     * @param User $user
     * @return bool
     */
    public function indexUser(User $user): bool
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return false;
        }

        // Auto-configurer l'index si nécessaire
        $this->ensureIndexConfigured();

        try {
            $indexName = $this->getIndexName();
            $document = $this->userToDocument($user);

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$this->meilisearchUrl}/indexes/{$indexName}/documents", [$document]);

            if (!$response->successful()) {
                throw new \Exception('Failed to index document: ' . $response->body());
            }

            Log::debug('User indexed in Meilisearch', [
                'user_id' => $user->id,
                'index' => $indexName,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to index user in Meilisearch', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Indexe plusieurs utilisateurs en batch
     *
     * @param iterable $users
     * @return int Nombre d'utilisateurs indexés
     */
    public function indexUsers(iterable $users): int
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return 0;
        }

        try {
            $indexName = $this->getIndexName();
            $documents = [];

            foreach ($users as $user) {
                $documents[] = $this->userToDocument($user);
            }

            if (empty($documents)) {
                return 0;
            }

            // Indexer par batches de 1000
            $batches = array_chunk($documents, 1000);
            $totalIndexed = 0;

            foreach ($batches as $batch) {
                $response = Http::withHeaders([
                    'Authorization' => "Bearer {$this->apiKey}",
                    'Content-Type' => 'application/json',
                ])->post("{$this->meilisearchUrl}/indexes/{$indexName}/documents", $batch);

                if ($response->successful()) {
                    $totalIndexed += count($batch);
                }
            }

            Log::info('Users batch indexed in Meilisearch', [
                'total_indexed' => $totalIndexed,
                'index' => $indexName,
            ]);

            return $totalIndexed;

        } catch (\Exception $e) {
            Log::error('Failed to batch index users', [
                'error' => $e->getMessage(),
            ]);
            return 0;
        }
    }

    /**
     * Supprime un utilisateur de l'index
     *
     * @param int $userId
     * @return bool
     */
    public function removeUser(int $userId): bool
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return false;
        }

        try {
            $indexName = $this->getIndexName();

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->delete("{$this->meilisearchUrl}/indexes/{$indexName}/documents/{$userId}");

            Log::debug('User removed from Meilisearch', [
                'user_id' => $userId,
                'index' => $indexName,
            ]);

            return $response->successful();

        } catch (\Exception $e) {
            Log::error('Failed to remove user from Meilisearch', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Recherche des utilisateurs
     *
     * @param string $query
     * @param array $options
     * @return array
     */
    public function search(string $query, array $options = []): array
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return [
                'hits' => [],
                'totalHits' => 0,
                'processingTimeMs' => 0,
                'fallback' => true,
            ];
        }

        // Auto-configurer l'index si nécessaire
        $this->ensureIndexConfigured();

        try {
            $indexName = $this->getIndexName();

            $searchParams = [
                'q' => $query,
                'limit' => $options['limit'] ?? 20,
                'offset' => $options['offset'] ?? 0,
            ];

            // Ajouter les filtres
            if (!empty($options['filter'])) {
                $searchParams['filter'] = $this->buildFilterString($options['filter']);
            }

            // Ajouter le tri
            if (!empty($options['sort'])) {
                $searchParams['sort'] = $options['sort'];
            }

            // Attributs à retourner
            if (!empty($options['attributesToRetrieve'])) {
                $searchParams['attributesToRetrieve'] = $options['attributesToRetrieve'];
            }

            // Highlighting
            if (!empty($options['attributesToHighlight'])) {
                $searchParams['attributesToHighlight'] = $options['attributesToHighlight'];
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'Content-Type' => 'application/json',
            ])->post("{$this->meilisearchUrl}/indexes/{$indexName}/search", $searchParams);

            if (!$response->successful()) {
                throw new \Exception('Search failed: ' . $response->body());
            }

            $result = $response->json();

            return [
                'hits' => $result['hits'] ?? [],
                'totalHits' => $result['estimatedTotalHits'] ?? $result['totalHits'] ?? 0,
                'processingTimeMs' => $result['processingTimeMs'] ?? 0,
                'query' => $query,
                'fallback' => false,
            ];

        } catch (\Exception $e) {
            Log::error('Meilisearch search failed', [
                'query' => $query,
                'error' => $e->getMessage(),
            ]);

            return [
                'hits' => [],
                'totalHits' => 0,
                'processingTimeMs' => 0,
                'fallback' => true,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Recherche avec récupération des modèles Eloquent
     *
     * @param string $query
     * @param array $options
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function searchUsers(string $query, array $options = []): \Illuminate\Database\Eloquent\Collection
    {
        $result = $this->search($query, $options);

        if (empty($result['hits'])) {
            return collect();
        }

        $ids = array_column($result['hits'], 'id');

        // Récupérer les utilisateurs
        $users = User::whereIn('id', $ids)->get();

        // Préserver l'ordre de Meilisearch (tri par pertinence)
        $idOrder = array_flip($ids);

        return $users->sortBy(function ($user) use ($idOrder) {
            return $idOrder[$user->id] ?? PHP_INT_MAX;
        })->values();
    }

    /**
     * Construit la chaîne de filtre pour Meilisearch
     *
     * @param array $filters
     * @return string
     */
    protected function buildFilterString(array $filters): string
    {
        $conditions = [];

        foreach ($filters as $field => $value) {
            if (is_array($value)) {
                // Filtre IN
                $values = array_map(function ($v) {
                    return is_string($v) ? "\"{$v}\"" : $v;
                }, $value);
                $conditions[] = "{$field} IN [" . implode(', ', $values) . "]";
            } elseif (is_bool($value)) {
                $conditions[] = "{$field} = " . ($value ? 'true' : 'false');
            } elseif (is_string($value)) {
                $conditions[] = "{$field} = \"{$value}\"";
            } else {
                $conditions[] = "{$field} = {$value}";
            }
        }

        return implode(' AND ', $conditions);
    }

    /**
     * Convertit un utilisateur en document pour Meilisearch
     *
     * @param User $user
     * @return array
     */
    protected function userToDocument(User $user): array
    {
        // Charger les relations si nécessaire
        if (!$user->relationLoaded('groups')) {
            $user->load(['groups:id', 'teams:id', 'functions:id', 'profiles:id']);
        }

        return [
            'id' => $user->id,
            'username' => $user->username,
            'firstname' => $user->firstname,
            'lastname' => $user->lastname,
            'fullname' => $user->full_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'mobile' => $user->mobile,
            'sex' => $user->sex,
            'is_active' => $user->is_active,
            'is_locked' => $user->is_locked,
            'status' => $user->status,
            'application' => $user->application,
            'callcenter_id' => $user->callcenter_id,
            'team_ids' => $user->teams->pluck('id')->toArray(),
            'group_ids' => $user->groups->pluck('id')->toArray(),
            'function_ids' => $user->functions->pluck('id')->toArray(),
            'profile_ids' => $user->profiles->pluck('id')->toArray(),
            'created_at' => $user->created_at?->toIso8601String(),
            'created_at_timestamp' => $user->created_at?->timestamp,
            'lastlogin' => $user->lastlogin?->toIso8601String(),
            'lastlogin_timestamp' => $user->lastlogin?->timestamp,
        ];
    }

    /**
     * Réindexe tous les utilisateurs du tenant
     *
     * @return array
     */
    public function reindexAll(): array
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return [
                'success' => false,
                'message' => 'Meilisearch not available',
            ];
        }

        try {
            // Configurer l'index d'abord
            $this->configureIndex();

            // Supprimer tous les documents existants
            $indexName = $this->getIndexName();
            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->delete("{$this->meilisearchUrl}/indexes/{$indexName}/documents");

            // Réindexer tous les utilisateurs par batch
            $total = 0;
            $batchSize = 500;

            User::where('application', 'admin')
                ->where('username', 'NOT LIKE', 'superadmin%')
                ->with(['groups:id', 'teams:id', 'functions:id', 'profiles:id'])
                ->chunk($batchSize, function ($users) use (&$total) {
                    $total += $this->indexUsers($users);
                });

            Log::info('Meilisearch full reindex completed', [
                'index' => $indexName,
                'total_indexed' => $total,
            ]);

            return [
                'success' => true,
                'message' => "Reindexed {$total} users",
                'total_indexed' => $total,
            ];

        } catch (\Exception $e) {
            Log::error('Meilisearch full reindex failed', [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Supprime l'index du tenant
     *
     * @return bool
     */
    public function deleteIndex(): bool
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return false;
        }

        try {
            $indexName = $this->getIndexName();

            Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->delete("{$this->meilisearchUrl}/indexes/{$indexName}");

            Log::info('Meilisearch index deleted', [
                'index' => $indexName,
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete Meilisearch index', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Retourne les statistiques de l'index
     *
     * @return array
     */
    public function getIndexStats(): array
    {
        $this->ensureInitialized();
        if (!$this->available) {
            return [
                'available' => false,
            ];
        }

        try {
            $indexName = $this->getIndexName();

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
            ])->get("{$this->meilisearchUrl}/indexes/{$indexName}/stats");

            if (!$response->successful()) {
                return [
                    'available' => true,
                    'index_exists' => false,
                ];
            }

            $stats = $response->json();

            return [
                'available' => true,
                'index_exists' => true,
                'index_name' => $indexName,
                'number_of_documents' => $stats['numberOfDocuments'] ?? 0,
                'is_indexing' => $stats['isIndexing'] ?? false,
            ];

        } catch (\Exception $e) {
            return [
                'available' => true,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Vérifie si Meilisearch est disponible
     *
     * @return bool
     */
    public function isAvailable(): bool
    {
        $this->ensureInitialized();
        return $this->available ?? false;
    }
}
