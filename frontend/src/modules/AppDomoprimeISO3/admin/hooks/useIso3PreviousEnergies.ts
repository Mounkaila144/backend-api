'use client';

import { useState, useEffect, useCallback } from 'react';

import { iso3PreviousEnergyService } from '../services/iso3Service';
import type {
  Iso3PreviousEnergy,
  CreatePreviousEnergyData,
  UpdatePreviousEnergyData,
} from '../../types';

export const useIso3PreviousEnergies = () => {
  const [previousEnergies, setPreviousEnergies] = useState<Iso3PreviousEnergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreviousEnergies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await iso3PreviousEnergyService.list();

      setPreviousEnergies(response.data);
    } catch (err) {
      console.error('Error fetching previous energies:', err);
      setError('Failed to load previous energies');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPreviousEnergy = useCallback(async (data: CreatePreviousEnergyData) => {
    try {
      setError(null);
      const response = await iso3PreviousEnergyService.store(data);

      setPreviousEnergies(prev => [...prev, response.data]);
      
return response;
    } catch (err) {
      console.error('Error creating previous energy:', err);
      setError('Failed to create previous energy');
      throw err;
    }
  }, []);

  const updatePreviousEnergy = useCallback(async (id: number, data: UpdatePreviousEnergyData) => {
    try {
      setError(null);
      const response = await iso3PreviousEnergyService.update(id, data);

      setPreviousEnergies(prev =>
        prev.map(pe => pe.id === id ? response.data : pe)
      );
      
return response;
    } catch (err) {
      console.error(`Error updating previous energy ${id}:`, err);
      setError('Failed to update previous energy');
      throw err;
    }
  }, []);

  const deletePreviousEnergy = useCallback(async (id: number) => {
    try {
      setError(null);
      await iso3PreviousEnergyService.destroy(id);
      setPreviousEnergies(prev => prev.filter(pe => pe.id !== id));
    } catch (err) {
      console.error(`Error deleting previous energy ${id}:`, err);
      setError('Failed to delete previous energy');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchPreviousEnergies();
  }, [fetchPreviousEnergies]);

  return {
    previousEnergies,
    loading,
    error,
    fetchPreviousEnergies,
    createPreviousEnergy,
    updatePreviousEnergy,
    deletePreviousEnergy,
  };
};
