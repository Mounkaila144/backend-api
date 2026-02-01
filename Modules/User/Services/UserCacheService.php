<?php

namespace Modules\User\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Modules\User\Entities\User;

/**
 * UserCacheService
 * Gère le cache des données utilisateurs avec Redis local
 * Compatible multi-tenant avec isolation par tenant
 */
class UserCacheService
{
    protected string $cacheStore = 'redis';
    protected int $defaultTtl = 3600; // 1 heure par défaut

    // Durées de cache spécifiques
    protected array $cacheTtl = [
        'user' => 3600,           // 1 heure pour un utilisateur
        'user_list' => 600,       // 10 minutes pour les listes
        'statistics' => 300,      // 5 minutes pour les statistiques
        'creation_options' => 1800, // 30 minutes pour les options de création
    ];

    /**
     * Génère la clé de cache avec le préfixe tenant
     */
    protected function getCacheKey(string $type, mixed $identifier = null): string
    {
        $tenantId = tenancy()->tenant->site_id ?? 'default';
        $key = "tenant:{$tenantId}:users:{$type}";

        if ($identifier !== null) {
            $key .= ":{$identifier}";
        }

        return $key;
    }

    /**
     * Récupère un utilisateur depuis le cache ou la base de données
     */
    public function rememberUser(int $userId, callable $callback): ?User
    {
        $key = $this->getCacheKey('user', $userId);
        $ttl = $this->cacheTtl['user'];

        try {
            return Cache::store($this->cacheStore)->remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache read failed, executing callback directly', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);
            return $callback();
        }
    }

