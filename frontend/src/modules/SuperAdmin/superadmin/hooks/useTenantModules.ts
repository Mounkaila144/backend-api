'use client';

import { useState, useEffect, useCallback } from 'react';

import { moduleService } from '../services/moduleService';
import type { TenantModule } from '../../types/module.types';

/**
 * Interface de retour du hook useTenantModules
 */
interface UseTenantModulesReturn {

  /** Liste des modules du tenant avec leur statut */
  modules: TenantModule[];

  /** Indique si les données sont en cours de chargement */
  loading: boolean;

  /** Erreur survenue lors du chargement */
  error: Error | null;

  /** Fonction pour recharger les modules du tenant */
  refresh: () => Promise<void>;
}

/**
 * Hook personnalisé pour gérer l'état des modules d'un tenant spécifique
 *
 * @param {number} tenantId - ID du tenant
 * @returns {UseTenantModulesReturn} État des modules du tenant et fonction de rafraîchissement
 *
 * @example
 * ```typescript
 * const { modules, loading, error, refresh } = useTenantModules(123);
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Alert severity="error">{error.message}</Alert>;
 *
 * const activeModules = modules.filter(m => m.tenantStatus.isActive);
 * return <ModulesList modules={activeModules} />;
 * ```
 */
export function useTenantModules(tenantId: number): UseTenantModulesReturn {
  const [modules, setModules] = useState<TenantModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Charge ou recharge les modules du tenant depuis l'API
   */
  const refresh = useCallback(async () => {
    // Ne pas charger si tenantId invalide
    if (!tenantId || tenantId <= 0) {
      setError(new Error('ID de tenant invalide'));
      setLoading(false);
      setModules([]);
      
return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await moduleService.getTenantModules(tenantId);

      // S'assurer que data est un tableau
      if (Array.isArray(data)) {
        setModules(data);
      } else {
        console.error('getTenantModules did not return an array:', data);
        setModules([]);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur lors du chargement des modules du tenant');

      setError(error);
      console.error('Error in useTenantModules:', error);
      setModules([]); // Garantir un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Charge les modules au montage et quand le tenantId change
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
