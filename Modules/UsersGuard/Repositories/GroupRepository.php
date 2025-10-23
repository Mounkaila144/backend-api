<?php

namespace Modules\UsersGuard\Repositories;

use Modules\UsersGuard\Entities\Group;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class GroupRepository
{
    protected $model;

    public function __construct(Group $model)
    {
        $this->model = $model;
    }

    /**
     * Get paginated groups with filters
     * Utilise automatiquement la base TENANT
     */
    public function getPaginated($filters = [], $perPage = 50)
    {
        $query = $this->model->query();

        // Filter by application
        if (isset($filters['application'])) {
            $query->where('application', $filters['application']);
        }

        // Search by name
        if (isset($filters['search'])) {
            $query->where('name', 'LIKE', "%{$filters['search']}%");
        }

        // Active only
        if (isset($filters['active'])) {
            $query->where('is_active', 1);
        }

        // Eager load relations
        $query->with(['permissions']);

        return $query->paginate($perPage);
    }

    /**
     * Find group with all relations
     */
    public function findWithRelations($id)
    {
        return $this->model
            ->with(['users', 'permissions'])
            ->findOrFail($id);
    }

    /**
     * Create new group
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * Update group
     */
    public function update($id, array $data)
    {
        $group = $this->model->findOrFail($id);
        $group->update($data);

        return $group->fresh();
    }

    /**
     * Delete group
     */
    public function delete($id)
    {
        $group = $this->model->findOrFail($id);
        return $group->delete();
    }

    /**
     * Sync permissions to group
     */
    public function syncPermissions($groupId, array $permissionIds)
    {
        $group = $this->model->findOrFail($groupId);
        $group->permissions()->sync($permissionIds);

        // Clear cache (tenant-specific)
        $tenantId = tenancy()->tenant?->site_id;
        Cache::forget("tenant.{$tenantId}.group.{$groupId}.permissions");

        return $group->load('permissions');
    }
}