    /**
     * Met en cache un utilisateur
     */
    public function cacheUser(User $user): void
    {
        $key = $this->getCacheKey('user', $user->id);
        $ttl = $this->cacheTtl['user'];

        try {
            Cache::store($this->cacheStore)->put($key, $user, $ttl);
        } catch (\Exception $e) {
            Log::warning('Failed to cache user', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalide le cache d'un utilisateur
     */
    public function forgetUser(int $userId): void
    {
        $key = $this->getCacheKey('user', $userId);

        try {
            Cache::store($this->cacheStore)->forget($key);
            $this->invalidateUserLists();
            Log::debug('User cache invalidated', ['user_id' => $userId]);
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate user cache', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Récupère la liste des utilisateurs depuis le cache
     */
    public function rememberUserList(string $listKey, callable $callback): mixed
    {
        $key = $this->getCacheKey('list', $listKey);
        $ttl = $this->cacheTtl['user_list'];

        try {
            return Cache::store($this->cacheStore)->remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache read failed for user list', [
                'list_key' => $listKey,
                'error' => $e->getMessage(),
            ]);
            return $callback();
        }
    }

    /**
     * Génère une clé de cache pour une liste basée sur les filtres
     */
    public function generateListKey(array $filters, int $page, int $perPage): string
    {
        $filterHash = md5(json_encode($filters));
        return "p{$page}_pp{$perPage}_{$filterHash}";
    }

    /**
     * Invalide toutes les listes d'utilisateurs en cache
     */
    public function invalidateUserLists(): void
    {
        try {
            $tenantId = tenancy()->tenant->site_id ?? 'default';
            $pattern = "tenant:{$tenantId}:users:list:*";

            $redis = Redis::connection('cache');
            $keys = $redis->keys($pattern);

            if (!empty($keys)) {
                $redis->del($keys);
            }

            $this->forgetStatistics();
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate user lists cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Récupère les statistiques depuis le cache
     */
    public function rememberStatistics(callable $callback): array
    {
        $key = $this->getCacheKey('statistics');
        $ttl = $this->cacheTtl['statistics'];

        try {
            return Cache::store($this->cacheStore)->remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache read failed for statistics', [
                'error' => $e->getMessage(),
            ]);
            return $callback();
        }
    }

    /**
     * Invalide le cache des statistiques
     */
    public function forgetStatistics(): void
    {
        $key = $this->getCacheKey('statistics');

        try {
            Cache::store($this->cacheStore)->forget($key);
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate statistics cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Récupère les options de création depuis le cache
     */
    public function rememberCreationOptions(callable $callback): array
    {
        $key = $this->getCacheKey('creation_options');
        $ttl = $this->cacheTtl['creation_options'];

        try {
            return Cache::store($this->cacheStore)->remember($key, $ttl, $callback);
        } catch (\Exception $e) {
            Log::warning('Cache read failed for creation options', [
                'error' => $e->getMessage(),
            ]);
            return $callback();
        }
    }

    /**
     * Invalide le cache des options de création
     */
    public function forgetCreationOptions(): void
    {
        $key = $this->getCacheKey('creation_options');

        try {
            Cache::store($this->cacheStore)->forget($key);
        } catch (\Exception $e) {
            Log::warning('Failed to invalidate creation options cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Invalide tout le cache utilisateurs pour un tenant
     */
    public function flushTenantCache(): void
    {
        try {
            $tenantId = tenancy()->tenant->site_id ?? 'default';
            $pattern = "tenant:{$tenantId}:users:*";

            $redis = Redis::connection('cache');
            $keys = $redis->keys($pattern);

            if (!empty($keys)) {
                $redis->del($keys);
                Log::info('Tenant user cache flushed', [
                    'tenant_id' => $tenantId,
                    'keys_deleted' => count($keys),
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to flush tenant user cache', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Met en cache un résultat personnalisé
     */
    public function put(string $key, mixed $value, ?int $ttl = null): void
    {
        $cacheKey = $this->getCacheKey('custom', $key);
        $ttl = $ttl ?? $this->defaultTtl;

        try {
            Cache::store($this->cacheStore)->put($cacheKey, $value, $ttl);
        } catch (\Exception $e) {
            Log::warning('Failed to cache custom value', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Récupère une valeur du cache
     */
    public function get(string $key, mixed $default = null): mixed
    {
        $cacheKey = $this->getCacheKey('custom', $key);

        try {
            return Cache::store($this->cacheStore)->get($cacheKey, $default);
        } catch (\Exception $e) {
            Log::warning('Failed to get cached value', [
                'key' => $key,
                'error' => $e->getMessage(),
            ]);
            return $default;
        }
    }

    /**
     * Vérifie si Redis est disponible
     */
    public function isRedisAvailable(): bool
    {
        try {
            Redis::connection('cache')->ping();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Retourne le store de cache actuellement utilisé
     */
    public function getCurrentStore(): string
    {
        return $this->cacheStore;
    }

    /**
     * Retourne les informations de diagnostic du cache
     */
    public function getDiagnostics(): array
    {
        $diagnostics = [
            'store' => $this->cacheStore,
            'redis_available' => $this->isRedisAvailable(),
            'ttl_settings' => $this->cacheTtl,
        ];

        try {
            $redis = Redis::connection('cache');
            $info = $redis->info();

            $diagnostics['redis_info'] = [
                'version' => $info['redis_version'] ?? $info['Server']['redis_version'] ?? 'unknown',
                'connected_clients' => $info['connected_clients'] ?? $info['Clients']['connected_clients'] ?? 'unknown',
                'used_memory_human' => $info['used_memory_human'] ?? $info['Memory']['used_memory_human'] ?? 'unknown',
            ];
        } catch (\Exception $e) {
            $diagnostics['redis_info'] = ['error' => $e->getMessage()];
        }

        return $diagnostics;
    }

    /**
     * Cache warming - précharge les utilisateurs fréquemment accédés
     */
    public function warmCache(array $userIds, callable $loader): int
    {
        $count = 0;

        foreach ($userIds as $userId) {
            try {
                $user = $loader($userId);
                if ($user) {
                    $this->cacheUser($user);
                    $count++;
                }
            } catch (\Exception $e) {
                Log::warning('Failed to warm cache for user', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        Log::info('Cache warming completed', [
            'users_cached' => $count,
            'total_requested' => count($userIds),
        ]);

        return $count;
    }
}
