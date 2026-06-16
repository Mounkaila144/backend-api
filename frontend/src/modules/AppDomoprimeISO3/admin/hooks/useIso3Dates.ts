'use client';

import { useState, useEffect, useCallback } from 'react';

import { iso3SettingsService } from '../services/iso3Service';
import type { Iso3TypeDate, SaveTypeDateData } from '../../types';

export const useIso3Dates = () => {
  const [dates, setDates] = useState<Iso3TypeDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await iso3SettingsService.listDates();

      setDates(response.data);
    } catch (err) {
      console.error('Error fetching ISO3 dates:', err);
      setError('Failed to load dates');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDates = useCallback(async (data: SaveTypeDateData[]) => {
    try {
      setError(null);
      const response = await iso3SettingsService.saveDates(data);

      setDates(response.data);
      
return response;
    } catch (err) {
      console.error('Error saving ISO3 dates:', err);
      setError('Failed to save dates');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  return { dates, loading, error, fetchDates, saveDates };
};
