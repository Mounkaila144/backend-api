<?php

namespace Modules\User\Repositories;

use App\Search\SearchManager;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\User\Entities\User;
use Modules\User\Services\UserCacheService;

/**
 * User Repository - Gère l'accès aux données utilisateurs
 */
class UserRepository
{
    protected ?UserCacheService $cacheService = null;
    protected ?string $lastSearchEngine = null;
    protected ?int $lastSearchTimeMs = null;

    public function __construct()
    {
        try {
            $this->cacheService = app(UserCacheService::class);
        } catch (\Exception $e) {}
    }
    /**
     * Get paginated users with filters
     * Utilise Meilisearch pour la recherche si disponible
     */
    public function getPaginated(array $filters = [], int $perPage = 100): LengthAwarePaginator
    {
        $page = (int) request()->get('page', 1);
        $searchQuery = $this->extractSearchQuery($filters);
        $useMeilisearch = $searchQuery && SearchManager::available();

        $fetcher = fn() => $useMeilisearch
            ? $this->fetchWithMeilisearch($filters, $perPage, $searchQuery)
            : $this->fetchPaginatedUsers($filters, $perPage);

        if ($this->cacheService) {
            $key = $this->cacheService->generateListKey($filters, $page, $perPage);
            return $this->cacheService->rememberUserList($key, $fetcher);
        }

        return $fetcher();
    }

    /** Retourne les infos sur le moteur de recherche utilisé */
    public function getLastSearchInfo(): array
    {
        return [
            'engine' => $this->lastSearchEngine ?? 'sql',
            'processing_time_ms' => $this->lastSearchTimeMs,
            'meilisearch_available' => SearchManager::available(),
        ];
    }

    /** Extrait la requête de recherche des filtres */
    protected function extractSearchQuery(array $filters): ?string
    {
        $search = $filters['search'] ?? null;
        if (is_string($search)) return trim($search) ?: null;
        if (is_array($search)) return trim($search['query'] ?? '') ?: null;
        return null;
    }

    /** Recherche avec Meilisearch */
    protected function fetchWithMeilisearch(array $filters, int $perPage, string $query): LengthAwarePaginator
    {
        $page = (int) request()->get('page', 1);

        $result = SearchManager::search(new User, $query, [
            'limit' => $perPage,
            'offset' => ($page - 1) * $perPage,
            'filter' => $this->buildMeilisearchFilter($filters),
            'sort' => $this->buildMeilisearchSort($filters['order'] ?? []),
        ]);

        if ($result['fallback']) {
            $this->lastSearchEngine = 'sql_fallback';
            return $this->fetchPaginatedUsers($filters, $perPage);
        }

        $this->lastSearchEngine = 'meilisearch';
        $this->lastSearchTimeMs = $result['processingTimeMs'] ?? null;

        $ids = array_column($result['hits'], 'id');
        if (empty($ids)) {
            return new LengthAwarePaginator(collect([]), 0, $perPage, $page);
        }

        $users = $this->loadUsersById($ids);
        $order = array_flip($ids);
        $users = $users->sortBy(fn($u) => $order[$u->id] ?? PHP_INT_MAX)->values();

        return new LengthAwarePaginator($users, $result['totalHits'], $perPage, $page);
    }

    /** Charge les utilisateurs par IDs avec relations (utilisé par Meilisearch) */
    protected function loadUsersById(array $ids): \Illuminate\Database\Eloquent\Collection
    {
        $users = User::query()
            ->with(['groups:id,name', 'creator:id,username,firstname,lastname', 'callcenter:id,name'])
            ->whereIn('t_users.id', $ids)
            ->get();

        // Charger les listes agrégées de la même manière que fetchPaginatedUsers
        $this->loadAggregatedLists($users);

        return $users;
    }

    /** Construit le filtre Meilisearch */
    protected function buildMeilisearchFilter(array $filters): array
    {
        $f = [];
        $eq = $filters['equal'] ?? [];
        if (!empty($eq['is_active'])) $f['is_active'] = $eq['is_active'];
        if (!empty($eq['is_locked'])) $f['is_locked'] = $eq['is_locked'];
        if (!empty($eq['status'])) $f['status'] = $eq['status'];
        if (!empty($eq['callcenter_id']) && $eq['callcenter_id'] !== 'IS_NULL') $f['callcenter_id'] = (int)$eq['callcenter_id'];
        return $f;
    }

