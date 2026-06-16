// ============================================================================
// AppDomoprime Module - Public API Exports
// ============================================================================
// This file serves as the public API for the AppDomoprime module
// following the barrel export pattern for clean imports
// ============================================================================

// Admin Layer Services
export {
  domoprimeIsoService,
  domoprimeReferenceService,
  domoprimeCalculationService,
  domoprimeQuotationService,
  domoprimeBillingService,
  domoprimeAssetService,
} from './admin/services/domoprimeService';

// Admin Layer Hooks
export { useDomoprimeFilterOptions } from './admin/hooks/useDomoprimeFilterOptions';
export { useDomoprimeIsoRequest } from './admin/hooks/useDomoprimeIsoRequest';

// Type Exports
export type {

  // Reference entities
  DomoprimeEnergy,
  DomoprimeClass,
  DomoprimeRegion,
  DomoprimeZone,
  DomoprimeSector,
  DomoprimeSubventionType,
  DomoprimeOccupation,
  DomoprimeTypeLayer,

  // ISO module
  DomoprimeIsoCustomerRequest,
  CreateIsoCustomerRequestData,
  UpdateIsoCustomerRequestData,

  // Calculation
  DomoprimeCalculation,

  // Quotation
  DomoprimeQuotation,
  DomoprimeQuotationProduct,
  DomoprimeQuotationProductItem,

  // Billing
  DomoprimeBilling,
  DomoprimeBillingProduct,
  DomoprimeBillingProductItem,

  // Asset
  DomoprimeAsset,
  DomoprimeAssetProduct,
  DomoprimeAssetProductItem,

  // Simulation
  DomoprimeIsoSimulation,

  // Config
  DomoprimePolluterClass,
  DomoprimePolluterProperty,
  DomoprimeProductCalculation,
  DomoprimeClassRegionPrice,

  // API Response types
  DomoprimeIsoRequestResponse,
  DomoprimeIsoRequestListResponse,
  DomoprimeCalculationResponse,
  DomoprimeQuotationResponse,
  DomoprimeQuotationListResponse,
  DomoprimeBillingResponse,
  DomoprimeAssetResponse,

  // Filter options
  FilterOption,
  DomoprimeFilterOptions,
  DomoprimeFilterOptionsResponse,
} from './types';
