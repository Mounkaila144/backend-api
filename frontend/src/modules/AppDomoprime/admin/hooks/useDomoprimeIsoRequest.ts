'use client';

import { useState, useCallback } from 'react';

import { domoprimeIsoService } from '../services/domoprimeService';

import type {
  DomoprimeIsoCustomerRequest,
  CreateIsoCustomerRequestData,
  UpdateIsoCustomerRequestData,
} from '../../types';

/**
 * Hook for managing a single ISO customer request linked to a contract.
 * Handles CRUD operations and auto-save for individual fields.
 */
export function useDomoprimeIsoRequest(contractId?: number) {
  const [isoRequest, setIsoRequest] = useState<DomoprimeIsoCustomerRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchByContract = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await domoprimeIsoService.getByContractId(id);

      if (response.success) {
        setIsoRequest(response.data);
      }
    } catch (err) {
      setError('Failed to load ISO request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data: CreateIsoCustomerRequestData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await domoprimeIsoService.create(data);

      if (response.success) {
        setIsoRequest(response.data);
      }

      return response;
    } catch (err) {
      setError('Failed to create ISO request');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const update = useCallback(
    async (data: UpdateIsoCustomerRequestData) => {
      if (!isoRequest) return;

      setLoading(true);
      setError(null);

      try {
        const response = await domoprimeIsoService.update(isoRequest.id, data);

        if (response.success) {
          setIsoRequest(response.data);
        }

        return response;
      } catch (err) {
        setError('Failed to update ISO request');
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isoRequest]
  );

  const autoSaveField = useCallback(
    async (field: string, value: string | number | null) => {
      if (!contractId) return;

      try {
        const response = await domoprimeIsoService.autoSaveField(contractId, field, value);

        if (response.success) {
          setIsoRequest(response.data);
        }

        return response;
      } catch (err) {
        console.error(`Failed to auto-save field ${field}:`, err);
        throw err;
      }
    },
    [contractId]
  );

  return {
    isoRequest,
    loading,
    error,
    fetchByContract,
    create,
    update,
    autoSaveField,
  };
}
