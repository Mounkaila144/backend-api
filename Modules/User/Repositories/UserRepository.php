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
        $query = User::query()
            ->select([
                't_users.*',
                // Aggregate functions and subqueries for additional data
                DB::raw('(SELECT GROUP_CONCAT(t_groups.name ORDER BY t_groups.name ASC)
                         FROM t_user_group
                         LEFT JOIN t_groups ON t_user_group.group_id = t_groups.id
                         WHERE t_user_group.user_id = t_users.id
                         AND t_groups.name != "superadmin"
                         ) as groups_list'),
            ])
            ->where('application', 'admin')
            ->where('username', 'NOT LIKE', 'superadmin%');

        // Apply filters
        $this->applyFilters($query, $filters);

        // Group by user id to avoid duplicates from joins
        $query->groupBy('t_users.id');

        // Apply sorting
        $this->applySorting($query, $filters);

        return $query->paginate($perPage);
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
        return User::with(['groups', 'creator', 'unlocker'])
            ->findOrFail($id);
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
}
