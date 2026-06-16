/**
 * Types pour le module Site
 */

export type SiteType = 'CUST' | 'ECOM' | 'CMS';
export type YesNo = 'YES' | 'NO';
export type SslMode = 'DISABLED' | 'PREFERRED' | 'REQUIRED' | 'VERIFY_CA' | 'VERIFY_IDENTITY';

export interface SiteDatabaseSsl {
  enabled: boolean;
  mode: SslMode;
  ca?: string | null;
}

export interface SiteDatabase {
  name: string;
  host: string;
  port?: number;
  login?: string;
  has_password?: boolean; // Indicateur si un mot de passe est défini (ne renvoie pas le mot de passe réel)
  size?: number;
  ssl?: SiteDatabaseSsl;
}

export interface SiteThemes {
  admin: {
    current: string | null;
    base: string | null;
  };
  frontend: {
    current: string | null;
    base: string | null;
  };
}

export interface SiteAvailability {
  site: boolean;
  admin: boolean;
  frontend: boolean;
}

export interface SiteAssets {
  logo: string | null;
  picture: string | null;
  banner: string | null;
  favicon: string | null;
}

export interface Site {
  id: number;
  host: string;
  database: SiteDatabase;
  themes: SiteThemes;
  availability: SiteAvailability;
  type: SiteType | null;
  master: string | null;
  access_restricted: boolean;
  is_customer: boolean;
  company: string | null;
  is_uptodate: boolean;
  assets: SiteAssets;
  size: number | null;
  price: number | null;
  last_connection: string | null;
}

export interface SiteListItem {
  id: number;
  site_id?: number; // Alias pour la compatibilité avec la DB
  host: string;
  db_name: string;
  type: SiteType | null;
  available: boolean;
  is_uptodate: boolean;
  admin_available: boolean;
  frontend_available: boolean;
  is_customer: boolean;
  company: string | null;
  last_connection: string | null;
}

export interface CreateSiteData {
  site_host: string;
  site_db_name: string;
  site_db_host: string;
  site_db_port?: number;
  site_db_ssl_enabled?: YesNo;
  site_db_ssl_mode?: SslMode;
  site_db_ssl_ca?: string;
  site_db_login: string;
  site_db_password?: string;
  site_admin_theme?: string;
  site_admin_theme_base?: string;
  site_frontend_theme?: string;
  site_frontend_theme_base?: string;
  site_type?: SiteType;
  site_company?: string;
  site_admin_available?: YesNo;
  site_frontend_available?: YesNo;
  site_available?: YesNo;
  is_customer?: YesNo;
  site_access_restricted?: YesNo;
  price?: number;
  create_database?: boolean;
  setup_tables?: boolean;
}

export interface UpdateSiteData {
  site_host?: string;
  site_db_name?: string;
  site_db_host?: string;
  site_db_port?: number;
  site_db_ssl_enabled?: YesNo;
  site_db_ssl_mode?: SslMode;
  site_db_ssl_ca?: string;
  site_db_login?: string;
  site_db_password?: string;
  site_admin_theme?: string;
  site_admin_theme_base?: string;
  site_frontend_theme?: string;
  site_frontend_theme_base?: string;
  site_type?: SiteType;
  site_company?: string;
  site_admin_available?: YesNo;
  site_frontend_available?: YesNo;
  site_available?: YesNo;
  is_customer?: YesNo;
  site_access_restricted?: YesNo;
  site_master?: string;
  price?: number;
  logo?: string;
  picture?: string;
  banner?: string;
  favicon?: string;
}

export interface SiteFilters {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  available?: boolean;
  admin_available?: boolean;
  frontend_available?: boolean;
  is_customer?: boolean;
  type?: SiteType;
  per_page?: number;
  page?: number;
}

export interface SitePaginationMeta {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

export interface SitesListResponse {
  success: boolean;
  data: SiteListItem[];
  meta: SitePaginationMeta;
}

export interface SiteResponse {
  success: boolean;
  data: Site;
  message?: string;
}

export interface ToggleAvailabilityData {
  site_ids: number[];
  available: YesNo;
  scope: 'site' | 'admin' | 'frontend';
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    success: boolean;
    error?: string;
  };
}
