import { createApiClient } from '@/shared/lib/api-client';
import type {
  SystemHealth,
  HealthResponse,
  GlobalStats,
  ModuleStats,
  TenantStats,
  SystemAlert,
  RecentActivity,
  HealthStatus,
} from '../../types/health.types';

/**
 * Service pour gérer la santé globale du système
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 * @class HealthService
 */
class HealthService {
  /**
   * Cache pour les données de santé
   * @private
   */
  private healthCache: SystemHealth | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30000; // 30 secondes

  /**
   * Récupère l'état de santé complet du système
   * @returns {Promise<SystemHealth>} État de santé du système
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      // Vérifier le cache
      if (this.healthCache && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
        console.log('Returning cached system health');
        
return this.healthCache;
      }

      const client = createApiClient();
      const response = await client.get<HealthResponse>('/superadmin/health');

      if (response.data && response.data.success && response.data.data) {
        this.healthCache = response.data.data;
        this.cacheTimestamp = Date.now();
        
return response.data.data;
      }

      // Fallback: générer des données depuis les APIs existantes
      return this.generateHealthFromApis();
    } catch (error) {
      console.error('Error fetching system health:', error);

      // Fallback: générer des données depuis les APIs existantes
      return this.generateHealthFromApis();
    }
  }

  /**
   * Génère les données de santé à partir des APIs existantes
   * @private
   */
  private async generateHealthFromApis(): Promise<SystemHealth> {
    try {
      const client = createApiClient();

      // Récupérer les données des sites et modules
      const [sitesResponse, modulesResponse] = await Promise.all([
        client.get('/superadmin/sites').catch(() => ({ data: { data: [] } })),
        client.get('/superadmin/modules').catch(() => ({ data: { data: {} } })),
      ]);

      // Sites: peut être un tableau directement ou dans .data
      const sitesData = sitesResponse.data?.data || sitesResponse.data || [];
      const sites = Array.isArray(sitesData) ? sitesData : [];

      // Modules: peut être un objet (clé -> module) ou un tableau
      const modulesData = modulesResponse.data?.data || modulesResponse.data || {};

      const modules = Array.isArray(modulesData)
        ? modulesData
        : Object.values(modulesData);

      // Calculer les statistiques globales
      const stats = this.calculateGlobalStats(sites, modules);

      // Calculer les statistiques par module
      const moduleStats = this.calculateModuleStats(sites, modules);

      // Calculer les statistiques par tenant
      const tenantStats = this.calculateTenantStats(sites, modules);

      // Déterminer le statut global
      const status = this.determineGlobalStatus(tenantStats);

      // Générer les alertes basées sur l'état actuel
      const alerts = this.generateAlerts(tenantStats, moduleStats);

      // Générer l'activité récente (simulée pour l'instant)
      const recentActivity = this.generateRecentActivity(sites);

      const health: SystemHealth = {
        status,
        stats,
        moduleStats,
        tenantStats,
        alerts,
        recentActivity,
        lastUpdated: new Date().toISOString(),
      };

      // Mettre en cache
      this.healthCache = health;
      this.cacheTimestamp = Date.now();

      return health;
    } catch (error) {
      console.error('Error generating health from APIs:', error);

      // Retourner un état minimal
      return {
        status: 'unknown',
        stats: {
          totalSites: 0,
          activeSites: 0,
          inactiveSites: 0,
          totalModules: 0,
          totalActivations: 0,
          moduleUsagePercent: 0,
        },
        moduleStats: [],
        tenantStats: [],
        alerts: [{
          id: 'error-1',
          type: 'error',
          title: 'Erreur de connexion',
          message: 'Impossible de récupérer les données du système',
          timestamp: new Date().toISOString(),
          read: false,
        }],
        recentActivity: [],
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Calcule les statistiques globales
   * @private
   */
  private calculateGlobalStats(sites: any[], modules: any[]): GlobalStats {
    // Un site est actif si available=true ou is_active=true ou status='active'
    const activeSites = sites.filter((s) =>
      s.available === true || s.is_active === true || s.status === 'active'
    ).length;

    const inactiveSites = sites.length - activeSites;

    // Calculer le nombre total d'activations
    // Les modules actifs sont ceux où isEnabled=true
    const activeModules = modules.filter((m: any) => m.isEnabled === true || m.is_enabled === true);
    const totalActivations = activeModules.length * activeSites; // Estimation

    const maxPossibleActivations = sites.length * modules.length;

    const moduleUsagePercent = maxPossibleActivations > 0
      ? Math.round((totalActivations / maxPossibleActivations) * 100)
      : 0;

    return {
      totalSites: sites.length,
      activeSites,
      inactiveSites,
      totalModules: modules.length,
      totalActivations,
      moduleUsagePercent,
    };
  }

  /**
   * Calcule les statistiques par module
   * @private
   */
  private calculateModuleStats(sites: any[], modules: any[]): ModuleStats[] {
    return modules.map((module: any) => {
      // Pour l'instant, si le module est activé globalement (isEnabled), on considère
      // qu'il est potentiellement utilisable par tous les sites actifs
      const isEnabled = module.isEnabled === true || module.is_enabled === true;

      const activeSitesCount = sites.filter((s) =>
        s.available === true || s.is_active === true || s.status === 'active'
      ).length;

      // Estimation: si le module est activé, on suppose qu'il est utilisé par tous les sites actifs
      const activeCount = isEnabled ? activeSitesCount : 0;
      const adoptionRate = sites.length > 0 ? Math.round((activeCount / sites.length) * 100) : 0;

      return {
        name: module.alias || module.name,
        displayName: module.name || module.displayName || module.display_name || module.alias,
        category: module.category || 'business',
        activeCount,
        adoptionRate,
        lastActivation: undefined,
      };
    });
  }

  /**
   * Calcule les statistiques par tenant
   * @private
   */
  private calculateTenantStats(sites: any[], modules: any[]): TenantStats[] {
    // Modules actifs globalement
    const enabledModulesCount = modules.filter((m: any) =>
      m.isEnabled === true || m.is_enabled === true
    ).length;

    return sites.map((site) => {
      // Un site actif a available=true
      const isActive = site.available === true || site.is_active === true || site.status === 'active';

      // Estimation des modules actifs pour ce tenant
      const activeModules = isActive ? enabledModulesCount : 0;

      const health = this.determineTenantHealth(activeModules, modules.length, site);

      return {
        id: site.id,
        domain: site.host || site.domain || site.name || `Site #${site.id}`,
        status: isActive ? 'active' : 'inactive',
        activeModules,
        totalModules: modules.length,
        lastActivity: site.last_connection || site.lastActivity || site.last_activity || site.updated_at,
        health,
      };
    });
  }

  /**
   * Détermine l'état de santé d'un tenant
   * @private
   */
  private determineTenantHealth(activeModules: number, totalModules: number, site: any): HealthStatus {
    if (site.status === 'suspended') return 'critical';
    const isActive = site.available === true || site.is_active === true || site.status === 'active';

    if (!isActive) return 'warning';
    if (activeModules === 0 && totalModules > 0) return 'warning';
    if (totalModules > 0 && activeModules < totalModules * 0.3) return 'warning';
    
return 'healthy';
  }

  /**
   * Détermine le statut global du système
   * @private
   */
  private determineGlobalStatus(tenantStats: TenantStats[]): HealthStatus {
    if (tenantStats.length === 0) return 'unknown';

    const criticalCount = tenantStats.filter((t) => t.health === 'critical').length;
    const warningCount = tenantStats.filter((t) => t.health === 'warning').length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > tenantStats.length * 0.3) return 'warning';
    
return 'healthy';
  }

  /**
   * Génère des alertes basées sur l'état actuel
   * @private
   */
  private generateAlerts(tenantStats: TenantStats[], moduleStats: ModuleStats[]): SystemAlert[] {
    const alerts: SystemAlert[] = [];
    let alertId = 1;

    // Alertes pour les tenants en état critique
    tenantStats
      .filter((t) => t.health === 'critical')
      .forEach((tenant) => {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'error',
          title: 'Tenant en état critique',
          message: `Le tenant ${tenant.domain} est en état critique et nécessite une attention immédiate.`,
          timestamp: new Date().toISOString(),
          tenantId: tenant.id,
          read: false,
        });
      });

    // Alertes pour les tenants sans modules
    tenantStats
      .filter((t) => t.activeModules === 0 && t.status === 'active')
      .forEach((tenant) => {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'warning',
          title: 'Tenant sans modules',
          message: `Le tenant ${tenant.domain} n'a aucun module actif.`,
          timestamp: new Date().toISOString(),
          tenantId: tenant.id,
          read: false,
        });
      });

    // Alertes pour les modules peu utilisés
    moduleStats
      .filter((m) => m.adoptionRate < 20 && m.adoptionRate > 0)
      .forEach((module) => {
        alerts.push({
          id: `alert-${alertId++}`,
          type: 'info',
          title: 'Module peu utilisé',
          message: `Le module ${module.displayName} n'est utilisé que par ${module.adoptionRate}% des tenants.`,
          timestamp: new Date().toISOString(),
          moduleName: module.name,
          read: false,
        });
      });

    return alerts;
  }

  /**
   * Génère l'activité récente (simulation basée sur les données disponibles)
   * @private
   */
  private generateRecentActivity(sites: any[]): RecentActivity[] {
    const activities: RecentActivity[] = [];
    let activityId = 1;

    sites.forEach((site) => {
      if (site.modules && Array.isArray(site.modules)) {
        site.modules
          .filter((m: any) => m.installedAt || m.activated_at)
          .slice(0, 3)
          .forEach((module: any) => {
            activities.push({
              id: `activity-${activityId++}`,
              action: 'activation',
              description: `Module ${module.displayName || module.name} activé`,
              timestamp: module.installedAt || module.activated_at,
              tenantDomain: site.domain || site.name,
              moduleName: module.name,
              success: true,
            });
          });
      }
    });

    // Trier par date décroissante et limiter à 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  /**
   * Récupère uniquement les statistiques globales
   * @returns {Promise<GlobalStats>} Statistiques globales
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const health = await this.getSystemHealth();

    
return health.stats;
  }

  /**
   * Récupère les alertes actives
   * @returns {Promise<SystemAlert[]>} Liste des alertes
   */
  async getActiveAlerts(): Promise<SystemAlert[]> {
    const health = await this.getSystemHealth();

    
return health.alerts.filter((a) => !a.read);
  }

  /**
   * Marque une alerte comme lue
   * @param {string} alertId - ID de l'alerte
   */
  markAlertAsRead(alertId: string): void {
    if (this.healthCache) {
      const alert = this.healthCache.alerts.find((a) => a.id === alertId);

      if (alert) {
        alert.read = true;
      }
    }
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.healthCache = null;
    this.cacheTimestamp = 0;
    console.log('Health service cache cleared');
  }

  /**
   * Force le rafraîchissement des données
   * @returns {Promise<SystemHealth>} État de santé actualisé
   */
  async refresh(): Promise<SystemHealth> {
    this.clearCache();
    
return this.getSystemHealth();
  }
}

/**
 * Instance singleton du service de santé
 * @constant
 */
export const healthService = new HealthService();
