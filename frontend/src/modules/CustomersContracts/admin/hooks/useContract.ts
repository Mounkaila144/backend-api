// ============================================================================
// CustomersContracts Module - Single Contract Hook
// ============================================================================
// Custom hook for managing a single contract (view, edit, history)
// ============================================================================

'use client';

import { useState, useEffect, useCallback } from 'react';

import { contractsService } from '../services/contractsService';
import type {
  CustomerContract,
  ContractHistory,
  UpdateContractData,
} from '../../types';

interface UseContractReturn {

  // Data
  contract: CustomerContract | null;
  history: ContractHistory[];

  // Loading & Error States
  loading: boolean;
  error: string | null;
  historyLoading: boolean;

  // Actions
  refreshContract: () => Promise<void>;
  updateContract: (data: UpdateContractData) => Promise<boolean>;
  loadHistory: () => Promise<void>;
}

/**
 * Custom hook for single contract management
 * Handles fetching contract details, history, and updates
 */
export const useContract = (contractId: number | null): UseContractReturn => {
  // State
  const [contract, setContract] = useState<CustomerContract | null>(null);
  const [history, setHistory] = useState<ContractHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  /**
   * Load contract details
   */
  const loadContract = useCallback(async () => {
    if (!contractId) {
      setLoading(false);
      
return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await contractsService.getContract(contractId);

      if (response.success) {
        setContract(response.data);
      } else {
        setError('Failed to load contract');
      }
    } catch (err) {
      console.error(`Error loading contract ${contractId}:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred while loading contract');
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  /**
   * Load contract history
   */
  const loadHistory = useCallback(async () => {
    if (!contractId) return;

    try {
      setHistoryLoading(true);

      const response = await contractsService.getContractHistory(contractId);

      if (response.success) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error(`Error loading contract ${contractId} history:`, err);

      // Don't set error state for history, as it's not critical
    } finally {
      setHistoryLoading(false);
    }
  }, [contractId]);

  /**
   * Manually refresh contract
   */
  const refreshContract = useCallback(async () => {
    await loadContract();
  }, [loadContract]);

  /**
   * Update contract
   */
  const updateContract = useCallback(
    async (data: UpdateContractData): Promise<boolean> => {
      if (!contractId) return false;

      try {
        const response = await contractsService.updateContract(contractId, data);

        if (response.success) {
          setContract(response.data);

          // Reload history after update
          await loadHistory();
          
return true;
        }

        return false;
      } catch (err) {
        console.error(`Error updating contract ${contractId}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to update contract');
        
return false;
      }
    },
    [contractId, loadHistory]
  );

  // Load contract when contractId changes
  useEffect(() => {
    loadContract();
  }, [loadContract]);

  return {
    // Data
    contract,
    history,

    // Loading & Error
    loading,
    error,
    historyLoading,

    // Actions
    refreshContract,
    updateContract,
    loadHistory,
  };
};
