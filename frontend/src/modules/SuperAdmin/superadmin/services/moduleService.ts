import { createApiClient } from '@/shared/lib/api-client';
import type { Module, TenantModule, ApiResponse } from '../../types/module.types';

/**
 * Interface de la réponse API pour un module global
 */
interface ApiModule {
  name: string;
  alias: string;
  description: string;
  version: string;
  dependencies: string[];
  priority: number;
  isSystem: boolean;
  isEnabled: boolean;
}

/**
 * Interface de la réponse API pour un module tenant
 */
interface ApiTenantModule {
  name: string;
  alias: string;
  description: string;
  version: string;
  dependencies: string[];
  isSystem: boolean;
  status: 'active' | 'inactive';
  installedAt: string | null;
  uninstalledAt: string | null;
  config: Record<string, any>;

  /** Version installée (depuis les mises à jour legacy) */
  installedVersion?: string | null;

  /** Historique des versions */
  versionHistory?: Array<{
    action: string;
    from_version: string | null;
    to_version: string;
    applied_versions: string[];
    applied_at: string;
  }> | null;
}

/**
 * Service pour gérer les opérations liées aux modules
 * @class ModuleService
 */
class ModuleService {
  /**
   * Transforme un objet de modules de l'API en tableau de modules
   * @private
   * Note: On utilise apiModule.name comme nom technique (avec la bonne casse)
   * car le backend attend le nom exact pour l'activation (ex: "Customer" et non "customer")
   * L'alias est en minuscules, mais name a la casse correcte
   */
  private transformModulesObject(modulesObj: Record<string, ApiModule>): Module[] {
    return Object.entries(modulesObj).map(([key, apiModule]) => ({
      // Utiliser name comme nom technique (casse correcte pour le backend)
      // apiModule.name = "Customer", apiModule.alias = "customer"
      name: apiModule.name || key,
      displayName: apiModule.name,
      description: apiModule.description,
      version: apiModule.version,
      enabled: apiModule.isEnabled,
      category: apiModule.isSystem ? 'core' : 'business',
      icon: undefined,
      dependencies: apiModule.dependencies || [],
      dependents: [],
      path: `/modules/${apiModule.alias || key}`,
      hasConfig: false,
      hasMigrations: false,
      hasSeeds: false,
    }));
  }

  /**
   * Transforme un objet de modules tenant de l'API en tableau de TenantModule
   * @private
   * Note: On utilise apiModule.name comme nom technique (avec la bonne casse)
   * car le backend attend le nom exact pour l'activation (ex: "Customer" et non "customer")
   * L'alias est en minuscules, mais name a la casse correcte
   */
  private transformTenantModulesObject(modulesObj: Record<string, ApiTenantModule>): TenantModule[] {
    return Object.entries(modulesObj).map(([key, apiModule]) => ({
      // Propriétés de Module
      // Utiliser name comme nom technique (casse correcte pour le backend)
      // apiModule.name = "Customer", apiModule.alias = "customer"
      name: apiModule.name || key,
      displayName: apiModule.name,
      description: apiModule.description,
      version: apiModule.version,
      enabled: apiModule.status === 'active', // Le module est "enabled" globalement si actif pour ce tenant
      category: apiModule.isSystem ? 'core' : 'business',
      icon: undefined,
      dependencies: apiModule.dependencies || [],
      dependents: [],
      path: `/modules/${apiModule.alias || key}`,
      hasConfig: apiModule.config && Object.keys(apiModule.config).length > 0,
      hasMigrations: false,
      hasSeeds: false,

      // Propriétés de TenantModule
      tenantStatus: {
        isActive: apiModule.status === 'active',
        installedAt: apiModule.installedAt,
        config: apiModule.config || {},
        installedVersion: apiModule.installedVersion || null,
        versionHistory: apiModule.versionHistory || null,
      },
    }));
  }

