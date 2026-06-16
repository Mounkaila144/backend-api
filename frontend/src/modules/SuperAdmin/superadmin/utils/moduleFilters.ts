import type { Module, TenantModule, ModuleCategory } from '../../types/module.types';

/**
 * Interface pour les filtres de modules
 */
export interface ModuleFilters {
  search: string;
  category: ModuleCategory | 'all';
  status: 'all' | 'enabled' | 'disabled';
  tenantStatus?: 'all' | 'active' | 'available';
  hasDependencies: 'all' | 'yes' | 'no';
}

/**
 * Filtres par défaut
 */
export const defaultFilters: ModuleFilters = {
  search: '',
  category: 'all',
  status: 'all',
  hasDependencies: 'all',
  tenantStatus: 'all',
};

/**
 * Normalise une chaîne pour la recherche (insensible à la casse et aux accents)
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Vérifie si un module est un TenantModule
 */
function isTenantModule(module: Module | TenantModule): module is TenantModule {
  return 'tenantStatus' in module;
}

/**
 * Filtre les modules selon les critères fournis
 * @param modules - Liste des modules à filtrer
 * @param filters - Critères de filtrage
 * @returns Liste des modules filtrés
 */
export function filterModules<T extends Module | TenantModule>(
  modules: T[],
  filters: ModuleFilters
): T[] {
  return modules.filter((module) => {
    // Filtre de recherche (sur name, displayName, description)
    if (filters.search) {
      const searchTerm = normalizeString(filters.search);
      const matchesName = normalizeString(module.name).includes(searchTerm);
      const matchesDisplayName = normalizeString(module.displayName).includes(searchTerm);
      const matchesDescription = normalizeString(module.description).includes(searchTerm);

      if (!matchesName && !matchesDisplayName && !matchesDescription) {
        return false;
      }
    }

    // Filtre par catégorie
    if (filters.category !== 'all' && module.category !== filters.category) {
      return false;
    }

    // Filtre par statut global (enabled/disabled)
    if (filters.status !== 'all') {
      const isEnabled = filters.status === 'enabled';

      if (module.enabled !== isEnabled) {
        return false;
      }
    }

    // Filtre par statut tenant (pour TenantModule uniquement)
    if (filters.tenantStatus && filters.tenantStatus !== 'all' && isTenantModule(module)) {
      const isActive = filters.tenantStatus === 'active';

      if (module.tenantStatus.isActive !== isActive) {
        return false;
      }
    }

    // Filtre par présence de dépendances
    if (filters.hasDependencies !== 'all') {
      const hasDeps = module.dependencies.length > 0;
      const wantsDeps = filters.hasDependencies === 'yes';

      if (hasDeps !== wantsDeps) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Compte le nombre de filtres actifs (non par défaut)
 * @param filters - Filtres à analyser
 * @returns Nombre de filtres actifs
 */
export function countActiveFilters(filters: ModuleFilters): number {
  let count = 0;

  if (filters.search) count++;
  if (filters.category !== 'all') count++;
  if (filters.status !== 'all') count++;
  if (filters.tenantStatus && filters.tenantStatus !== 'all') count++;
  if (filters.hasDependencies !== 'all') count++;

  return count;
}

/**
 * Convertit les filtres en query params pour l'URL
 * @param filters - Filtres à convertir
 * @returns Objet de query params
 */
export function filtersToQueryParams(filters: ModuleFilters): Record<string, string> {
  const params: Record<string, string> = {};

  if (filters.search) params.search = filters.search;
  if (filters.category !== 'all') params.category = filters.category;
  if (filters.status !== 'all') params.status = filters.status;
  if (filters.tenantStatus && filters.tenantStatus !== 'all') params.tenantStatus = filters.tenantStatus;
  if (filters.hasDependencies !== 'all') params.hasDependencies = filters.hasDependencies;

  return params;
}

/**
 * Convertit les query params en filtres
 * @param params - Query params à convertir
 * @returns Objet de filtres
 */
export function queryParamsToFilters(params: URLSearchParams): ModuleFilters {
  return {
    search: params.get('search') || '',
    category: (params.get('category') as ModuleCategory) || 'all',
    status: (params.get('status') as 'all' | 'enabled' | 'disabled') || 'all',
    tenantStatus: (params.get('tenantStatus') as 'all' | 'active' | 'available') || 'all',
    hasDependencies: (params.get('hasDependencies') as 'all' | 'yes' | 'no') || 'all',
  };
}
