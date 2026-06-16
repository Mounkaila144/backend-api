'use client';

import { useState, useCallback } from 'react';

import type { AxiosError } from 'axios';

import { siteService } from '../services/siteService';
import type {
  Site,
  CreateSiteData,
  UpdateSiteData,
  ToggleAvailabilityData,
} from '../../types/site.types';

interface UseSiteReturn {
  site: Site | null;
  isLoading: boolean;
  error: string | null;
  loadSite: (id: number) => Promise<void>;
  createSite: (data: CreateSiteData) => Promise<Site>;
  updateSite: (id: number, data: UpdateSiteData) => Promise<Site>;
  deleteSite: (id: number, deleteDatabase?: boolean) => Promise<void>;
  testConnection: (id: number) => Promise<boolean>;
  updateDatabaseSize: (id: number) => Promise<void>;
  toggleAvailability: (data: ToggleAvailabilityData) => Promise<void>;
}

export const useSite = (): UseSiteReturn => {
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSite = useCallback(async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await siteService.getSite(id);

      setSite(data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load site';

      setError(errorMessage);
      console.error('Failed to load site:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSite = useCallback(async (data: CreateSiteData): Promise<Site> => {
    setIsLoading(true);
    setError(null);

    try {
      const newSite = await siteService.createSite(data);

      setSite(newSite);
      
return newSite;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string; errors?: any }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to create site';

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSite = useCallback(async (id: number, data: UpdateSiteData): Promise<Site> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedSite = await siteService.updateSite(id, data);

      setSite(updatedSite);
      
return updatedSite;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string; errors?: any }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update site';

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSite = useCallback(async (id: number, deleteDatabase: boolean = false): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await siteService.deleteSite(id, deleteDatabase);
      setSite(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to delete site';

      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testConnection = useCallback(async (id: number): Promise<boolean> => {
    setError(null);

    try {
      const result = await siteService.testConnection(id);

      
return result.success;
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to test connection';

      setError(errorMessage);
      
return false;
    }
  }, []);

  const updateDatabaseSize = useCallback(async (id: number): Promise<void> => {
    setError(null);

    try {
      const updatedSite = await siteService.updateDatabaseSize(id);

      setSite(updatedSite);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to update database size';

      setError(errorMessage);
      throw err;
    }
  }, []);

  const toggleAvailability = useCallback(async (data: ToggleAvailabilityData): Promise<void> => {
    setError(null);

    try {
      await siteService.toggleAvailability(data);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to toggle availability';

      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    site,
    isLoading,
    error,
    loadSite,
    createSite,
    updateSite,
    deleteSite,
    testConnection,
    updateDatabaseSize,
    toggleAvailability,
  };
};
