/**
 * Types pour la gestion des modules SuperAdmin
 * @module SuperAdmin/types/module
 */

/**
 * Catégories de modules disponibles dans le système
 */
export type ModuleCategory = 'core' | 'business' | 'integration' | 'ui' | 'utility';

/**
 * Interface représentant un module du système
 */
export interface Module {

  /** Nom technique du module (ex: 'user-management') */
  name: string;

  /** Nom affiché dans l'interface (ex: 'Gestion des utilisateurs') */
  displayName: string;

  /** Description détaillée du module */
  description: string;

  /** Version du module (ex: '1.0.0') */
  version: string;

  /** Indique si le module est activé globalement */
  enabled: boolean;

  /** Catégorie du module */
  category: ModuleCategory;

  /** Icône du module (optionnel) */
  icon?: string;

  /** Liste des noms de modules requis */
  dependencies: string[];

  /** Liste des noms de modules qui dépendent de celui-ci */
  dependents: string[];

  /** Chemin du module dans le système de fichiers */
  path: string;

  /** Indique si le module a des fichiers de configuration */
  hasConfig: boolean;

  /** Indique si le module a des migrations de base de données */
  hasMigrations: boolean;

  /** Indique si le module a des seeds de base de données */
  hasSeeds: boolean;
}

/**
 * Réponse API générique
 * @template T Type des données de la réponse
 */
export interface ApiResponse<T> {

  /** Données de la réponse */
  data: T;

  /** Message de succès ou d'erreur */
  message?: string;

  /** Indicateur de succès de la requête */
  success: boolean;

  /** Métadonnées supplémentaires (pagination, etc.) */
  meta?: Record<string, any>;
}

/**
 * Entrée dans l'historique des versions d'un module
 */
export interface ModuleVersionHistoryEntry {

  /** Type d'action effectuée */
  action: 'install' | 'reactivate' | 'upgrade' | 'downgrade';

  /** Version avant l'action */
  from_version: string | null;

  /** Version après l'action */
  to_version: string;

  /** Liste des versions appliquées */
  applied_versions: string[];

  /** Date de l'action (ISO 8601) */
  applied_at: string;
}

/**
 * Statut d'un module pour un tenant spécifique
 */
export interface TenantModuleStatus {

  /** Indique si le module est activé pour ce tenant */
  isActive: boolean;

  /** Date d'installation du module (ISO 8601) ou null si non activé */
  installedAt: string | null;

  /** Configuration spécifique du module pour ce tenant */
  config: Record<string, any>;

  /** Version installée du module (depuis les mises à jour legacy) */
  installedVersion?: string | null;

  /** Historique des versions appliquées */
  versionHistory?: ModuleVersionHistoryEntry[] | null;
}

/**
 * Interface représentant un module avec son statut pour un tenant
 * Étend l'interface Module de base avec les informations spécifiques au tenant
 */
export interface TenantModule extends Module {

  /** Statut et configuration du module pour le tenant */
  tenantStatus: TenantModuleStatus;
}
