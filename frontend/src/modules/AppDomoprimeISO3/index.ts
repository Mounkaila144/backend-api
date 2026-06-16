// ============================================================================
// AppDomoprimeISO3 Module - Public API Exports
// ============================================================================
// This file serves as the public API for the AppDomoprimeISO3 module
// following the barrel export pattern for clean imports
// ============================================================================

// Admin Layer Services
export {
  iso3ResultsService,
  iso3SettingsService,
  iso3PreviousEnergyService,
  iso3PricingService,
  iso3QuotationService,
  iso3ExportService,
  iso3CompanyDocsService,
} from './admin/services/iso3Service';

// Admin Layer Hooks
export { useIso3Dates } from './admin/hooks/useIso3Dates';
export { useIso3PreviousEnergies } from './admin/hooks/useIso3PreviousEnergies';
export { useIso3PolluterPricing } from './admin/hooks/useIso3PolluterPricing';

// Type Exports
export type {

  // ISO3 Type Date
  Iso3TypeDate,
  SaveTypeDateData,

  // Previous Energy
  Iso3PreviousEnergy,
  Iso3I18n,
  CreatePreviousEnergyData,
  UpdatePreviousEnergyData,

  // Polluter Pricing
  Iso3PolluterClassSectorEnergy,
  CreatePolluterSectorEnergyData,
  Iso3CumacSurfaceCoefficient,
  SaveCoefficientData,
  Iso3ProductSurfaceCoefficient,

  // Master Products
  Iso3MasterProduct,
  Iso3MasterProductItem,

  // Quotation creation
  CreateQuotationMeetingData,
  CreateQuotationContractData,
  UpdateQuotationMeetingData,
  UpdateQuotationContractData,
  QuotationProductInput,
  QuotationProductItemInput,

  // Simulation
  Iso3SimulationInput,
  Iso3SimulationResult,

  // Contract Results
  Iso3ContractResultsData,
  Iso3ContractResultsInfo,
  Iso3ContractResultsCumac,
  Iso3ContractResultsCumacPrice,
  Iso3ContractResultsResponse,

  // ANAH Results
  Iso3AnahOnlyData,
  Iso3AnahResultsData,
  Iso3AnahResultsResponse,

  // API Response types
  Iso3TypeDateListResponse,
  Iso3TypeDateSaveResponse,
  Iso3PreviousEnergyListResponse,
  Iso3PreviousEnergyResponse,
  Iso3PolluterPricingListResponse,
  Iso3PolluterPricingResponse,
  Iso3MasterProductListResponse,
  Iso3SubventionTypeListResponse,
  Iso3QuotationResponse,
  Iso3QuotationListResponse,
  Iso3BillingListResponse,
  Iso3SimulationResponse,
  Iso3ImportResponse,

  // Company Models & Document Signatures
  CompanyModel,
  CompanyDocSignature,
  CompanyModelListResponse,
  CompanyDocSignatureListResponse,
} from './types';
