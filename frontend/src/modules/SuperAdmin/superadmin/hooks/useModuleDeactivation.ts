'use client';

import { useState, useCallback } from 'react';

import { deactivationService } from '../services/deactivationService';
import type {
  DeactivationRequest,
  DeactivationResult,
  ImpactAnalysis,
} from '../../types/deactivation.types';

/**
 * Hook pour gérer la désactivation de modules
 * Fournit les méthodes d'analyse d'impact et de désactivation
 *
 * @returns {Object} Méthodes et état de la désactivation
 *
 * @example
 * ```tsx
 * function DeactivateButton({ tenantId, moduleName }) {
 *   const {
 *     analyzeImpact,
 *     deactivate,
 *     isAnalyzing,
 *     isDeactivating,
 *     impact,
 *     result,
 *     error,
 *     reset
 *   } = useModuleDeactivation();
 *
 *   const handleClick = async () => {
 *     // D'abord analyser l'impact
 *     const impactResult = await analyzeImpact(tenantId, moduleName);
 *
 *     if (impactResult.canDeactivate) {
 *       // Puis désactiver
 *       await deactivate({
 *         tenantId,
 *         moduleName,
 *         options: { backup: true, force: false }
 *       });
 *     }
 *   };
 *
 *   return (
 *     <Button onClick={handleClick} disabled={isAnalyzing || isDeactivating}>
 *       Désactiver
 *     </Button>
 *   );
 * }
 * ```
 */
export function useModuleDeactivation() {
  // États
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [result, setResult] = useState<DeactivationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Analyse l'impact de la désactivation d'un module
   */
  const analyzeImpact = useCallback(
    async (tenantId: number, moduleName: string): Promise<ImpactAnalysis> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const impactResult = await deactivationService.analyzeImpact(tenantId, moduleName);

        setImpact(impactResult);
        
return impactResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        setError(error);
        throw error;
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  /**
   * Désactive un module
   */
  const deactivate = useCallback(
    async (request: DeactivationRequest): Promise<DeactivationResult> => {
      setIsDeactivating(true);
      setError(null);

      try {
        const deactivationResult = await deactivationService.deactivateModule(request);

        setResult(deactivationResult);
        
return deactivationResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));

        setError(error);

        // Retourner un résultat d'échec
        const failedResult: DeactivationResult = {
          success: false,
          module: request.moduleName,
          steps: [],
          error: error.message,
        };

        setResult(failedResult);
        
return failedResult;
      } finally {
        setIsDeactivating(false);
      }
    },
    []
  );

  /**
   * Réinitialise l'état du hook
   */
  const reset = useCallback(() => {
    setIsAnalyzing(false);
    setIsDeactivating(false);
    setImpact(null);
    setResult(null);
    setError(null);
  }, []);

  /**
   * Réinitialise uniquement le résultat
   */
  const resetResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  /**
   * Réinitialise uniquement l'impact
   */
  const resetImpact = useCallback(() => {
    setImpact(null);
  }, []);

  return {
    // Méthodes
    analyzeImpact,
    deactivate,
    reset,
    resetResult,
    resetImpact,

    // États
    isAnalyzing,
    isDeactivating,
    impact,
    result,
    error,
  };
}