  /**
   * Récupère la liste de tous les modules disponibles dans le système
   * @returns {Promise<Module[]>} Liste des modules ou tableau vide en cas d'erreur
   * @throws {Error} En cas d'erreur réseau ou serveur
   *
   * @example
   * ```typescript
   * const modules = await moduleService.getAvailableModules();
   * console.log(modules); // [{ name: 'users', displayName: 'Users', ... }]
   * ```
   */
  async getAvailableModules(): Promise<Module[]> {
    try {
      const client = createApiClient();

      const response = await client.get<ApiResponse<Record<string, ApiModule>>>(
        '/superadmin/modules'
      );

      console.log('API Response:', response.data);

      // L'API retourne { data: { moduleName: {...}, ... } }
      if (response.data && 'data' in response.data) {
        const modulesData = response.data.data;

        // Si c'est un objet avec des modules comme propriétés
        if (modulesData && typeof modulesData === 'object' && !Array.isArray(modulesData)) {
          const modules = this.transformModulesObject(modulesData);

          console.log('Transformed modules:', modules);
          
return modules;
        }

        // Si c'est déjà un tableau
        if (Array.isArray(modulesData)) {
          return modulesData as Module[];
        }

        console.error('API returned data in unexpected format:', modulesData);
        
return [];
      }

      // Si la réponse est directement un objet de modules
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        return this.transformModulesObject(response.data as Record<string, ApiModule>);
      }

      // Si la réponse est directement un tableau
      if (Array.isArray(response.data)) {
        return response.data as Module[];
      }

      console.error('Unexpected API response format:', response.data);
      
return [];
    } catch (error) {
      console.error('Error fetching available modules:', error);

      // Retourne un tableau vide en cas d'erreur plutôt que de throw
      // pour permettre à l'UI de gérer l'état vide gracieusement
      return [];
    }
  }

  /**
   * Récupère la liste des modules pour un tenant spécifique avec leur statut
   * @param {number} tenantId - ID du tenant
   * @returns {Promise<TenantModule[]>} Liste des modules avec statut tenant ou tableau vide en cas d'erreur
   * @throws {Error} En cas d'erreur réseau ou serveur
   *
   * @example
   * ```typescript
   * const modules = await moduleService.getTenantModules(123);
   * console.log(modules); // [{ ...moduleData, tenantStatus: { isActive: true, ... } }]
   * ```
   */
  async getTenantModules(tenantId: number): Promise<TenantModule[]> {
    try {
      // Validation du tenantId
      if (!tenantId || tenantId <= 0) {
        console.error('Invalid tenantId:', tenantId);
        
return [];
      }

      const client = createApiClient();

      const response = await client.get<ApiResponse<Record<string, ApiTenantModule>>>(
        `/superadmin/sites/${tenantId}/modules`
      );

      console.log('Tenant Modules API Response:', response.data);

      // L'API retourne { data: { moduleName: {...}, ... } }
      if (response.data && 'data' in response.data) {
        const modulesData = response.data.data;

        // Si c'est un objet avec des modules comme propriétés
        if (modulesData && typeof modulesData === 'object' && !Array.isArray(modulesData)) {
          const modules = this.transformTenantModulesObject(modulesData);

          console.log('Transformed tenant modules:', modules);
          
return modules;
        }

        // Si c'est déjà un tableau (cas alternatif)
        if (Array.isArray(modulesData)) {
          return modulesData as TenantModule[];
        }

        console.error('API returned tenant modules in unexpected format:', modulesData);
        
return [];
      }

      // Si la réponse est directement un objet de modules
      if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        return this.transformTenantModulesObject(response.data as Record<string, ApiTenantModule>);
      }

      // Si la réponse est directement un tableau
      if (Array.isArray(response.data)) {
        return response.data as TenantModule[];
      }

      console.error('Unexpected tenant modules API response format:', response.data);
      
return [];
    } catch (error) {
      console.error(`Error fetching modules for tenant ${tenantId}:`, error);

      // Retourne un tableau vide en cas d'erreur
      return [];
    }
  }
}

/**
 * Instance singleton du service de modules
 * @constant
 */
export const moduleService = new ModuleService();
