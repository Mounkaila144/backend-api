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
     * Cached permissions for this user
     */
    protected ?Collection $cachedPermissions = null;

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
            // Nested array means OR logic between groups
            foreach ($credentials as $credentialGroup) {
                if (is_array($credentialGroup)) {
                    // Check if user has ANY credential in this group (OR within group)
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
                // AND logic: must have ALL credentials
                foreach ($credentials as $credential) {
                    if (!$this->checkSingleCredential($credential)) {
                        return false;
                    }
                }
                return true;
            } else {
                // OR logic: must have ANY credential
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
            // OR logic: user must have at least one group
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
     * Check a single credential (group OR permission) - Symfony 1 behavior
     *
     * In Symfony 1, hasCredential() checks BOTH permissions AND groups.
     * This method replicates that behavior for Laravel.
     */
    protected function checkSingleCredential(string $credential): bool
    {
        // First, check if it's a GROUP name
        if ($this->checkSingleGroup($credential)) {
            return true;
        }

        // Then, check if it's a PERMISSION name
        $userPermissions = $this->getAllPermissions();
        return $userPermissions->contains('name', $credential);
    }

    /**
     * Check a single group membership
     */
    protected function checkSingleGroup(string $groupName): bool
    {
        if ($this->relationLoaded('groups')) {
            return $this->groups->contains('name', $groupName);
        }

        // Check in database
        return $this->groups()->where('name', $groupName)->exists();
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

        // Get permissions from user's groups
        if (!$this->relationLoaded('groups')) {
            $this->load(['groups.permissions']);
        } else {
            // Groups are loaded, but check if permissions are loaded
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

        // Now merge all permissions from groups
        foreach ($this->groups as $group) {
            if ($group->relationLoaded('permissions')) {
                $permissions = $permissions->merge($group->permissions);
            }
        }

        // Get direct permissions assigned to user
        if ($this->relationLoaded('permissions')) {
            $permissions = $permissions->merge($this->permissions);
        } else {
            // Load direct permissions if not already loaded
            $this->load('permissions');
            $permissions = $permissions->merge($this->permissions);
        }

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
     * Check if user is superadmin
     */
    public function isSuperadmin(): bool
    {
        // Check if user has superadmin group
        if ($this->relationLoaded('groups')) {
            return $this->groups->contains('name', 'superadmin');
        }

        // Check in database
        return $this->groups()->where('name', 'superadmin')->exists();
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        if ($this->isSuperadmin()) {
            return true;
        }

        if ($this->relationLoaded('groups')) {
            return $this->groups->contains('name', 'admin');
        }

        return $this->groups()->where('name', 'admin')->exists();
    }

    /**
     * Clear cached permissions
     */
    public function clearPermissionCache(): void
    {
        $this->cachedPermissions = null;
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
