'use client';

import { useState, useEffect } from 'react';

import { domoprimeReferenceService } from '../services/domoprimeService';

import type { DomoprimeFilterOptions } from '../../types';

const EMPTY_OPTIONS: DomoprimeFilterOptions = {
  energies: [],
  occupations: [],
  layer_types: [],
  pricings: [],
  previous_energies: [],
  classes: [],
  regions: [],
  zones: [],
  sectors: [],
  subvention_types: [],
};

/**
 * Fetches domoprime reference data for dropdown options.
 * Used in ISO form, calculation form, etc.
 */
export function useDomoprimeFilterOptions() {
  const [options, setOptions] = useState<DomoprimeFilterOptions>(EMPTY_OPTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    domoprimeReferenceService
      .getFilterOptions()
      .then(res => {
        if (!cancelled && res.success) {
          setOptions(res.data);
        }
      })
      .catch((err) => {
        console.warn('[useDomoprimeFilterOptions] Failed to load filter options:', err?.message || err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { filterOptions: options, loading };
}
