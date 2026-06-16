import { useState, useCallback } from 'react';

import { activationService } from '../services/activationService';
import type { ActivationRequest, ActivationResult } from '../../types/activation.types';

/**
 * Valeur de retour du hook useModuleActivation
 */
export interface UseModuleActivationReturn {

  /** Fonction pour activer un module */
  activate: (request: ActivationRequest) => Promise<ActivationResult>;

  /** Si l'activation est en cours */
  isActivating: boolean;

  /** Résultat de la dernière activation */
  result: ActivationResult | null;

  /** Erreur de la dernière activation */
  error: Error | null;

  /** Réinitialiser l'état */
  reset: () => void;
}

/**
 * Hook personnalisé pour gérer l'activation de modules
 * Gère l'état de l'activation et fournit une interface simple
 *
 * @returns {UseModuleActivationReturn} Interface d'activation
 *
 * @example
 * ```typescript
 * const { activate, isActivating, result, error, reset } = useModuleActivation();
 *
 * const handleActivate = async () => {
 *   const result = await activate({
 *     tenantId: 123,
 *     moduleName: 'commerce',
 *     config: { currency: 'EUR' }
 *   });
 *
 *   if (result.success) {
 *     console.log('Activation réussie!');
 *   }
 * };
 * ```
 */
export function useModuleActivation(): UseModuleActivationReturn {
  const [isActivating, setIsActivating] = useState(false);
  const [result, setResult] = useState<ActivationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Active un module pour un tenant
   */
  const activate = useCallback(async (request: ActivationRequest): Promise<ActivationResult> => {
    try {
      setIsActivating(true);
      setError(null);
      setResult(null);

      const activationResult = await activationService.activateModule(request);

      setResult(activationResult);

      if (!activationResult.success) {
        setError(new Error(activationResult.error || 'Échec de l\'activation'));
      }

      return activationResult;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erreur inconnue');

      setError(errorObj);

      // Retourner un résultat d'échec
      const failedResult: ActivationResult = {
        success: false,
        module: request.moduleName,
        steps: [],
        error: errorObj.message,
      };

      setResult(failedResult);
      
return failedResult;
    } finally {
      setIsActivating(false);
    }
  }, []);

  /**
   * Réinitialise l'état du hook
   */
  const reset = useCallback(() => {
    setIsActivating(false);
    setResult(null);
    setError(null);
  }, []);

  return {
    activate,
    isActivating,
    result,
    error,
    reset,
  };
}
