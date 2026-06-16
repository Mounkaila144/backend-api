import { createApiClient } from '@/shared/lib/api-client';
import type {
  DependencyResolution,
  DependencyGraph,
  ResolveDependenciesRequest,
  ResolveDependenciesResponse,
  DependencyGraphResponse,
  DependentModulesResponse,
} from '../../types/dependency.types';
import type { Module, TenantModule } from '../../types/module.types';

/**
 * Type union pour les modules avec dépendances
 */
type ModuleWithDeps = Module | TenantModule;

/**
 * Service pour gérer les dépendances entre modules
 * @class DependencyService
 */
class DependencyService {
  /**
   * Cache pour les résolutions de dépendances
   * @private
   */
  private resolutionCache = new Map<string, DependencyResolution>();

  /**
   * Cache pour les graphes de dépendances
   * @private
   */
  private graphCache = new Map<string, DependencyGraph>();

  /**
   * Cache pour les modules dépendants
   * @private
   */
  private dependentsCache = new Map<string, string[]>();

  /**
   * Génère une clé de cache à partir d'un tableau de modules
   * @private
   */
  private getCacheKey(modules: string[]): string {
    return modules.sort().join(',');
  }

  /**
   * Résout les dépendances côté client (fallback)
   * Utilise les informations de dépendances des modules fournis
   * @private
   */
  private resolveLocalDependencies(
    moduleNames: string[],
    modulesData?: ModuleWithDeps[]
  ): DependencyResolution {
    // Si aucun module fourni, impossible de résoudre
    if (!modulesData || modulesData.length === 0) {
      console.log('Local resolution: No modules data provided, using module names as install order');

      // Fallback simple: utiliser l'ordre des modules fournis
      return {
        canInstall: true,
        requiredModules: moduleNames,
        missingDependencies: [],
        installOrder: moduleNames,
      };
    }

    // Créer une map des modules par nom
    const moduleMap = new Map<string, ModuleWithDeps>();

    modulesData.forEach((m) => moduleMap.set(m.name, m));

    // Collecter toutes les dépendances
    const allDependencies = new Set<string>();
    const selectedModulesSet = new Set(moduleNames);

    moduleNames.forEach((name) => {
      const mod = moduleMap.get(name);

      if (mod && mod.dependencies) {
        mod.dependencies.forEach((dep) => allDependencies.add(dep));
      }
    });

    // Identifier les dépendances manquantes
    const missingDependencies: string[] = [];

    allDependencies.forEach((dep) => {
      // Une dépendance est manquante si elle n'est pas dans la sélection
      // et qu'elle n'est pas déjà active (pour TenantModule)
      if (!selectedModulesSet.has(dep)) {
        const depModule = moduleMap.get(dep);

        // Vérifier si le module est actif (pour TenantModule)
        const isActive = depModule && 'tenantStatus' in depModule && depModule.tenantStatus?.isActive;

        if (!isActive) {
          missingDependencies.push(dep);
        }
      }
    });

    // Si des dépendances sont manquantes
    if (missingDependencies.length > 0) {
      return {
        canInstall: false,
        requiredModules: [...allDependencies],
        missingDependencies,
        installOrder: [],
        error: `Dépendances manquantes: ${missingDependencies.join(', ')}`,
      };
    }

    // Trier les modules par ordre de dépendances (tri topologique simplifié)
    const installOrder = this.topologicalSort(moduleNames, moduleMap);

    return {
      canInstall: true,
      requiredModules: [...selectedModulesSet, ...allDependencies],
      missingDependencies: [],
      installOrder,
    };
  }

