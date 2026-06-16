// ============================================================================
// CustomersContracts Module - Contracts List Hook
// ============================================================================
// Custom hook for managing contracts list, filters, pagination, and CRUD operations
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';

import { contractsService } from '../services/contractsService';
import type {
  CustomerContract,
  ContractFilters,
  ContractStatsResponse,
  CreateContractData,
  UpdateContractData,
} from '../../types';

interface UseContractsReturn {

  // Data
  contracts: CustomerContract[];
  stats: ContractStatsResponse['data'] | null;

  // Loading & Error States
  loading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  total: number;
  perPage: number;

  // Filters
  filters: ContractFilters;

  // Permission-based field visibility (from backend meta.permitted_fields)
  permittedFields: Set<string>;

  // Actions
  setCurrentPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setFilters: (filters: ContractFilters) => void;
  updateFilter: (key: keyof ContractFilters, value: any) => void;
  clearFilters: () => void;
  refreshContracts: () => Promise<void>;
  deleteContract: (id: number) => Promise<boolean>;
  createContract: (data: CreateContractData) => Promise<void>;
  updateContract: (id: number, data: UpdateContractData) => Promise<void>;
  getContract: (id: number) => Promise<CustomerContract | null>;
}

const defaultFilters: ContractFilters = {
  status: 'ACTIVE',
  sort_by: 'created_at',
  sort_order: 'desc',
  per_page: 15,
  page: 1,
  with_relations: true,
};

/**
 * Custom hook for contracts management
 * Handles fetching, filtering, pagination, and CRUD operations
 */
export const useContracts = (initialFilters?: Partial<ContractFilters>): UseContractsReturn => {
  // State
  const [contracts, setContracts] = useState<CustomerContract[]>([]);
  const [stats, setStats] = useState<ContractStatsResponse['data'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [perPage, setPerPage] = useState<number>(15);

  // Permitted fields from backend (API-driven column visibility)
  const [permittedFields, setPermittedFields] = useState<Set<string>>(new Set());

  // Filters State
  const [filters, setFilters] = useState<ContractFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  /**
   * Load contracts from API
   */
  const loadContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await contractsService.getContracts({
        ...filters,
        page: currentPage,
        per_page: perPage,
      });

      if (response.success) {
        // Handle response with nested data.contracts structure
        let contractsData: CustomerContract[] = [];

        if (response.data && typeof response.data === 'object' && 'contracts' in response.data) {
          // Current backend format: { success: true, data: { contracts: [...] } }
          contractsData = response.data.contracts;
        } else if (Array.isArray(response.data)) {
          // Fallback: data is directly an array
          contractsData = response.data;
        }

        setContracts(contractsData);

        // Handle pagination from meta or data.pagination
        const paginationMeta = response.meta || response.data?.pagination;

        if (paginationMeta) {
          setTotalPages(paginationMeta.last_page);
          setTotal(paginationMeta.total);

          // Extract permitted fields from backend (single source of truth)
          if (Array.isArray(paginationMeta.permitted_fields)) {
            setPermittedFields(new Set(paginationMeta.permitted_fields));
          }
        }
      } else {
        setError('Failed to load contracts');
        setContracts([]);
      }
    } catch (err) {
      console.error('Error loading contracts:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading contracts');
      setContracts([]); // Ensure contracts is always an array on error
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, perPage]);

  /**
   * Load statistics
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await contractsService.getStatistics();

      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading contract statistics:', err);

      // Don't set error state for stats, as it's not critical
    }
  }, []);

  /**
   * Update a single filter value
   */
  const updateFilter = useCallback((key: keyof ContractFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  /**
   * Clear all filters (except essential ones)
   */
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setCurrentPage(1);
  }, []);

  /**
   * Manually refresh contracts
   */
  const refreshContracts = useCallback(async () => {
    await loadContracts();
  }, [loadContracts]);

  /**
   * Delete a contract
   */
  const deleteContract = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const confirmed = window.confirm(
          'Are you sure you want to delete this contract? This action cannot be undone.'
        );

        if (!confirmed) {
          return false;
        }

        const response = await contractsService.deleteContract(id);

        if (response.success) {
          // Reload contracts after deletion
          await loadContracts();
          
return true;
        }

        return false;
      } catch (err) {
        console.error(`Error deleting contract ${id}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to delete contract');
        
return false;
      }
    },
    [loadContracts]
  );

  /**
   * Create a new contract
   */
  const createContract = useCallback(
    async (data: CreateContractData): Promise<void> => {
      try {
        const response = await contractsService.createContract(data);

        if (response.success) {
          // Reload contracts after creation
          await loadContracts();
        } else {
          throw new Error('Failed to create contract');
        }
      } catch (err) {
        console.error('Error creating contract:', err);
        throw err;
      }
    },
    [loadContracts]
  );

  /**
   * Update an existing contract
   */
  const updateContract = useCallback(
    async (id: number, data: UpdateContractData): Promise<void> => {
      try {
        const response = await contractsService.updateContract(id, data);

        if (response.success) {
          // Reload contracts after update
          await loadContracts();
        } else {
          throw new Error('Failed to update contract');
        }
      } catch (err) {
        console.error(`Error updating contract ${id}:`, err);
        throw err;
      }
    },
    [loadContracts]
  );

  /**
   * Get a single contract by ID with full details
   */
  const getContract = useCallback(
    async (id: number): Promise<CustomerContract | null> => {
      try {
        const response = await contractsService.getContract(id);

        if (response.success) {
          return response.data;
        } else {
          throw new Error('Failed to fetch contract');
        }
      } catch (err) {
        console.error(`Error fetching contract ${id}:`, err);
        
return null;
      }
    },
    []
  );

  /**
   * Update perPage and reset to first page
   */
  const handleSetPerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage);
    setCurrentPage(1);
  }, []);

  // Load contracts when dependencies change
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    // Data
    contracts,
    stats,

    // Loading & Error
    loading,
    error,

    // Pagination
    currentPage,
    totalPages,
    total,
    perPage,

    // Filters
    filters,

    // Permissions (API-driven)
    permittedFields,

    // Actions
    setCurrentPage,
    setPerPage: handleSetPerPage,
    setFilters,
    updateFilter,
    clearFilters,
    refreshContracts,
    deleteContract,
    createContract,
    updateContract,
    getContract,
  };
};
