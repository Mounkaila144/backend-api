'use client';

import { useState, useCallback } from 'react';

import { iso3PricingService } from '../services/iso3Service';
import type {
  Iso3PolluterClassSectorEnergy,
  CreatePolluterSectorEnergyData,
  SaveCoefficientData,
} from '../../types';

export const useIso3PolluterPricing = () => {
  const [pricing, setPricing] = useState<Iso3PolluterClassSectorEnergy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForPolluter = useCallback(async (polluterId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await iso3PricingService.listForPolluter(polluterId);

      setPricing(response.data);
    } catch (err) {
      console.error(`Error fetching pricing for polluter ${polluterId}:`, err);
      setError('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  }, []);

  const createForPolluter = useCallback(async (
    polluterId: number,
    data: CreatePolluterSectorEnergyData
  ) => {
    try {
      setError(null);
      const response = await iso3PricingService.storeForPolluter(polluterId, data);

      setPricing(prev => [...prev, response.data]);
      
return response;
    } catch (err) {
      console.error('Error creating pricing:', err);
      setError('Failed to create pricing');
      throw err;
    }
  }, []);

  const deletePricing = useCallback(async (id: number) => {
    try {
      setError(null);
      await iso3PricingService.destroy(id);
      setPricing(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(`Error deleting pricing ${id}:`, err);
      setError('Failed to delete pricing');
      throw err;
    }
  }, []);

  const updateCoefficients = useCallback(async (
    priceId: number,
    coefficients: SaveCoefficientData[]
  ) => {
    try {
      setError(null);
      const response = await iso3PricingService.updateCoefficients(priceId, coefficients);

      setPricing(prev =>
        prev.map(p => p.id === priceId ? response.data : p)
      );
      
return response;
    } catch (err) {
      console.error(`Error updating coefficients for pricing ${priceId}:`, err);
      setError('Failed to update coefficients');
      throw err;
    }
  }, []);

  const importPricing = useCallback(async (file: File) => {
    try {
      setError(null);
      
return await iso3PricingService.importPricing(file);
    } catch (err) {
      console.error('Error importing pricing:', err);
      setError('Failed to import pricing');
      throw err;
    }
  }, []);

  const importSurfacePricing = useCallback(async (file: File) => {
    try {
      setError(null);
      
return await iso3PricingService.importSurfacePricing(file);
    } catch (err) {
      console.error('Error importing surface pricing:', err);
      setError('Failed to import surface pricing');
      throw err;
    }
  }, []);

  return {
    pricing,
    loading,
    error,
    fetchForPolluter,
    createForPolluter,
    deletePricing,
    updateCoefficients,
    importPricing,
    importSurfacePricing,
  };
};
