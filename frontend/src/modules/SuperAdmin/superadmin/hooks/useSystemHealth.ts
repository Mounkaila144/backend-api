'use client';

import { useState, useEffect, useCallback } from 'react';

import { healthService } from '../services/healthService';
import type { SystemHealth, GlobalStats, SystemAlert } from '../../types/health.types';

/**
 * État du hook useSystemHealth
 */
interface UseSystemHealthState {

  /** Données de santé complètes */
  health: SystemHealth | null;

  /** Statistiques globales (raccourci) */
  stats: GlobalStats | null;

  /** Alertes actives (raccourci) */
  alerts: SystemAlert[];

  /** Indicateur de chargement */
  isLoading: boolean;

  /** Erreur éventuelle */
  error: string | null;
}

/**
 * Valeur de retour du hook useSystemHealth
 */
interface UseSystemHealthReturn extends UseSystemHealthState {

  /** Rafraîchit les données */
  refresh: () => Promise<void>;

  /** Marque une alerte comme lue */
  markAlertAsRead: (alertId: string) => void;
}

/**
 * Hook pour gérer l'état de santé du système
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @param {boolean} autoRefresh - Active le rafraîchissement automatique
 * @param {number} refreshInterval - Intervalle de rafraîchissement en ms (défaut: 60000)
 * @returns {UseSystemHealthReturn} État et fonctions de gestion
 *
 * @example
 * ```tsx
 * const { health, stats, alerts, isLoading, refresh } = useSystemHealth(true, 30000);
 *
 * if (isLoading) return <Spinner />;
 *
 * return (
 *   <div>
 *     <p>Statut: {health?.status}</p>
 *     <p>Sites: {stats?.totalSites}</p>
 *   </div>
 * );
 * ```
 */
export function useSystemHealth(
  autoRefresh: boolean = false,
  refreshInterval: number = 60000
): UseSystemHealthReturn {
  const [state, setState] = useState<UseSystemHealthState>({
    health: null,
    stats: null,
    alerts: [],
    isLoading: true,
    error: null,
  });

  /**
   * Charge les données de santé
   */
  const loadHealth = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const health = await healthService.getSystemHealth();

      setState({
        health,
        stats: health.stats,
        alerts: health.alerts.filter((a) => !a.read),
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';

      console.error('Error loading system health:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Rafraîchit les données
   */
  const refresh = useCallback(async () => {
    await healthService.refresh();
    await loadHealth();
  }, [loadHealth]);

  /**
   * Marque une alerte comme lue
   */
  const markAlertAsRead = useCallback((alertId: string) => {
    healthService.markAlertAsRead(alertId);
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((a) => a.id !== alertId),
      health: prev.health
        ? {
            ...prev.health,
            alerts: prev.health.alerts.map((a) =>
              a.id === alertId ? { ...a, read: true } : a
            ),
          }
        : null,
    }));
  }, []);

  // Chargement initial
  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  // Rafraîchissement automatique
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      loadHealth();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, loadHealth]);

  return {
    ...state,
    refresh,
    markAlertAsRead,
  };
}
