import { createApiClient } from '@/shared/lib/api-client';
import type {
  DeactivationRequest,
  DeactivationResult,
  DeactivationResponse,
  ImpactAnalysis,
  ImpactAnalysisResponse,
} from '../../types/deactivation.types';

/**
 * Service pour gérer la désactivation de modules pour les tenants
 * @class DeactivationService
 */
class DeactivationService {
  /**
   * Analyse l'impact de la désactivation d'un module
   * Permet de savoir si la désactivation est possible et quelles données seront affectées
   *
   * @param {number} tenantId - ID du tenant
   * @param {string} moduleName - Nom du module à analyser
   * @returns {Promise<ImpactAnalysis>} Analyse d'impact
   *
   * @example
   * ```typescript
   * const impact = await deactivationService.analyzeImpact(123, 'Customer');
   *
   * if (!impact.canDeactivate) {
   *   console.log('Blockers:', impact.blockers);
   * }
   * ```
   */
  async analyzeImpact(tenantId: number, moduleName: string): Promise<ImpactAnalysis> {
    try {
      console.log(`Analyzing impact for deactivating "${moduleName}" from tenant ${tenantId}...`);

      const client = createApiClient();

      const response = await client.get<ImpactAnalysisResponse>(
        `/superadmin/sites/${tenantId}/modules/${moduleName}/impact`
      );

      console.log('Impact analysis response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      }

      // Fallback si réponse invalide - impact par défaut permissif
      return {
        canDeactivate: true,
        blockers: [],
        warnings: ['Impossible de récupérer l\'analyse d\'impact complète'],
        affectedData: {
          tables: [],
          estimatedRows: 0,
        },
        dependentModules: [],
        recommendations: ['Créer un backup avant la désactivation'],
      };
    } catch (error: any) {
      console.error('Error analyzing impact:', error);

      // En cas d'erreur, on retourne un impact qui bloque par sécurité
      return {
        canDeactivate: false,
        blockers: ['Erreur lors de l\'analyse d\'impact'],
        warnings: [error.response?.data?.message || error.message || 'Erreur inconnue'],
        affectedData: {
          tables: [],
          estimatedRows: 0,
        },
        dependentModules: [],
        recommendations: ['Vérifier la connexion au serveur', 'Réessayer l\'analyse'],
      };
    }
  }

  /**
   * Désactive un module pour un tenant spécifique
   * Lance l'orchestration Saga côté backend
   *
   * @param {DeactivationRequest} request - Requête de désactivation
   * @returns {Promise<DeactivationResult>} Résultat de la désactivation avec étapes Saga
   *
   * @example
   * ```typescript
   * const result = await deactivationService.deactivateModule({
   *   tenantId: 123,
   *   moduleName: 'Customer',
   *   options: { backup: true, force: false }
   * });
   *
   * if (result.success) {
   *   console.log('Module désactivé, backup:', result.backupPath);
   * }
   * ```
   */
  async deactivateModule(request: DeactivationRequest): Promise<DeactivationResult> {
    const startTime = Date.now();

    try {
      const { tenantId, moduleName, options } = request;

      console.log(`Deactivating module "${moduleName}" for tenant ${tenantId}...`, options);

      const client = createApiClient();

      const response = await client.delete<DeactivationResponse>(
        `/superadmin/sites/${tenantId}/modules/${moduleName}`,
        {
          data: { options },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('Deactivation response:', response.data);

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
            success: true,
            duration,
          };
        }

        // Format alternatif: { message, data } sans success explicite
        // On considère que c'est un succès si data.deactivated_at existe
        if (responseData.data && responseData.data.deactivated_at) {
          return {
            success: true,
            module: responseData.data.module || request.moduleName,
            deactivatedAt: responseData.data.deactivated_at,
            backupPath: responseData.data.backup_path || undefined,
            steps: responseData.data.steps || [],
            duration,
          };
        }

        // Format avec message de succès
        if (responseData.message && responseData.message.toLowerCase().includes('success')) {
          return {
            success: true,
            module: responseData.data?.module || request.moduleName,
            deactivatedAt: responseData.data?.deactivated_at,
            backupPath: responseData.data?.backup_path,
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

      console.error('Error deactivating module:', error);

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
   * Calcule des statistiques sur les données affectées
   * @param {ImpactAnalysis} impact - Analyse d'impact
   * @returns Statistiques formatées
   */
  getImpactStatistics(impact: ImpactAnalysis) {
    return {
      totalTables: impact.affectedData.tables.length,
      totalRows: impact.affectedData.estimatedRows,
      totalBlockers: impact.blockers.length,
      totalWarnings: impact.warnings.length,
      totalDependents: impact.dependentModules.length,
      totalRecommendations: impact.recommendations.length,
    };
  }

  /**
   * Détermine le niveau de sévérité de l'impact
   * @param {ImpactAnalysis} impact - Analyse d'impact
   * @returns Niveau de sévérité ('low' | 'medium' | 'high' | 'critical')
   */
  getImpactSeverity(impact: ImpactAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    if (!impact.canDeactivate || impact.blockers.length > 0) {
      return 'critical';
    }

    if (impact.affectedData.estimatedRows > 10000 || impact.dependentModules.length > 3) {
      return 'high';
    }

    if (impact.warnings.length > 0 || impact.affectedData.estimatedRows > 1000) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Formate une durée en texte lisible
   * @param {number} ms - Durée en millisecondes
   * @returns Texte formaté
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
 * Instance singleton du service de désactivation
 * @constant
 */
export const deactivationService = new DeactivationService();
