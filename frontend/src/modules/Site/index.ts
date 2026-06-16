/**
 * Site Module Barrel Export
 * Exposes public API of the module
 */

// Superadmin exports
export { default as SitesTable } from './superadmin/components/SitesTable';
export { default as SiteFormModal } from './superadmin/components/SiteFormModal';
export { default as SiteDetailModal } from './superadmin/components/SiteDetailModal';
export { SitesList, useSitesContext } from './superadmin/components/SitesList';

export { useSites } from './superadmin/hooks/useSites';
export { useSite } from './superadmin/hooks/useSite';

export { siteService } from './superadmin/services/siteService';

// Types
export type {
  Site,
  SiteListItem,
  CreateSiteData,
  UpdateSiteData,
  SiteFilters,
  SitePaginationMeta,
  SiteType,
  YesNo,
} from './types/site.types';