    /** Construit le tri Meilisearch */
    protected function buildMeilisearchSort(array $order): array
    {
        $sort = [];
        foreach ($order as $field => $dir) {
            if (in_array($field, ['id', 'username', 'firstname', 'lastname', 'created_at'])) {
                $sort[] = "{$field}:" . strtolower($dir);
            }
        }
        return $sort;
    }

    /**
     * Récupère les utilisateurs paginés depuis la base de données
     * OPTIMISÉ: Utilise des JOINs au lieu de sous-requêtes corrélées
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    protected function fetchPaginatedUsers(array $filters, int $perPage): LengthAwarePaginator
    {
        // OPTIMISATION: Eager loading minimal pour la liste
        // On ne charge que les relations nécessaires pour l'affichage
        $with = [
            'groups:id,name',
            'creator:id,username,firstname,lastname',
            'callcenter:id,name',
        ];

        $query = User::query()
            ->with($with)
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%');

        // Apply filters
        $this->applyFilters($query, $filters);

        // Apply sorting
        $this->applySorting($query, $filters);

        $paginator = $query->paginate($perPage);

        // OPTIMISATION: Charger les listes agrégées en 2-3 requêtes au lieu de N sous-requêtes
        $this->loadAggregatedLists($paginator->getCollection());

        return $paginator;
    }

    /**
     * Charge les listes agrégées (groups, teams, functions, profiles) en requêtes batch
     * OPTIMISATION: 4 requêtes au lieu de 4*N sous-requêtes
     *
     * @param \Illuminate\Support\Collection $users
     * @return void
     */
    protected function loadAggregatedLists(\Illuminate\Support\Collection $users): void
    {
        if ($users->isEmpty()) {
            return;
        }

        $userIds = $users->pluck('id')->toArray();

        // 1. Charger les groupes en une seule requête
        $groupsData = DB::table('t_user_group')
            ->join('t_groups', 't_user_group.group_id', '=', 't_groups.id')
            ->whereIn('t_user_group.user_id', $userIds)
            ->where('t_groups.name', '!=', 'superadmin')
            ->select('t_user_group.user_id', 't_groups.name')
            ->orderBy('t_groups.name')
            ->get()
            ->groupBy('user_id')
            ->map(fn($items) => $items->pluck('name')->implode(','));

        // 2. Charger les teams (si la table existe)
        $teamsData = collect();
        if ($this->tableExists('t_users_team_users') && $this->tableExists('t_users_team')) {
            $teamsData = DB::table('t_users_team_users')
                ->join('t_users_team', 't_users_team_users.team_id', '=', 't_users_team.id')
                ->whereIn('t_users_team_users.user_id', $userIds)
                ->select('t_users_team_users.user_id', 't_users_team.name')
                ->orderBy('t_users_team.name')
                ->get()
                ->groupBy('user_id')
                ->map(fn($items) => $items->pluck('name')->implode(','));
        }

        // 3. Charger les fonctions (si la table existe)
        $functionsData = collect();
        if ($this->tableExists('t_users_functions') && $this->tableExists('t_users_function')) {
            $functionsData = DB::table('t_users_functions')
                ->join('t_users_function', 't_users_functions.function_id', '=', 't_users_function.id')
                ->whereIn('t_users_functions.user_id', $userIds)
                ->select('t_users_functions.user_id', 't_users_function.name')
                ->orderBy('t_users_function.name')
                ->get()
                ->groupBy('user_id')
                ->map(fn($items) => $items->pluck('name')->implode(','));
        }

        // 4. Charger les profils avec traduction (si la table existe)
        $profilesData = collect();
        if ($this->tableExists('t_users_profiles') && $this->tableExists('t_users_profile')) {
            $profilesData = DB::table('t_users_profiles')
                ->join('t_users_profile', 't_users_profiles.profile_id', '=', 't_users_profile.id')
                ->leftJoin('t_users_profile_i18n', function ($join) {
                    $join->on('t_users_profile.id', '=', 't_users_profile_i18n.profile_id')
                        ->where('t_users_profile_i18n.lang', '=', 'fr');
                })
                ->whereIn('t_users_profiles.user_id', $userIds)
                ->select(
                    't_users_profiles.user_id',
                    DB::raw('COALESCE(t_users_profile_i18n.value, t_users_profile.name) as name')
                )
                ->orderBy('name')
                ->get()
                ->groupBy('user_id')
                ->map(fn($items) => $items->pluck('name')->implode(','));
        }

        // Assigner les données aux utilisateurs
        foreach ($users as $user) {
            $user->groups_list = $groupsData->get($user->id);
            $user->teams_list = $teamsData->get($user->id);
            $user->functions_list = $functionsData->get($user->id);
            $user->profiles = $profilesData->get($user->id);
        }
    }

