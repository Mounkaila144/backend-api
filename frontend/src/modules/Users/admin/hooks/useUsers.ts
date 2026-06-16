'use client';

import { useState, useEffect, useCallback } from 'react';

import { useTenant } from '@/shared/lib/tenant-context';
import { userService } from '../services/userService';
import type {
  User,
  UserQueryParams,
  PaginationMeta,
  UserStatistics
} from '../../types/user.types';

/**
 * Custom hook for managing users with server-side pagination
 * Provides state management and data fetching for the user list
 */
export const useUsers = (initialParams?: UserQueryParams) => {
  const { tenantId } = useTenant();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const [pagination, setPagination] = useState<PaginationMeta>({
    current_page: 1,
    total: 0,
    per_page: 10,
    last_page: 1,
    from: null,
    to: null
  });

  const [statistics, setStatistics] = useState<UserStatistics>({
    total_users: 0,
    active_users: 0,
    inactive_users: 0,
    locked_users: 0
  });

  const [params, setParams] = useState<UserQueryParams>(
    initialParams || { page: 1, nbitemsbypage: 10 }
  );

  /**
   * Fetch users from the API with pagination
   */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(tenantId, params);

      setUsers(response.data);
      setPagination(response.meta);
      setStatistics(response.statistics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch users'));
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId, params]);

  /**
   * Refresh the user list
   */
  const refresh = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Update query parameters and refetch
   */
  const updateParams = useCallback((newParams: Partial<UserQueryParams>) => {
    setParams(prev => ({ ...prev, ...newParams }));
  }, []);

  /**
   * Change page
   */
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  /**
   * Change page size
   */
  const setPageSize = useCallback((pageSize: number) => {
    setParams(prev => ({ ...prev, nbitemsbypage: pageSize, page: 1 }));
  }, []);

  /**
   * Update search query
   */
  const setSearch = useCallback((search: string) => {
    setParams(prev => ({
      ...prev,
      page: 1, // Reset to first page on search
      filter: {
        ...prev.filter,
        search: search || undefined
      }
    }));
  }, []);

  /**
   * Delete a user
   */
  const deleteUser = useCallback(
    async (userId: number) => {
      try {
        setLoading(true);
        setError(null);
        await userService.deleteUser(userId, tenantId);

        // Refresh the list after deletion
        await fetchUsers();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete user'));
        console.error('Error deleting user:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantId, fetchUsers]
  );

  // Fetch users on mount and when params change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    pagination,
    statistics,
    params,
    updateParams,
    setPage,
    setPageSize,
    setSearch,
    refresh,
    deleteUser
  };
};
