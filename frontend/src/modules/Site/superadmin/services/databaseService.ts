import { createApiClient } from '@/shared/lib/api-client';

export interface DatabaseCredentials {
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string;
}

export interface TestConnectionResult {
  can_connect: boolean;
  server_version?: string;
  db_exists?: boolean;
  error?: string;
}

export interface ProvisionResult {
  created: boolean;
  already_existed: boolean;
}

/**
 * Provisionnement de DB tenants depuis le formulaire de création.
 *
 * Wraps les 2 endpoints :
 *   POST /api/superadmin/databases/test       — valide les credentials
 *   POST /api/superadmin/databases/provision  — crée la DB si absente
 *
 * L'import de dump SQL n'est PAS géré ici — utilise phpMyAdmin déployé dans
 * le même cloud que la DB (réseau interne beaucoup plus rapide qu'un upload
 * via notre API).
 */
class DatabaseService {
  async testConnection(creds: DatabaseCredentials): Promise<TestConnectionResult> {
    const client = createApiClient();
    const response = await client.post<{ success: boolean; data: TestConnectionResult }>(
      '/superadmin/databases/test',
      creds
    );

    return response.data.data;
  }

  async provisionDatabase(creds: Required<DatabaseCredentials>): Promise<ProvisionResult> {
    const client = createApiClient();
    const response = await client.post<{ success: boolean; data: ProvisionResult; message: string }>(
      '/superadmin/databases/provision',
      creds
    );

    return response.data.data;
  }
}

export const databaseService = new DatabaseService();