    /**
     * Vérifie si une table existe (avec cache mémoire)
     *
     * @param string $tableName
     * @return bool
     */
    protected function tableExists(string $tableName): bool
    {
        return in_array($tableName, $this->getExistingTables());
    }

    /**
     * Get list of existing tables in the current database
     * OPTIMISÉ: Une seule requête SHOW TABLES au lieu de 11 requêtes séparées
     *
     * @return array
     */
    protected function getExistingTables(): array
    {
        static $tablesByTenant = [];

        $tenantId = tenancy()->tenant->site_id ?? 'default';

        if (!isset($tablesByTenant[$tenantId])) {
            try {
                // Une seule requête pour lister toutes les tables
                $allTables = collect(DB::select('SHOW TABLES'))
                    ->map(fn($row) => array_values((array) $row)[0])
                    ->toArray();

                // Filtrer uniquement les tables qui nous intéressent
                $optionalTables = [
                    't_users_team_users',
                    't_users_team',
                    't_users_functions',
                    't_users_function',
                    't_users_profiles',
                    't_users_profile',
                    't_users_profile_i18n',
                    't_users_attributions',
                    't_users_attribution',
                    't_callcenter',
                    't_user_property',
                ];

                $tablesByTenant[$tenantId] = array_intersect($optionalTables, $allTables);
            } catch (\Exception $e) {
                $tablesByTenant[$tenantId] = [];
            }
        }

        return $tablesByTenant[$tenantId];
    }

