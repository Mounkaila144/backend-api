'use client';

import { useState, useCallback, useEffect } from 'react';

import { serviceConfigService } from '../services/serviceConfigService';
import {
  SERVICE_EDITABLE,
} from '../../types/service-config.types';
import type {
  ServiceType,
  ServiceConfig,
  TestResult,
} from '../../types/service-config.types';

/**
 * Interface pour le retour du hook useServiceConfig
 */
export interface UseServiceConfigReturn<T = ServiceConfig> {

  /** Configuration actuelle du service */
  config: T | null;

  /** Indique si la configuration est en cours de chargement */
  isLoading: boolean;

  /** Erreur de chargement */
  error: string | null;

  /** Fonction pour sauvegarder la configuration */
  save: (data: Partial<T>) => Promise<boolean>;

  /** Indique si la sauvegarde est en cours */
  isSaving: boolean;

  /** Fonction pour tester la connexion (utilise la config sauvegardée) */
  test: () => Promise<void>;

  /** Indique si le test est en cours */
  isTesting: boolean;

  /** Résultat du dernier test */
  testResult: TestResult | null;

  /** Fonction pour recharger la configuration */
  refresh: () => Promise<void>;

  /** Indique si le service est modifiable */
  isEditable: boolean;

  /** Note explicative (pour les configs read-only) */
  note: string | null;
}

/**
 * Hook générique pour gérer la configuration d'un service
 * @param service - Type de service à configurer
 * @returns État et fonctions de gestion de la configuration
 *
 * @example
 * ```tsx
 * const { config, isLoading, save, test, testResult, isEditable } = useServiceConfig('s3');
 *
 * // Sauvegarder si modifiable
 * if (isEditable) {
 *   await save({ bucket: 'new-bucket' });
 * }
 *
 * // Tester la connexion (utilise la config sauvegardée en base)
 * await test();
 * ```
 */
export function useServiceConfig<T = ServiceConfig>(
  service: ServiceType
): UseServiceConfigReturn<T> {
  // État de la configuration
  const [config, setConfig] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  // État de la sauvegarde
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // État du test
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Déterminer si le service est modifiable (tous les services sont maintenant modifiables)
  const isEditable = SERVICE_EDITABLE[service] ?? false;

  /**
   * Charger la configuration
   */
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await serviceConfigService.getConfig<T>(service);

      setConfig(response.data);
      setNote(response.note || null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur de chargement';

      setError(errorMessage);
      console.error(`Failed to load ${service} config:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  /**
   * Sauvegarder la configuration
   */
  const save = useCallback(
    async (data: Partial<T>): Promise<boolean> => {
      if (!isEditable) {
        setError('Ce service ne peut pas être modifié (configuration via .env)');
        
return false;
      }

      setIsSaving(true);
      setError(null);

      try {
        const response = await serviceConfigService.updateConfig<T>(service, data);

        setConfig(response.data);
        
return true;
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors
            ? Object.values(err.response.data.errors).flat().join(', ')
            : err.message || 'Erreur de sauvegarde';

        setError(errorMessage);
        console.error(`Failed to save ${service} config:`, err);
        
return false;
      } finally {
        setIsSaving(false);
      }
    },
    [service, isEditable]
  );

  /**
   * Tester la connexion (utilise la config sauvegardée en base)
   */
  const test = useCallback(
    async (): Promise<void> => {
      setIsTesting(true);
      setTestResult(null);

      try {
        const result = await serviceConfigService.testConnection(service);

        setTestResult(result);
      } catch (err: any) {
        // Le service retourne déjà un résultat d'erreur formaté
        console.error(`Failed to test ${service} connection:`, err);
      } finally {
        setIsTesting(false);
      }
    },
    [service]
  );

  /**
   * Recharger la configuration
   */
  const refresh = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Charger la configuration au montage
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    save,
    isSaving,
    test,
    isTesting,
    testResult,
    refresh,
    isEditable,
    note,
  };
}
