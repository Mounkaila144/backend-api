/**
 * Types pour la configuration des services SuperAdmin
 * @module SuperAdmin/types/service-config
 */

/**
 * Types de services configurables
 * Note: La base de données centrale n'est pas configurable via l'interface
 */
export type ServiceType = 's3' | 'resend' | 'meilisearch';

/**
 * Configuration S3/MinIO
 */
export interface S3Config {

  /** Access Key AWS ou MinIO */
  access_key: string;

  /** Secret Key AWS ou MinIO */
  secret_key: string;

  /** Nom du bucket */
  bucket: string;

  /** Région AWS (ex: eu-west-3) */
  region: string;

  /** Endpoint personnalisé pour MinIO (optionnel) */
  endpoint?: string;

  /** Utiliser le style path pour MinIO (optionnel) */
  use_path_style?: boolean;
}

/**
 * Configuration Database
 */
export interface DatabaseConfig {

  /** Hôte du serveur de base de données */
  host: string;

  /** Port de connexion */
  port: number;

  /** Nom d'utilisateur */
  username: string;

  /** Mot de passe */
  password: string;

  /** Préfixe des bases de données tenant */
  database_prefix: string;

  /** Charset de la base de données (optionnel) */
  charset?: string;

  /** Collation (optionnel) */
  collation?: string;
}


/**
 * Configuration Resend (Email)
 */
export interface ResendConfig {

  /** API Key Resend */
  api_key: string;

  /** Adresse email expéditeur */
  from_address: string;

  /** Nom expéditeur */
  from_name: string;

  /** Adresse email de réponse (optionnel) */
  reply_to?: string;
}

/**
 * Configuration Meilisearch
 */
export interface MeilisearchConfig {

  /** URL du serveur Meilisearch */
  url: string;

  /** Clé API Meilisearch */
  api_key: string;

  /** Préfixe des index (optionnel) */
  index_prefix?: string;
}

/**
 * Union type pour toutes les configurations
 */
export type ServiceConfig = S3Config | DatabaseConfig | ResendConfig | MeilisearchConfig;

/**
 * Résultat d'un test de connexion
 */
export interface TestResult {

  /** Nom du service testé */
  service: string;

  /** Indique si le service est sain */
  healthy: boolean;

  /** Statut du test (success, error, etc.) */
  status: string;

  /** Message descriptif */
  message: string;

  /** Détails supplémentaires */
  details?: Record<string, any>;

  /** Latence en millisecondes */
  latency_ms?: number;

  /** Date/heure du test (ISO 8601) */
  checked_at: string;
}

/**
 * Réponse API pour une configuration
 */
export interface ConfigResponse<T> {

  /** Données de configuration */
  data: T;

  /** Schéma de la configuration (optionnel) */
  schema?: Record<string, any>;

  /** Note explicative (pour les configs read-only) */
  note?: string;
}

/**
 * Réponse API pour un test de connexion
 */
export interface TestResponse {

  /** Résultat du test */
  data: TestResult;
}

/**
 * Mapping des services vers leur configurabilité
 * Tous les services sont modifiables via l'interface SuperAdmin
 */
export const SERVICE_EDITABLE: Record<ServiceType, boolean> = {
  's3': true,
  'resend': true,
  'meilisearch': true,
};

/**
 * Labels des services pour l'affichage
 */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  's3': 'Stockage S3 / MinIO',
  'resend': 'Resend (Email)',
  'meilisearch': 'Meilisearch',
};

/**
 * Descriptions des services
 */
export const SERVICE_DESCRIPTIONS: Record<ServiceType, string> = {
  's3': 'Configuration du stockage de fichiers (AWS S3 ou MinIO)',
  'resend': 'Configuration du service d\'envoi d\'emails Resend',
  'meilisearch': 'Configuration du moteur de recherche Meilisearch',
};