    /**
     * Apply filters to query
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $filters
     * @return void
     */
    protected function applyFilters($query, array $filters): void
    {
        // Search filters - supports both string and array format
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            // Support both formats: filter[search]=value OR filter[search][field]=value
            if (is_string($search)) {
                // Direct search value: search across multiple fields
                $searchTerm = $search;
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('username', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('firstname', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('lastname', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('email', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('phone', 'LIKE', "%{$searchTerm}%")
                        ->orWhere('mobile', 'LIKE', "%{$searchTerm}%");
                });
            } elseif (is_array($search)) {
                // Array format: specific field searches
                if (!empty($search['query'])) {
                    $searchTerm = $search['query'];
                    $query->where(function ($q) use ($searchTerm) {
                        $q->where('username', 'LIKE', "%{$searchTerm}%")
                            ->orWhere('firstname', 'LIKE', "%{$searchTerm}%")
                            ->orWhere('lastname', 'LIKE', "%{$searchTerm}%")
                            ->orWhere('email', 'LIKE', "%{$searchTerm}%");
                    });
                }

                if (!empty($search['username'])) {
                    $query->where('username', 'LIKE', "%{$search['username']}%");
                }

                if (!empty($search['firstname'])) {
                    $query->where('firstname', 'LIKE', "%{$search['firstname']}%");
                }

                if (!empty($search['lastname'])) {
                    $query->where('lastname', 'LIKE', "%{$search['lastname']}%");
                }

                if (!empty($search['email'])) {
                    $query->where('email', 'LIKE', "%{$search['email']}%");
                }

                if (!empty($search['phone'])) {
                    $query->where('phone', 'LIKE', "%{$search['phone']}%");
                }

                if (!empty($search['mobile'])) {
                    $query->where('mobile', 'LIKE', "%{$search['mobile']}%");
                }

                if (isset($search['id'])) {
                    $query->where('t_users.id', $search['id']);
                }
            }
        }

        // Equal filters
        if (!empty($filters['equal'])) {
            $equal = $filters['equal'];

            // Status filters
            if (!empty($equal['is_active'])) {
                $query->where('is_active', $equal['is_active']);
            }

            if (!empty($equal['status'])) {
                $query->where('status', $equal['status']);
            }

            if (!empty($equal['is_locked'])) {
                $query->where('is_locked', $equal['is_locked']);
            }

            if (!empty($equal['is_secure_by_code'])) {
                $query->where('is_secure_by_code', $equal['is_secure_by_code']);
            }

            if (!empty($equal['sex'])) {
                $query->where('sex', $equal['sex']);
            }

            // Relation filters (by ID)

            // Group filter
            if (!empty($equal['group_id'])) {
                $query->whereHas('groups', function ($q) use ($equal) {
                    $q->where('t_groups.id', $equal['group_id']);
                });
            }

            // Team filter (many-to-many)
            if (!empty($equal['team_id'])) {
                $query->whereHas('teams', function ($q) use ($equal) {
                    $q->where('t_users_team.id', $equal['team_id']);
                });
            }

            // Function filter
            if (!empty($equal['function_id'])) {
                $query->whereHas('functions', function ($q) use ($equal) {
                    $q->where('t_users_function.id', $equal['function_id']);
                });
            }

            // Profile filter
            if (!empty($equal['profile_id'])) {
                $query->whereHas('profiles', function ($q) use ($equal) {
                    $q->where('t_users_profile.id', $equal['profile_id']);
                });
            }

            // Attribution filter
            if (!empty($equal['attribution_id'])) {
                $query->whereHas('attributions', function ($q) use ($equal) {
                    $q->where('t_users_attribution.id', $equal['attribution_id']);
                });
            }

            // Creator filter
            if (isset($equal['creator_id'])) {
                if ($equal['creator_id'] === 'IS_NULL' || $equal['creator_id'] === '') {
                    $query->whereNull('creator_id');
                } else {
                    $query->where('creator_id', $equal['creator_id']);
                }
            }

            // Unlocked by filter
            if (isset($equal['unlocked_by'])) {
                if ($equal['unlocked_by'] === 'IS_NULL' || $equal['unlocked_by'] === '') {
                    $query->whereNull('unlocked_by');
                } else {
                    $query->where('unlocked_by', $equal['unlocked_by']);
                }
            }

            // Company filter
            if (isset($equal['company_id'])) {
                if ($equal['company_id'] === 'IS_NULL' || $equal['company_id'] === '') {
                    $query->whereNull('company_id');
                } else {
                    $query->where('company_id', $equal['company_id']);
                }
            }

            // Callcenter filter
            if (isset($equal['callcenter_id'])) {
                if ($equal['callcenter_id'] === 'IS_NULL' || $equal['callcenter_id'] === '') {
                    $query->whereNull('callcenter_id');
                } else {
                    $query->where('callcenter_id', $equal['callcenter_id']);
                }
            }
        }

        // LIKE filters - flexible column-based search
        if (!empty($filters['like'])) {
            $like = $filters['like'];

            // Support LIKE on any column
            $allowedColumns = [
                'username', 'firstname', 'lastname', 'email', 'phone', 'mobile',
                'sex', 'application', 'status', 'is_active', 'is_locked'
            ];

            foreach ($like as $column => $value) {
                if (in_array($column, $allowedColumns) && !empty($value)) {
                    $query->where($column, 'LIKE', "%{$value}%");
                }
            }
        }

        // Date range filters
        if (!empty($filters['range'])) {
            $range = $filters['range'];

            if (!empty($range['created_at_from'])) {
                $query->where('created_at', '>=', $range['created_at_from']);
            }

            if (!empty($range['created_at_to'])) {
                $query->where('created_at', '<=', $range['created_at_to']);
            }

            if (!empty($range['lastlogin_from'])) {
                $query->where('lastlogin', '>=', $range['lastlogin_from']);
            }

            if (!empty($range['lastlogin_to'])) {
                $query->where('lastlogin', '<=', $range['lastlogin_to']);
            }
        }
    }

    /**
     * Apply sorting to query
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $filters
     * @return void
     */
    protected function applySorting($query, array $filters): void
    {
        if (!empty($filters['order'])) {
            foreach ($filters['order'] as $field => $direction) {
                if (in_array($direction, ['asc', 'desc'])) {
                    $query->orderBy($field, $direction);
                }
            }
        } else {
            // Default sorting
            $query->orderBy('id', 'asc');
        }
    }

    /**
     * Find user by ID with relations
     * Utilise le cache Redis si disponible
     *
     * @param int $id
     * @return User
     */
    public function findWithRelations(int $id): User
    {
        // Utiliser le cache si disponible
        if ($this->cacheService) {
            return $this->cacheService->rememberUser($id, function () use ($id) {
                return $this->fetchUserWithRelations($id);
            });
        }

        return $this->fetchUserWithRelations($id);
    }

    /**
     * Récupère un utilisateur avec ses relations depuis la base de données
     *
     * @param int $id
     * @return User
     */
    protected function fetchUserWithRelations(int $id): User
    {
        $with = [
            'groups:id,name',
            'creator:id,username,firstname,lastname',
            'unlocker:id,username,firstname,lastname',
            'callcenter:id,name',
            'permissions:id,name,group_id',  // Load user's direct permissions
        ];

        // Add optional relations if tables exist
        $existingTables = $this->getExistingTables();

        if (in_array('t_users_team_users', $existingTables) && in_array('t_users_team', $existingTables)) {
            $with[] = 'teams:id,name';
            $with[] = 'team:id,name,manager_id';
        }

        if (in_array('t_users_functions', $existingTables) && in_array('t_users_function', $existingTables)) {
            $with[] = 'functions:id,name';
        }

        if (in_array('t_users_profiles', $existingTables) && in_array('t_users_profile', $existingTables)) {
            $with[] = 'profiles:id,name';
        }

        if (in_array('t_users_attributions', $existingTables) && in_array('t_users_attribution', $existingTables)) {
            $with[] = 'attributions:id,name';
        }

        if (in_array('t_users_team', $existingTables)) {
            $with[] = 'managedTeams:id,name';
        }

        if (in_array('t_user_property', $existingTables)) {
            $with[] = 'properties';
        }

        return User::with($with)->findOrFail($id);
    }

    /**
     * Create a new user
     *
     * @param array $data
     * @return User
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Create a new user with all assignments (groups, functions, profiles, etc.)
     *
     * @param array $data
     * @return User
     */
    public function createWithAssignments(array $data): User
    {
        // Extract assignment data
        $groupIds = $data['group_ids'] ?? [];
        $functionIds = $data['function_ids'] ?? [];
        $profileIds = $data['profile_ids'] ?? [];
        $teamIds = $data['team_ids'] ?? [];
        $attributionIds = $data['attribution_ids'] ?? [];
        $permissionIds = $data['permission_ids'] ?? [];

        // Remove assignment data from user data
        unset($data['group_ids'], $data['function_ids'], $data['profile_ids'], $data['team_ids'], $data['attribution_ids'], $data['permission_ids']);

        // Create the user
        $user = User::create($data);

        // Assign groups
        if (!empty($groupIds)) {
            $user->groups()->attach($groupIds);
        }

        // Assign functions
        if (!empty($functionIds)) {
            $user->functions()->attach($functionIds);
        }

        // Assign profiles
        if (!empty($profileIds)) {
            $user->profiles()->attach($profileIds);
        }

        // Assign teams (many-to-many)
        if (!empty($teamIds)) {
            $user->teams()->attach($teamIds);
        }

        // Assign attributions
        if (!empty($attributionIds)) {
            $user->attributions()->attach($attributionIds);
        }

        // Assign permissions (exactly as specified by the user)
        // The frontend is responsible for selecting which permissions to assign
        if (!empty($permissionIds)) {
            $insertData = array_map(function ($permissionId) use ($user) {
                return [
                    'user_id' => $user->id,
                    'permission_id' => $permissionId,
                ];
            }, array_unique($permissionIds));

            DB::table('t_user_permission')->insert($insertData);
        }

        // Invalider le cache des listes
        $this->invalidateUserCaches();

        return $user;
    }

    /**
     * Assign permissions from groups to user
     *
     * @param User $user
     * @param array $groupIds
     * @return void
     */
    protected function assignGroupPermissions(User $user, array $groupIds): void
    {
        // Get all permissions from the assigned groups
        $permissionIds = DB::table('t_group_permission')
            ->whereIn('group_id', $groupIds)
            ->pluck('permission_id')
            ->unique()
            ->toArray();

        if (!empty($permissionIds)) {
            // Insert permissions for the user
            $insertData = array_map(function ($permissionId) use ($user) {
                return [
                    'user_id' => $user->id,
                    'permission_id' => $permissionId,
                ];
            }, $permissionIds);

            DB::table('t_user_permission')->insert($insertData);
        }
    }

    /**
     * Update user
     *
     * @param int $id
     * @param array $data
     * @return User
     */
    public function update(int $id, array $data): User
    {
        $user = User::findOrFail($id);
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Update user with all assignments (groups, functions, profiles, etc.)
     *
     * @param int $id
     * @param array $data
     * @return User
     */
    public function updateWithAssignments(int $id, array $data): User
    {
        // Extract assignment data
        $groupIds = $data['group_ids'] ?? null;
        $functionIds = $data['function_ids'] ?? null;
        $profileIds = $data['profile_ids'] ?? null;
        $teamIds = $data['team_ids'] ?? null;
        $attributionIds = $data['attribution_ids'] ?? null;
        $permissionIds = $data['permission_ids'] ?? null;

        // Remove assignment data from user data
        unset($data['group_ids'], $data['function_ids'], $data['profile_ids'], $data['team_ids'], $data['attribution_ids'], $data['permission_ids']);

        // Update the user basic information
        $user = User::findOrFail($id);
        $user->update($data);

        // Sync groups (replace existing)
        if ($groupIds !== null) {
            $user->groups()->sync($groupIds);
        }

        // Sync functions (replace existing)
        if ($functionIds !== null) {
            $user->functions()->sync($functionIds);
        }

        // Sync profiles (replace existing)
        if ($profileIds !== null) {
            $user->profiles()->sync($profileIds);
        }

        // Sync teams (replace existing)
        if ($teamIds !== null) {
            $user->teams()->sync($teamIds);
        }

        // Sync attributions (replace existing)
        if ($attributionIds !== null) {
            $user->attributions()->sync($attributionIds);
        }

        // Sync permissions (replace existing)
        // The frontend is responsible for selecting which permissions to assign
        if ($permissionIds !== null) {
            // Delete all existing permissions for this user
            DB::table('t_user_permission')
                ->where('user_id', $user->id)
                ->delete();

            // Insert new permissions
            if (!empty($permissionIds)) {
                $insertData = array_map(function ($permissionId) use ($user) {
                    return [
                        'user_id' => $user->id,
                        'permission_id' => $permissionId,
                    ];
                }, array_unique($permissionIds));

                DB::table('t_user_permission')->insert($insertData);
            }
        }

        // Invalider le cache
        $this->invalidateUserCache($user->id);

        return $user->fresh();
    }

    /**
     * Delete user (soft delete by setting status to DELETE)
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $user = User::findOrFail($id);
        $result = $user->update(['status' => 'DELETE']);

        if ($result) {
            $this->invalidateUserCache($id);
        }

        return $result;
    }

    /**
     * Get user statistics
     * Utilise le cache Redis si disponible
     *
     * @return array
     */
    public function getStatistics(): array
    {
        if ($this->cacheService) {
            return $this->cacheService->rememberStatistics(function () {
                return $this->fetchStatistics();
            });
        }

        return $this->fetchStatistics();
    }

    /**
     * Récupère les statistiques depuis la base de données
     * OPTIMISÉ: Une seule requête avec COUNT conditionnel au lieu de 4 requêtes
     *
     * @return array
     */
    protected function fetchStatistics(): array
    {
        $stats = DB::table('t_users')
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%')
            ->selectRaw('
                COUNT(*) as total,
                SUM(CASE WHEN is_active = "YES" THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN is_active = "NO" THEN 1 ELSE 0 END) as inactive,
                SUM(CASE WHEN is_locked = "YES" THEN 1 ELSE 0 END) as locked
            ')
            ->first();

        return [
            'total' => (int) ($stats->total ?? 0),
            'active' => (int) ($stats->active ?? 0),
            'inactive' => (int) ($stats->inactive ?? 0),
            'locked' => (int) ($stats->locked ?? 0),
        ];
    }

    /**
     * Get creation options for user form
     * Returns lists of available groups, functions, profiles, teams, etc.
     * Utilise le cache Redis si disponible
     *
     * @return array
     */
    public function getCreationOptions(): array
    {
        if ($this->cacheService) {
            return $this->cacheService->rememberCreationOptions(function () {
                return $this->fetchCreationOptions();
            });
        }

        return $this->fetchCreationOptions();
    }

    /**
     * Récupère les options de création depuis la base de données
     *
     * @return array
     */
    protected function fetchCreationOptions(): array
    {
        $existingTables = $this->getExistingTables();
        $options = [];

        // Get all groups
        $groups = DB::table('t_groups')
            ->where('application', 'admin')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get all group permissions in one query (avoid N+1)
        $groupPermissions = DB::table('t_group_permission')
            ->whereIn('group_id', $groups->pluck('id'))
            ->select('group_id', 'permission_id')
            ->get()
            ->groupBy('group_id');

        // Map groups with their permissions
        $options['groups'] = $groups->map(function ($group) use ($groupPermissions) {
            $permissionIds = $groupPermissions->get($group->id, collect())->pluck('permission_id')->toArray();
            return [
                'id' => $group->id,
                'name' => $group->name,
                'permissions_count' => count($permissionIds),
                'permission_ids' => $permissionIds,
            ];
        })->toArray();

        // Get all permissions grouped by group_id
        $permissions = DB::table('t_permissions')
            ->where('application', 'admin')
            ->select('id', 'name', 'group_id')
            ->orderBy('name')
            ->get();

        $permissionGroups = DB::table('t_permission_group')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($group) use ($permissions) {
                $groupPermissions = $permissions->where('group_id', $group->id)->values();
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'permissions' => $groupPermissions->map(function ($perm) {
                        return [
                            'id' => $perm->id,
                            'name' => $perm->name,
                        ];
                    })->toArray(),
                ];
            })
            ->toArray();

        $options['permission_groups'] = $permissionGroups;

        // Get functions with translations
        if (in_array('t_users_function', $existingTables)) {
            $options['functions'] = DB::table('t_users_function as f')
                ->leftJoin('t_users_function_i18n as i18n', function ($join) {
                    $join->on('f.id', '=', 'i18n.function_id')
                        ->where('i18n.lang', '=', 'fr');
                })
                ->select('f.id', DB::raw('COALESCE(i18n.value, f.name) as name'))
                ->orderBy('name')
                ->get()
                ->toArray();
        } else {
            $options['functions'] = [];
        }

        // Get profiles with translations
        if (in_array('t_users_profile', $existingTables)) {
            $options['profiles'] = DB::table('t_users_profile as p')
                ->leftJoin('t_users_profile_i18n as i18n', function ($join) {
                    $join->on('p.id', '=', 'i18n.profile_id')
                        ->where('i18n.lang', '=', 'fr');
                })
                ->select('p.id', DB::raw('COALESCE(i18n.value, p.name) as name'))
                ->orderBy('name')
                ->get()
                ->toArray();
        } else {
            $options['profiles'] = [];
        }

        // Get teams
        if (in_array('t_users_team', $existingTables)) {
            $options['teams'] = DB::table('t_users_team')
                ->select('id', 'name', 'manager_id')
                ->orderBy('name')
                ->get()
                ->toArray();
        } else {
            $options['teams'] = [];
        }

        // Get attributions with translations
        if (in_array('t_users_attribution', $existingTables)) {
            $options['attributions'] = DB::table('t_users_attribution as a')
                ->leftJoin('t_users_attribution_i18n as i18n', function ($join) {
                    $join->on('a.id', '=', 'i18n.attribution_id')
                        ->where('i18n.lang', '=', 'fr');
                })
                ->select('a.id', DB::raw('COALESCE(i18n.value, a.name) as name'))
                ->orderBy('name')
                ->get()
                ->toArray();
        } else {
            $options['attributions'] = [];
        }

        // Get callcenters
        if (in_array('t_callcenter', $existingTables)) {
            $options['callcenters'] = DB::table('t_callcenter')
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->toArray();
        } else {
            $options['callcenters'] = [];
        }

        return $options;
    }

    // =========================================================================
    // CACHE & SEARCH HELPER METHODS
    // =========================================================================

    /**
     * Invalide le cache d'un utilisateur spécifique
     *
     * @param int $userId
     * @return void
     */
    protected function invalidateUserCache(int $userId): void
    {
        if ($this->cacheService) {
            $this->cacheService->forgetUser($userId);
        }
    }

    /**
     * Invalide tous les caches utilisateurs (listes, statistiques)
     *
     * @return void
     */
    protected function invalidateUserCaches(): void
    {
        if ($this->cacheService) {
            $this->cacheService->invalidateUserLists();
            $this->cacheService->forgetStatistics();
        }
    }

    /** Retourne les diagnostics du cache et de la recherche */
    public function getServicesDiagnostics(): array
    {
        return [
            'cache' => $this->cacheService?->getDiagnostics() ?? ['available' => false],
            'search' => ['available' => SearchManager::available()],
        ];
    }
}
