import { createApiClient } from '@/shared/lib/api-client';
import type {
  ActivationRequest,
  ActivationResult,
  ActivationResponse,
} from '../../types/activation.types';

/**
 * Service pour gérer l'activation de modules pour les tenants
 * @class ActivationService
 */
class ActivationService {
  /**
   * Active un module pour un tenant spécifique
   * Lance l'orchestration Saga côté backend
   *
   * @param {ActivationRequest} request - Requête d'activation
   * @returns {Promise<ActivationResult>} Résultat de l'activation avec étapes Saga
   * @throws {Error} En cas d'erreur réseau ou serveur
   *
   * @example
   * ```typescript
   * const result = await activationService.activateModule({
   *   tenantId: 123,
   *   moduleName: 'commerce',
   *   config: {
   *     currency: 'EUR',
   *     paymentMethods: ['card', 'paypal']
   *   }
   * });
   *
   * if (result.success) {
   *   console.log('Module activé avec succès');
   *   console.log('Étapes:', result.steps);
   * } else {
   *   console.error('Échec:', result.error);
   * }
   * ```
   */
  async activateModule(request: ActivationRequest): Promise<ActivationResult> {
    const startTime = Date.now();

    try {
      const { tenantId, moduleName, config } = request;

      console.log(`Activating module "${moduleName}" for tenant ${tenantId}...`, config);

      const client = createApiClient();

      const response = await client.post<ActivationResponse>(
        `/superadmin/sites/${tenantId}/modules/${moduleName}`,
        { config: config || {} }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('Activation response:', response.data);

      // L'API peut retourner différents formats:
      // 1. { success: true, data: {...} } - format standard
      // 2. { message: "...", data: {...} } - format alternatif du backend

      if (response.data) {
        const responseData = response.data as any;

        // Format standard avec success explicite
        if (responseData.success && responseData.data) {
          const result = responseData.data;

          
return {
            ...result,
            duration,
          };
        }

        // Format alternatif: { message, data } sans success explicite
        // On considère que c'est un succès si data.activated_at existe
        if (responseData.data && responseData.data.activated_at) {
          return {
            success: true,
            module: responseData.data.module || moduleName,
            activatedAt: responseData.data.activated_at,
            steps: responseData.data.steps || [],
            duration,
          };
        }

        // Format avec message de succès
        if (responseData.message && responseData.message.toLowerCase().includes('success')) {
          return {
            success: true,
            module: responseData.data?.module || moduleName,
            activatedAt: responseData.data?.activated_at,
            steps: responseData.data?.steps || [],
            duration,
          };
        }
      }

      // Fallback en cas de réponse invalide
      return {
        success: false,
        module: moduleName,
        steps: [],
        error: response.data?.message || 'Réponse API invalide',
        duration,
      };
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error('Error activating module:', error);

      // Essayer d'extraire les étapes Saga de l'erreur si disponibles
      const steps = error.response?.data?.data?.steps || [];

      return {
        success: false,
        module: request.moduleName,
        steps,
        error: error.response?.data?.message || error.message || 'Erreur inconnue',
        duration,
      };
    }
  }

  /**
   * Calcule des statistiques sur les étapes Saga
   * @param {SagaStep[]} steps - Liste des étapes
   * @returns Statistiques (réussies, échouées, rollback, etc.)
   */
  getStepsStatistics(steps: any[]) {
    return {
      total: steps.length,
      completed: steps.filter((s) => s.status === 'completed').length,
      failed: steps.filter((s) => s.status === 'failed').length,
      rolledBack: steps.filter((s) => s.status === 'rolled_back').length,
      pending: steps.filter((s) => s.status === 'pending').length,
      running: steps.filter((s) => s.status === 'running').length,
    };
  }

  /**
   * Calcule la durée d'exécution d'une étape
   * @param {SagaStep} step - Étape Saga
   * @returns Durée en millisecondes ou null
   */
  getStepDuration(step: any): number | null {
    if (!step.startedAt || !step.completedAt) {
      return null;
    }

    try {
      const start = new Date(step.startedAt).getTime();
      const end = new Date(step.completedAt).getTime();

      
return end - start;
    } catch {
      return null;
    }
  }

  /**
   * Formate une durée en millisecondes en texte lisible
   * @param {number} ms - Durée en millisecondes
   * @returns Texte formaté (ex: "2.5s", "145ms")
   */
  formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    }

    const seconds = ms / 1000;

    
return `${seconds.toFixed(1)}s`;
  }
}

/**
 * Instance singleton du service d'activation
 * @constant
 */
export const activationService = new ActivationService();
