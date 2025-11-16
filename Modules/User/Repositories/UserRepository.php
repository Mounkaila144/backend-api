<?php

namespace Modules\User\Repositories;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Modules\User\Entities\User;

/**
 * User Repository
 * Handles data access and complex queries for users
 */
class UserRepository
{
    /**
     * Get paginated users with filters
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginated(array $filters = [], int $perPage = 100): LengthAwarePaginator
    {
        $selects = [
            't_users.*',
            // Aggregate functions and subqueries for additional data
            // Only groups_list is guaranteed to exist
            DB::raw('(SELECT GROUP_CONCAT(t_groups.name ORDER BY t_groups.name ASC)
                     FROM t_user_group
                     LEFT JOIN t_groups ON t_user_group.group_id = t_groups.id
                     WHERE t_user_group.user_id = t_users.id
                     AND t_groups.name != "superadmin"
                     ) as groups_list'),
        ];

        // Check which tables exist and add corresponding selects
        $existingTables = $this->getExistingTables();

        if (in_array('t_users_team_users', $existingTables) && in_array('t_users_team', $existingTables)) {
            $selects[] = DB::raw('(SELECT GROUP_CONCAT(t_users_team.name ORDER BY t_users_team.name ASC)
                         FROM t_users_team_users
                         LEFT JOIN t_users_team ON t_users_team_users.team_id = t_users_team.id
                         WHERE t_users_team_users.user_id = t_users.id
                         ) as teams_list');
        }

        if (in_array('t_users_functions', $existingTables) && in_array('t_users_function', $existingTables)) {
            $selects[] = DB::raw('(SELECT GROUP_CONCAT(t_users_function.name ORDER BY t_users_function.name ASC)
                         FROM t_users_functions
                         LEFT JOIN t_users_function ON t_users_functions.function_id = t_users_function.id
                         WHERE t_users_functions.user_id = t_users.id
                         ) as functions_list');
        }

        if (in_array('t_users_profiles', $existingTables) && in_array('t_users_profile', $existingTables)) {
            // Use translated profile names from i18n table (French language)
            $selects[] = DB::raw('(SELECT GROUP_CONCAT(COALESCE(t_users_profile_i18n.value, t_users_profile.name) ORDER BY COALESCE(t_users_profile_i18n.value, t_users_profile.name) ASC)
                         FROM t_users_profiles
                         LEFT JOIN t_users_profile ON t_users_profiles.profile_id = t_users_profile.id
                         LEFT JOIN t_users_profile_i18n ON t_users_profile.id = t_users_profile_i18n.profile_id AND t_users_profile_i18n.lang = "fr"
                         WHERE t_users_profiles.user_id = t_users.id
                         ) as profiles');
        }

        $with = [
            'groups:id,name',
            'creator:id,username,firstname,lastname',
            'unlocker:id,username,firstname,lastname',
            'callcenter:id,name',
        ];

        $query = User::query()
            ->select($selects)
            ->with($with)
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%');

        // Apply filters
        $this->applyFilters($query, $filters);

        // Apply sorting
        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
    }

    /**
     * Get list of existing tables in the current database
     *
     * @return array
     */
    protected function getExistingTables(): array
    {
        static $tables = null;

        if ($tables === null) {
            try {
                $tables = array_map(function ($table) {
                    return array_values((array) $table)[0];
                }, DB::select('SHOW TABLES'));
            } catch (\Exception $e) {
                $tables = [];
            }
        }

        return $tables;
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
        // Search filters
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            if (!empty($search['query'])) {
                $query->search($search['query']);
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

            if (isset($search['id'])) {
                $query->where('t_users.id', $search['id']);
            }
        }

        // Equal filters
        if (!empty($filters['equal'])) {
            $equal = $filters['equal'];

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

            // Group filter
            if (!empty($equal['group_id'])) {
                $query->whereHas('groups', function ($q) use ($equal) {
                    $q->where('t_groups.id', $equal['group_id']);
                });
            }

            // Creator filter
            if (isset($equal['creator_id'])) {
                if ($equal['creator_id'] === 'IS_NULL') {
                    $query->whereNull('creator_id');
                } else {
                    $query->where('creator_id', $equal['creator_id']);
                }
            }

            // Unlocked by filter
            if (isset($equal['unlocked_by'])) {
                if ($equal['unlocked_by'] === 'IS_NULL') {
                    $query->whereNull('unlocked_by');
                } else {
                    $query->where('unlocked_by', $equal['unlocked_by']);
                }
            }

            // Company filter
            if (isset($equal['company_id'])) {
                if ($equal['company_id'] === '') {
                    $query->whereNull('company_id');
                } else {
                    $query->where('company_id', $equal['company_id']);
                }
            }

            // Callcenter filter
            if (isset($equal['callcenter_id'])) {
                if ($equal['callcenter_id'] === '') {
                    $query->whereNull('callcenter_id');
                } else {
                    $query->where('callcenter_id', $equal['callcenter_id']);
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
     *
     * @param int $id
     * @return User
     */
    public function findWithRelations(int $id): User
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
        return $user->update(['status' => 'DELETE']);
    }

    /**
     * Get user statistics
     *
     * @return array
     */
    public function getStatistics(): array
    {
        return [
            'total' => User::where('application', 'admin')->noSuperadmin()->count(),
            'active' => User::where('application', 'admin')->noSuperadmin()->active()->count(),
            'inactive' => User::where('application', 'admin')->noSuperadmin()->where('is_active', 'NO')->count(),
            'locked' => User::where('application', 'admin')->noSuperadmin()->where('is_locked', 'YES')->count(),
        ];
    }

    /**
     * Get creation options for user form
     * Returns lists of available groups, functions, profiles, teams, etc.
     *
     * @return array
     */
    public function getCreationOptions(): array
    {
        $existingTables = $this->getExistingTables();
        $options = [];

        // Get groups with their permissions
        $options['groups'] = DB::table('t_groups')
            ->where('application', 'admin')
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($group) {
                // Get permissions for this group
                $permissionIds = DB::table('t_group_permission')
                    ->where('group_id', $group->id)
                    ->pluck('permission_id')
                    ->toArray();

                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'permissions_count' => count($permissionIds),
                    'permission_ids' => $permissionIds,
                ];
            })
            ->toArray();

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
}
