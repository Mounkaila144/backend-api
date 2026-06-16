'use client';

import { useState, useEffect, useCallback } from 'react';

import type { AxiosError } from 'axios';

import { siteService } from '../services/siteService';
import type {
  SiteListItem,
  SiteFilters,
  SitePaginationMeta,
} from '../../types/site.types';

interface UseSitesReturn {
  sites: SiteListItem[];
  meta: SitePaginationMeta | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  loadStatistics: () => Promise<void>;
}

export const useSites = (initialFilters?: SiteFilters): UseSitesReturn => {
  const [sites, setSites] = useState<SiteListItem[]>([]);
  const [meta, setMeta] = useState<SitePaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<SiteFilters | undefined>(initialFilters);

  const loadSites = useCallback(async (customFilters?: SiteFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await siteService.getSites(customFilters || filters);

      setSites(response.data);
      setMeta(response.meta);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message || 'Failed to load sites';

      setError(errorMessage);
      console.error('Failed to load sites:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await siteService.getStatistics();

      setStatistics(stats);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  }, []);

  useEffect(() => {
    loadSites();
    loadStatistics();
  }, [loadSites, loadStatistics]);

  const refresh = useCallback(async () => {
    await loadSites();
    await loadStatistics();
  }, [loadSites, loadStatistics]);

  return {
    sites,
    meta,
    statistics,
    isLoading,
    error,
    refresh,
    loadStatistics,
  };
};
