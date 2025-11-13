<?php

if (!function_exists('hasPermission')) {
    /**
     * Check if current authenticated user has permission
     *
     * @param string|array $permissions
     * @param bool $requireAll
     * @return bool
     */
    function hasPermission($permissions, bool $requireAll = false): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        return $user->hasPermission($permissions, $requireAll);
    }
}

if (!function_exists('hasCredential')) {
    /**
     * Symfony 1 compatibility: Check if current user has credential
     *
     * @param string|array $credentials
     * @param bool $useAnd
     * @return bool
     */
    function hasCredential($credentials, bool $useAnd = true): bool
    {
        return hasPermission($credentials, $useAnd);
    }
}

if (!function_exists('hasAnyPermission')) {
    /**
     * Check if current user has ANY of the given permissions
     *
     * @param array $permissions
     * @return bool
     */
    function hasAnyPermission(array $permissions): bool
    {
        return hasPermission($permissions, false);
    }
}

if (!function_exists('hasAllPermissions')) {
    /**
     * Check if current user has ALL of the given permissions
     *
     * @param array $permissions
     * @return bool
     */
    function hasAllPermissions(array $permissions): bool
    {
        return hasPermission($permissions, true);
    }
}

if (!function_exists('isSuperadmin')) {
    /**
     * Check if current user is superadmin
     *
     * @return bool
     */
    function isSuperadmin(): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        return $user->isSuperadmin();
    }
}

if (!function_exists('isAdmin')) {
    /**
     * Check if current user is admin or superadmin
     *
     * @return bool
     */
    function isAdmin(): bool
    {
        $user = auth()->user();

        if (!$user) {
            return false;
        }

        return $user->isAdmin();
    }
}

if (!function_exists('userPermissions')) {
    /**
     * Get all permissions for current user
     *
     * @return array
     */
    function userPermissions(): array
    {
        $user = auth()->user();

        if (!$user) {
            return [];
        }

        return $user->getPermissionNames();
    }
}