  /**
   * Tri topologique simplifié pour déterminer l'ordre d'installation
   * @private
   */
  private topologicalSort(moduleNames: string[], moduleMap: Map<string, ModuleWithDeps>): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string) => {
      if (visited.has(name)) return;

      if (visiting.has(name)) {
        // Cycle détecté, ignorer
        console.warn(`Cycle detected in dependencies for module: ${name}`);
        
return;
      }

      visiting.add(name);

      const mod = moduleMap.get(name);

      if (mod && mod.dependencies) {
        mod.dependencies.forEach((dep) => {
          if (moduleNames.includes(dep)) {
            visit(dep);
          }
        });
      }

      visiting.delete(name);
      visited.add(name);
      result.push(name);
    };

    moduleNames.forEach((name) => visit(name));

    return result;
  }

  /**
   * Résout les dépendances pour un ensemble de modules
   * Retourne l'ordre d'installation et les dépendances manquantes
   *
   * @param {string[]} modules - Liste des modules à installer
   * @param {ModuleWithDeps[]} modulesData - Données des modules (optionnel, pour fallback local)
   * @returns {Promise<DependencyResolution>} Résolution des dépendances
   *
   * @example
   * ```typescript
   * const resolution = await dependencyService.resolveDependencies(['commerce', 'payment']);
   * if (resolution.canInstall) {
   *   console.log('Installation possible dans l\'ordre:', resolution.installOrder);
   * } else {
   *   console.error('Dépendances manquantes:', resolution.missingDependencies);
   * }
   * ```
   */
  async resolveDependencies(
    modules: string[],
    modulesData?: ModuleWithDeps[]
  ): Promise<DependencyResolution> {
    try {
      // Vérifier le cache
      const cacheKey = this.getCacheKey(modules);

      if (this.resolutionCache.has(cacheKey)) {
        console.log('Returning cached dependency resolution for:', modules);
        
return this.resolutionCache.get(cacheKey)!;
      }

      const client = createApiClient();
      const body: ResolveDependenciesRequest = { modules };

      const response = await client.post<ResolveDependenciesResponse>(
        '/superadmin/modules/resolve-dependencies',
        body
      );

      console.log('Dependency resolution response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        const resolution = response.data.data;

        // Mettre en cache
        this.resolutionCache.set(cacheKey, resolution);

        return resolution;
      }

      // Fallback: résolution locale
      console.log('API returned invalid response, using local resolution');
      const localResolution = this.resolveLocalDependencies(modules, modulesData);

      this.resolutionCache.set(cacheKey, localResolution);
      
return localResolution;
    } catch (error) {
      console.error('Error resolving dependencies via API, using local fallback:', error);

      // Fallback: résolution locale
      const localResolution = this.resolveLocalDependencies(modules, modulesData);
      const cacheKey = this.getCacheKey(modules);

      this.resolutionCache.set(cacheKey, localResolution);
      
return localResolution;
    }
  }

  /**
   * Récupère le graphe de dépendances pour un module spécifique
   * Inclut les nœuds (modules) et les arêtes (relations)
   *
   * @param {string} moduleName - Nom du module
   * @returns {Promise<DependencyGraph>} Graphe de dépendances
   * @throws {Error} En cas d'erreur réseau ou serveur
   *
   * @example
   * ```typescript
   * const graph = await dependencyService.getDependencyGraph('commerce');
   * console.log('Nodes:', graph.nodes);
   * console.log('Edges:', graph.edges);
   * ```
   */
  async getDependencyGraph(moduleName: string): Promise<DependencyGraph> {
    try {
      // Vérifier le cache
      if (this.graphCache.has(moduleName)) {
        console.log('Returning cached dependency graph for:', moduleName);
        
return this.graphCache.get(moduleName)!;
      }

      const client = createApiClient();

      const response = await client.get<DependencyGraphResponse>(
        `/superadmin/modules/${moduleName}/dependencies/graph`
      );

      console.log('Dependency graph response:', response.data);

      if (response.data && response.data.success && response.data.data) {
        const graph = response.data.data;

        // Mettre en cache
        this.graphCache.set(moduleName, graph);

        return graph;
      }

      // Fallback en cas de réponse invalide
      return {
        nodes: [],
        edges: [],
      };
    } catch (error) {
      console.error(`Error fetching dependency graph for ${moduleName}:`, error);

      // Retourner un graphe vide en cas d'erreur
      return {
        nodes: [],
        edges: [],
      };
    }
  }

  /**
   * Récupère la liste des modules qui dépendent d'un module donné
   * Utile pour analyser l'impact d'une désactivation
   *
   * @param {string} moduleName - Nom du module
   * @returns {Promise<string[]>} Liste des modules dépendants
   * @throws {Error} En cas d'erreur réseau ou serveur
   *
   * @example
   * ```typescript
   * const dependents = await dependencyService.getDependentModules('users');
   * console.log('Modules qui dépendent de users:', dependents);
   * // ['commerce', 'crm', 'support']
   * ```
   */
  async getDependentModules(moduleName: string): Promise<string[]> {
    try {
      // Vérifier le cache
      if (this.dependentsCache.has(moduleName)) {
        console.log('Returning cached dependent modules for:', moduleName);
        
return this.dependentsCache.get(moduleName)!;
      }

      const client = createApiClient();

      const response = await client.get<DependentModulesResponse>(
        `/superadmin/modules/${moduleName}/dependents`
      );

      console.log('Dependent modules response:', response.data);

      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const dependents = response.data.data;

        // Mettre en cache
        this.dependentsCache.set(moduleName, dependents);

        return dependents;
      }

      // Fallback en cas de réponse invalide
      return [];
    } catch (error) {
      console.error(`Error fetching dependent modules for ${moduleName}:`, error);

      // Retourner un tableau vide en cas d'erreur
      return [];
    }
  }

  /**
   * Vide tous les caches
   * Utile après une modification de module (activation/désactivation)
   *
   * @example
   * ```typescript
   * await moduleService.activateModule(tenantId, 'commerce');
   * dependencyService.clearCache(); // Invalidate les caches
   * ```
   */
  clearCache(): void {
    this.resolutionCache.clear();
    this.graphCache.clear();
    this.dependentsCache.clear();
    console.log('Dependency service caches cleared');
  }

  /**
   * Invalide le cache pour un module spécifique
   *
   * @param {string} moduleName - Nom du module
   */
  invalidateModuleCache(moduleName: string): void {
    this.graphCache.delete(moduleName);
    this.dependentsCache.delete(moduleName);
    console.log(`Cache invalidated for module: ${moduleName}`);
  }
}

/**
 * Instance singleton du service de dépendances
 * @constant
 */
export const dependencyService = new DependencyService();
