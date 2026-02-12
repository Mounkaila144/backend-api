<?php

namespace App\Traits;

use Illuminate\Support\Collection;
use Modules\UsersGuard\Entities\Permission;

/**
 * Trait HasPermissions
 *
 * Provides permission checking capabilities to User models
 * Similar to Symfony 1's hasCredential() method
 *
 * @property Collection $groups
 * @property Collection $permissions
 */
trait HasPermissions
{
    /**
     * Cached permissions collection for this user
     */
    protected ?Collection $cachedPermissions = null;

    /**
     * Indexed permission names for O(1) lookup: ['perm_name' => true, ...]
     */
    protected ?array $cachedPermissionIndex = null;

    /**
     * Indexed group names for O(1) lookup: ['group_name' => true, ...]
     */
    protected ?array $cachedGroupIndex = null;

    /**
     * Cached superadmin status (null = not checked yet)
     */
    protected ?bool $cachedIsSuperadmin = null;

    /**
     * Check if user has specific credential(s) - Symfony 1 compatible method
     *
     * This is the MAIN method from Symfony 1. It checks BOTH groups AND permissions.
     * Supports OR and AND logic like: [['perm1', 'perm2']] for OR
     *
     * @param string|array $credentials Credential name(s) to check (groups or permissions)
     * @param bool $useAnd If true, requires ALL credentials (AND). If false, requires ANY (OR)
     * @return bool
     *
     * @example
     * // Check single credential (group or permission)
     * $user->hasCredential('users.edit')
     * $user->hasCredential('admin')  // checks group
     *
     * // Check multiple credentials with OR logic (Symfony 1 style)
     * $user->hasCredential([['superadmin', 'admin', 'users.edit']])
     *
     * // Check multiple credentials with AND logic
     * $user->hasCredential(['users.view', 'users.edit'], true)
     */
    public function hasCredential($credentials, bool $useAnd = false): bool
    {
        // Superadmin has all credentials
        if ($this->isSuperadmin()) {
            return true;
        }

        // Handle Symfony-style nested arrays: [['perm1', 'perm2']] = OR logic
        if (is_array($credentials) && isset($credentials[0]) && is_array($credentials[0])) {
            foreach ($credentials as $credentialGroup) {
                if (is_array($credentialGroup)) {
                    foreach ($credentialGroup as $credential) {
                        if ($this->checkSingleCredential($credential)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        // Handle array of credentials
        if (is_array($credentials)) {
            if ($useAnd) {
                foreach ($credentials as $credential) {
                    if (!$this->checkSingleCredential($credential)) {
                        return false;
                    }
                }
                return true;
            } else {
                foreach ($credentials as $credential) {
                    if ($this->checkSingleCredential($credential)) {
                        return true;
                    }
                }
                return false;
            }
        }

        // Single credential check
        return $this->checkSingleCredential($credentials);
    }

    /**
     * Check if user has specific group(s) - Symfony 1 compatible method
     *
     * @param string|array $groups Group name(s) to check
     * @return bool
     *
     * @example
     * // Check single group
     * $user->hasGroups('admin')
     *
     * // Check multiple groups (OR logic)
     * $user->hasGroups(['admin', 'sales_manager'])
     */
    public function hasGroups($groups): bool
    {
        if (is_array($groups)) {
            foreach ($groups as $group) {
                if ($this->checkSingleGroup($group)) {
                    return true;
                }
            }
            return false;
        }

        return $this->checkSingleGroup($groups);
    }

    /**
     * Check a single credential (group OR permission) - O(1) lookup
     *
     * In Symfony 1, hasCredential() checks BOTH permissions AND groups.
     */
    protected function checkSingleCredential(string $credential): bool
    {
        // O(1) group check
        if ($this->checkSingleGroup($credential)) {
            return true;
        }

        // O(1) permission check via indexed array
        return isset($this->getPermissionIndex()[$credential]);
    }

    /**
     * Check a single group membership - O(1) lookup
     */
    protected function checkSingleGroup(string $groupName): bool
    {
        return isset($this->getGroupIndex()[$groupName]);
    }

    /**
     * Get indexed permission names for O(1) lookup
     * Lazy-built and cached per request
     *
     * @return array<string, true>
     */
    protected function getPermissionIndex(): array
    {
        if ($this->cachedPermissionIndex !== null) {
            return $this->cachedPermissionIndex;
        }

        $this->cachedPermissionIndex = array_flip(
            $this->getAllPermissions()->pluck('name')->toArray()
        );

        return $this->cachedPermissionIndex;
    }

    /**
     * Get indexed group names for O(1) lookup
     * Lazy-built and cached per request
     *
     * @return array<string, true>
     */
    protected function getGroupIndex(): array
    {
        if ($this->cachedGroupIndex !== null) {
            return $this->cachedGroupIndex;
        }

        // Ensure groups are loaded
        if (!$this->relationLoaded('groups')) {
            $this->load('groups');
        }

        $this->cachedGroupIndex = array_flip(
            $this->groups->pluck('name')->toArray()
        );

        return $this->cachedGroupIndex;
    }

    /**
     * Get all permissions for this user (from groups and direct permissions)
     * Results are cached per request
     */
    public function getAllPermissions(): Collection
    {
        if ($this->cachedPermissions !== null) {
            return $this->cachedPermissions;
        }

        $permissions = collect();

        // Ensure groups + their permissions are loaded
        if (!$this->relationLoaded('groups')) {
            $this->load(['groups.permissions']);
        } else {
            $needsPermissions = false;
            foreach ($this->groups as $group) {
                if (!$group->relationLoaded('permissions')) {
                    $needsPermissions = true;
                    break;
                }
            }
            if ($needsPermissions) {
                $this->load('groups.permissions');
            }
        }

        // Merge all permissions from groups
        foreach ($this->groups as $group) {
            if ($group->relationLoaded('permissions')) {
                $permissions = $permissions->merge($group->permissions);
            }
        }

        // Get direct permissions assigned to user
        if (!$this->relationLoaded('permissions')) {
            $this->load('permissions');
        }
        $permissions = $permissions->merge($this->permissions);

        // Remove duplicates by ID
        $this->cachedPermissions = $permissions->unique('id');

        return $this->cachedPermissions;
    }

    /**
     * Get permission names as array
     */
    public function getPermissionNames(): array
    {
        return $this->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Check if user is superadmin - cached per request
     */
    public function isSuperadmin(): bool
    {
        if ($this->cachedIsSuperadmin !== null) {
            return $this->cachedIsSuperadmin;
        }

        $this->cachedIsSuperadmin = isset($this->getGroupIndex()['superadmin']);

        return $this->cachedIsSuperadmin;
    }

    /**
     * Check if user is admin - cached per request
     */
    public function isAdmin(): bool
    {
        if ($this->isSuperadmin()) {
            return true;
        }

        return isset($this->getGroupIndex()['admin']);
    }

    /**
     * Clear all cached permission/group data
     */
    public function clearPermissionCache(): void
    {
        $this->cachedPermissions = null;
        $this->cachedPermissionIndex = null;
        $this->cachedGroupIndex = null;
        $this->cachedIsSuperadmin = null;
    }

    /**
     * Relation: Direct permissions assigned to user
     */
    public function permissions()
    {
        return $this->belongsToMany(
            Permission::class,
            't_user_permission',
            'user_id',
            'permission_id'
        );
    }

    /**
     * Check if user can perform action on model
     * Laravel's standard authorization method
     */
    public function can($ability, $arguments = []): bool
    {
        // Try Laravel's Gate first
        if (method_exists(parent::class, 'can')) {
            $canViaGate = parent::can($ability, $arguments);
            if ($canViaGate) {
                return true;
            }
        }

        // Fall back to permission check
        return $this->hasPermission($ability);
    }

    /**
     * Sync user permissions (direct permissions)
     *
     * @param array $permissions Array of permission IDs or names
     */
    public function syncPermissions(array $permissions): void
    {
        // Convert permission names to IDs if needed
        $permissionIds = collect($permissions)->map(function ($permission) {
            if (is_numeric($permission)) {
                return $permission;
            }
            // Find by name
            $permModel = Permission::where('name', $permission)->first();
            return $permModel ? $permModel->id : null;
        })->filter()->toArray();

        $this->permissions()->sync($permissionIds);
        $this->clearPermissionCache();
    }

    /**
     * Add a permission to user
     */
    public function givePermissionTo(string $permission): void
    {
        $permModel = Permission::where('name', $permission)->first();
        if ($permModel && !$this->permissions->contains($permModel->id)) {
            $this->permissions()->attach($permModel->id);
            $this->clearPermissionCache();
        }
    }

    /**
     * Remove a permission from user
     */
    public function revokePermissionTo(string $permission): void
    {
        $permModel = Permission::where('name', $permission)->first();
        if ($permModel) {
            $this->permissions()->detach($permModel->id);
            $this->clearPermissionCache();
        }
    }
}
