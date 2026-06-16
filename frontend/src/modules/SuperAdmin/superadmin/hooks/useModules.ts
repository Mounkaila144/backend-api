'use client';

import { useState, useEffect, useCallback } from 'react';

import { moduleService } from '../services/moduleService';
import type { Module } from '../../types/module.types';

/**
 * Interface de retour du hook useModules
 */
interface UseModulesReturn {

  /** Liste des modules chargés */
  modules: Module[];

  /** Indique si les données sont en cours de chargement */
  loading: boolean;

  /** Erreur survenue lors du chargement */
  error: Error | null;

  /** Fonction pour recharger les modules */
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer l'état des modules
 *
 * @returns {UseModulesReturn} État des modules et fonction de rafraîchissement
 *
 * @example
 * ```typescript
 * const { modules, loading, error, refresh } = useModules();
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Alert severity="error">{error.message}</Alert>;
 * return <ModulesList modules={modules} />;
 * ```
 */
export function useModules(): UseModulesReturn {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Charge ou recharge les modules depuis l'API
   */
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await moduleService.getAvailableModules();

      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setModules(data);
      } else {
        console.error('getAvailableModules did not return an array:', data);
        setModules([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement des modules');

      setError(error);
      console.error('Error in useModules:', error);
      setModules([]); // Garantir un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  // Charge les modules au montage du composant
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    modules,
    loading,
    error,
    refresh,
  };
}
