/**
 * Types pour le Dashboard Santé Globale
 * Conformes à l'Epic 6 - Dashboard Santé Globale UI
 * @module SuperAdmin/types/health
 */

/**
 * Statut de santé global
 */
export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

/**
 * Statistiques globales du système
 */
export interface GlobalStats {

  /** Nombre total de sites/tenants */
  totalSites: number;

  /** Nombre de sites actifs */
  activeSites: number;

  /** Nombre de sites inactifs */
  inactiveSites: number;

  /** Nombre total de modules disponibles */
  totalModules: number;

  /** Nombre total d'activations (modules activés sur tous les tenants) */
  totalActivations: number;

  /** Pourcentage d'utilisation des modules */
  moduleUsagePercent: number;
}

/**
 * Statistiques d'un module
 */
export interface ModuleStats {

  /** Nom du module */
  name: string;

  /** Nom d'affichage */
  displayName: string;

  /** Catégorie du module */
  category: string;

  /** Nombre de tenants utilisant ce module */
  activeCount: number;

  /** Pourcentage d'adoption */
  adoptionRate: number;

  /** Dernière activation */
  lastActivation?: string;
}

/**
 * Statistiques d'un tenant
 */
export interface TenantStats {

  /** ID du tenant */
  id: number;

  /** Domaine du tenant */
  domain: string;

  /** Statut du tenant */
  status: 'active' | 'inactive' | 'suspended';

  /** Nombre de modules actifs */
  activeModules: number;

  /** Nombre total de modules disponibles */
  totalModules: number;

  /** Dernière activité */
  lastActivity?: string;

  /** État de santé */
  health: HealthStatus;
}

/**
 * Alerte système
 */
export interface SystemAlert {

  /** ID unique de l'alerte */
  id: string;

  /** Type d'alerte */
  type: 'info' | 'warning' | 'error' | 'success';

  /** Titre de l'alerte */
  title: string;

  /** Message détaillé */
  message: string;

  /** Timestamp de l'alerte */
  timestamp: string;

  /** Tenant concerné (optionnel) */
  tenantId?: number;

  /** Module concerné (optionnel) */
  moduleName?: string;

  /** Si l'alerte a été lue */
  read: boolean;
}

/**
 * Activité récente
 */
export interface RecentActivity {

  /** ID de l'activité */
  id: string;

  /** Type d'action */
  action: 'activation' | 'deactivation' | 'configuration' | 'error';

  /** Description de l'action */
  description: string;

  /** Timestamp */
  timestamp: string;

  /** Tenant concerné */
  tenantDomain: string;

  /** Module concerné */
  moduleName?: string;

  /** Succès ou échec */
  success: boolean;
}

/**
 * État de santé complet du système
 */
export interface SystemHealth {

  /** Statut global */
  status: HealthStatus;

  /** Statistiques globales */
  stats: GlobalStats;

  /** Statistiques par module */
  moduleStats: ModuleStats[];

  /** Statistiques par tenant */
  tenantStats: TenantStats[];

  /** Alertes actives */
  alerts: SystemAlert[];

  /** Activités récentes */
  recentActivity: RecentActivity[];

  /** Timestamp de dernière mise à jour */
  lastUpdated: string;
}

/**
 * Réponse API pour la santé système
 */
export interface HealthResponse {
  success: boolean;
  data: SystemHealth;
  message?: string;
}
