import { createApiClient } from '@/shared/lib/api-client';
import { SERVICE_EDITABLE } from '../../types/service-config.types';
import type {
  ServiceType,
  ServiceConfig,
  TestResult,
  ConfigResponse,
  TestResponse,
  S3Config,
} from '../../types/service-config.types';

/**
 * Mapping des types de service vers leurs endpoints API
 */
const SERVICE_ENDPOINTS: Record<ServiceType, string> = {
  's3': '/superadmin/config/s3',
  'resend': '/superadmin/config/resend',
  'meilisearch': '/superadmin/config/meilisearch',
};

/**
 * Service pour gérer la configuration des services externes
 * @class ServiceConfigService
 */
class ServiceConfigService {
  /**
   * Récupère la configuration d'un service
   * @param service - Type de service
   * @returns Configuration du service
   */
  async getConfig<T = ServiceConfig>(service: ServiceType): Promise<ConfigResponse<T>> {
    try {
      const client = createApiClient();
      const endpoint = SERVICE_ENDPOINTS[service];

      if (!endpoint) {
        throw new Error(`Unknown service type: ${service}`);
      }

      const response = await client.get<ConfigResponse<T>>(endpoint);

      
return response.data;
    } catch (error) {
      console.error(`Error fetching ${service} config:`, error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration d'un service (si modifiable)
   * @param service - Type de service
   * @param config - Nouvelle configuration
   * @throws Error si le service n'est pas modifiable
   */
  async updateConfig<T = ServiceConfig>(service: ServiceType, config: Partial<T>): Promise<ConfigResponse<T>> {
    try {
      const client = createApiClient();
      const endpoint = SERVICE_ENDPOINTS[service];

      if (!endpoint) {
        throw new Error(`Unknown service type: ${service}`);
      }

      // Vérifier si le service est modifiable
      if (!SERVICE_EDITABLE[service]) {
        throw new Error(`Service ${service} configuration is read-only (managed via .env)`);
      }

      const response = await client.put<ConfigResponse<T>>(endpoint, config);

      
return response.data;
    } catch (error) {
      console.error(`Error updating ${service} config:`, error);
      throw error;
    }
  }

  /**
   * Teste la connexion à un service
   * @param service - Type de service
   * @returns Résultat du test (utilise la config sauvegardée en base)
   */
  async testConnection(service: ServiceType): Promise<TestResult> {
    try {
      const client = createApiClient();
      const endpoint = `${SERVICE_ENDPOINTS[service]}/test`;

      // GET - le backend utilise la config sauvegardée en base de données
      const response = await client.get<TestResponse>(endpoint);

      return response.data.data;
    } catch (error: any) {
      console.error(`Error testing ${service} connection:`, error);

      // Retourner un résultat d'erreur formaté
      return {
        service,
        healthy: false,
        status: 'error',
        message: error.response?.data?.message || error.message || 'Erreur de connexion',
        checked_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Récupère la configuration S3
   */
  async getS3Config(): Promise<ConfigResponse<S3Config>> {
    return this.getConfig<S3Config>('s3');
  }

  /**
   * Met à jour la configuration S3
   */
  async updateS3Config(config: Partial<S3Config>): Promise<ConfigResponse<S3Config>> {
    return this.updateConfig<S3Config>('s3', config);
  }

  /**
   * Teste la connexion S3
   */
  async testS3Connection(): Promise<TestResult> {
    return this.testConnection('s3');
  }
}

/**
 * Instance singleton du service de configuration
 */
export const serviceConfigService = new ServiceConfigService();
