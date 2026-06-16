// ============================================================================
// AppDomoprimeISO3 Module - Type Definitions
// ============================================================================
// Types matching the Laravel backend Modules/AppDomoprimeISO3 entities
// and Symfony app_domoprime_iso3 module (multi-work quotations)
// ============================================================================

import type {
  DomoprimeEnergy,
  DomoprimeClass,
  DomoprimeSector,
  DomoprimeSubventionType,
  DomoprimeQuotation,
  DomoprimeQuotationProduct,
  DomoprimeBilling,
  FilterOption,
} from '@/modules/AppDomoprime';

// Re-export shared types used by this module
export type {
  DomoprimeEnergy,
  DomoprimeClass,
  DomoprimeSector,
  DomoprimeSubventionType,
  DomoprimeQuotation,
  DomoprimeQuotationProduct,
  DomoprimeBilling,
  FilterOption,
};

// ----------------------------------------------------------------------------
// Contract Results (CUMAC block from Symfony resultsForContract)
// ----------------------------------------------------------------------------

export interface Iso3ContractResultsInfo {
  zone: string | null;
  region: string | null;
  energy: string | null;
  revenue: number | null;
  level: string | null;
  number_of_people: number | null;
}

export interface Iso3ContractResultsCumacPrice {
  qmac: number | null;
  has_surface: boolean;
}

export interface Iso3ContractResultsCumac {
  prices: Iso3ContractResultsCumacPrice[];
  is_ana_available: boolean;
}

export interface Iso3ContractResultsAnah {
  engine: string;
  polluter_name: string | null;
  number_of_parts: number | null;
  level: string | null;
  is_available: boolean;
}

export interface Iso3ContractResultsData {
  has_polluter: boolean;
  engine_type: string | null;
  info: Iso3ContractResultsInfo | null;
  cumac: Iso3ContractResultsCumac | null;
  cumac_errors: string[];
  anah: Iso3ContractResultsAnah | null;
}

export interface Iso3ContractResultsResponse {
  success: boolean;
  data: Iso3ContractResultsData;
}

// ANAH-only results (Résultats ANAH tab - separate from CUMAC)
export interface Iso3AnahOnlyData {
  engine: string;
  polluter_name: string | null;
  zone: string | null;
  region: string | null;
  energy: string | null;
  revenue: number | null;
  number_of_people: number | null;
  number_of_parts: number | null;
  level: string | null;
  is_available: boolean;
}

export interface Iso3AnahResultsData {
  has_polluter: boolean;
  anah: Iso3AnahOnlyData | null;
  errors: string[];
}

export interface Iso3AnahResultsResponse {
  success: boolean;
  data: Iso3AnahResultsData;
}

// ----------------------------------------------------------------------------
// ISO3 Type Date (t_domoprime_iso_type_date)
// ----------------------------------------------------------------------------

export interface Iso3TypeDate {
  id: number;
  date: string | null;
  type: string;
  difference: number;
  adder: number;
  is_copied: 'YES' | 'NO';
  is_dated_copied: 'YES' | 'NO';
  created_at: string;
  updated_at: string;
}

export interface SaveTypeDateData {
  date: string | null;
  type: string;
  difference: number;
  adder: number;
  is_copied?: 'YES' | 'NO';
  is_dated_copied?: 'YES' | 'NO';
}

// ----------------------------------------------------------------------------
// Previous Energy (re-uses AppDomoprime t_domoprime_previous_energy)
// ----------------------------------------------------------------------------

export interface Iso3PreviousEnergy {
  id: number;
  name: string;
  translations?: Iso3I18n[];
}

export interface Iso3I18n {
  id: number;
  lang: string;
  value: string;
}

export interface CreatePreviousEnergyData {
  translations: Record<string, string>;
}

export type UpdatePreviousEnergyData = CreatePreviousEnergyData;

// ----------------------------------------------------------------------------
// Polluter Class Sector Energy (t_domoprime_polluter_class_sector_energy)
// ----------------------------------------------------------------------------

export interface Iso3PolluterClassSectorEnergy {
  id: number;
  energy_id: number;
  polluter_id: number;
  class_id: number;
  sector_id: number;
  price: number;
  created_at: string;
  updated_at: string;

  // Relations (loaded on demand)
  energy?: DomoprimeEnergy;
  domoprime_class?: DomoprimeClass;
  sector?: DomoprimeSector;
  coefficients?: Iso3CumacSurfaceCoefficient[];
}

export interface CreatePolluterSectorEnergyData {
  energy_id: number;
  class_id: number;
  sector_id: number;
  price: number;
}

// ----------------------------------------------------------------------------
// Cumac Surface Coefficients (t_domoprime_iso_cumac_class_region_price_surface)
// ----------------------------------------------------------------------------

export interface Iso3CumacSurfaceCoefficient {
  id: number;
  price_id: number;
  min: number;
  max: number;
  coef: number;
  created_at: string;
  updated_at: string;
}

export interface SaveCoefficientData {
  min: number;
  max: number;
  coef: number;
}

// ----------------------------------------------------------------------------
// Product Sector Energy Class Surface (t_domoprime_iso_product_sector_energy_class_surface)
// ----------------------------------------------------------------------------

export interface Iso3ProductSurfaceCoefficient {
  id: number;
  price_id: number;
  min: number;
  max: number;
  coef: number;
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Master Product (for quotation creation)
// ----------------------------------------------------------------------------

export interface Iso3MasterProduct {
  id: number;
  name: string;
  title: string;
  type: string;
  items?: Iso3MasterProductItem[];
}

export interface Iso3MasterProductItem {
  id: number;
  product_id: number;
  item_id: number;
  title: string;
  unit: string;
  coefficient: number;
  is_mandatory: 'YES' | 'NO';
  is_master: 'YES' | 'NO';
  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
}

// ----------------------------------------------------------------------------
// Quotation Meeting / Contract creation
// ----------------------------------------------------------------------------

export interface CreateQuotationMeetingData {
  meeting_id: number;
  customer_id: number;
  type: string;
  polluter_id?: number;
  subvention_type_id?: number;
  dated_at?: string;
  discount_amount?: number;
  products: QuotationProductInput[];
}

export interface CreateQuotationContractData {
  contract_id: number;
  customer_id: number;
  type: string;
  polluter_id?: number;
  subvention_type_id?: number;
  dated_at?: string;
  discount_amount?: number;
  products: QuotationProductInput[];
}

export interface QuotationProductInput {
  product_id: number;
  quantity: number;
  items?: QuotationProductItemInput[];
}

export interface QuotationProductItemInput {
  item_id: number;
  quantity: number;
  coefficient?: number;
}

export type CreateQuotationMode = 'standard' | 'advanced';

export interface Iso3NewQuotationProduct {
  contract_product_id: number;
  product_id: number;
  reference: string | null;
  title: string;
  unit: string | null;
  default_quantity: number;
}

export interface Iso3NewQuotationSubItem {
  id: number;
  is_default: boolean;
}

export interface Iso3NewQuotationItem {
  id: number;
  name: string;
  description: string | null;
  unit: string | null;
  default_price: number;
  default_quantity: number;
  is_default_checked: boolean;
  is_parent: boolean;
  sub_items: Iso3NewQuotationSubItem[];
}

export interface Iso3NewQuotationCategory {
  id: number;
  reference: string | null;
  title: string;
  unit: string | null;
  items: Iso3NewQuotationItem[];
}

export interface Iso3NewQuotationSelectorOption {
  id: number;
  product_id: number;
  label: string;
  sub_items: Iso3NewQuotationSubItem[];
}

export interface Iso3NewQuotationSubventionType {
  id: number;
  name: string;
  commercial: string | null;
  value: string;
}

export interface Iso3NewQuotationPermissions {
  can_set_dated_at: boolean;
  can_set_subvention_type: boolean;
  can_set_discount_amount: boolean;
}

export interface Iso3NewQuotationFormData {
  contract: {
    id: number;
    reference: string | null;
  };
  polluter: {
    id: number | null;
    name: string | null;
    commercial?: string | null;
    type: string;
  };
  mode: CreateQuotationMode;
  quantity_kind: 'surface_m2' | 'quantity';
  defaults: {
    dated_at: string | null;
    discount_amount: number;
    subvention_type_id: number | null;
  };
  permissions: Iso3NewQuotationPermissions;
  subvention_types: Iso3NewQuotationSubventionType[];
  product_categories: Iso3NewQuotationCategory[];
  product_selector_options: Iso3NewQuotationSelectorOption[];
  /** @deprecated kept for backward compatibility — empty in the new payload */
  products?: Iso3NewQuotationProduct[];
}

export interface Iso3NewQuotationFormResponse {
  success: boolean;
  data: Iso3NewQuotationFormData;
}

export interface Iso3QuotationEligibilityResponse {
  eligible: boolean;
  errors: string[];
}

export type UpdateQuotationMeetingData = Partial<CreateQuotationMeetingData>;
export type UpdateQuotationContractData = Partial<CreateQuotationContractData>;

// ----------------------------------------------------------------------------
// Simulation
// ----------------------------------------------------------------------------

export interface Iso3QuotationItemInput {
  item_id: number;
  quantity: number;
  price?: number;
  name?: string;
}

export interface Iso3SimulationInput {
  dated_at?: string;
  subvention_type_id?: number | null;
  // Manuel subvention overrides — Symfony's checkboxes (when checked, the
  // corresponding value below is used in the rest_in_charge formula instead
  // of the automatic one).
  ana_prime_check?: boolean;
  cee_prime_check?: boolean;
  discount_check?: boolean;
  ana_prime?: number;
  cee_prime?: number;
  discount_amount?: number;
  tva_rate?: number;
  items: Iso3QuotationItemInput[];
}

export type Iso3CreateQuotationInput = Iso3SimulationInput;

export interface Iso3SimulationItem {
  item_id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  total_without_tax: number;
  total_with_tax: number;
}

export interface Iso3SimulationResult {
  cumac: number;
  /** Auto-computed CEE prime (always returned). */
  cee_prime_auto: number;
  /** Effective value used in rest_in_charge (manual override if check is true, else auto). */
  cee_prime_effective: number;
  /** Auto-computed ANAH prime. */
  ana_prime_auto: number;
  ana_prime_effective: number;
  /** Auto-computed discount. */
  discount_auto: number;
  discount_effective: number;
  total_without_tax: number;
  total_tax: number;
  total_with_tax: number;
  rest_in_charge: number;
  tva_rate: number;
  items: Iso3SimulationItem[];
  /** @deprecated kept for back-compat with the old flat panel; mirror of cee_prime_effective. */
  cee_prime?: number;
  /** @deprecated mirror of ana_prime_effective. */
  ana_prime?: number;
  /** @deprecated mirror of cee_prime_effective. */
  prime_cee?: number;
}

export interface Iso3CreatedQuotation {
  id: number;
  reference: string;
  cee_prime: number;
  qmac_value: number;
  total_sale_without_tax: number;
  total_sale_with_tax: number;
  total_tax: number;
  rest_in_charge: number;
  is_last: string;
}

export interface Iso3CreateQuotationResponse {
  success: boolean;
  data: Iso3CreatedQuotation;
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------

export interface Iso3TypeDateListResponse {
  success: boolean;
  data: Iso3TypeDate[];
}

export interface Iso3TypeDateSaveResponse {
  success: boolean;
  data: Iso3TypeDate[];
  message?: string;
}

export interface Iso3PreviousEnergyListResponse {
  success: boolean;
  data: Iso3PreviousEnergy[];
}

export interface Iso3PreviousEnergyResponse {
  success: boolean;
  data: Iso3PreviousEnergy;
}

export interface Iso3PolluterPricingListResponse {
  success: boolean;
  data: Iso3PolluterClassSectorEnergy[];
}

export interface Iso3PolluterPricingResponse {
  success: boolean;
  data: Iso3PolluterClassSectorEnergy;
}

export interface Iso3MasterProductListResponse {
  success: boolean;
  data: Iso3MasterProduct[];
}

export interface Iso3SubventionTypeListResponse {
  success: boolean;
  data: DomoprimeSubventionType[];
}

export interface Iso3QuotationResponse {
  success: boolean;
  data: DomoprimeQuotation;
}

export interface Iso3QuotationListResponse {
  success: boolean;
  data: {
    quotations: DomoprimeQuotation[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface Iso3BillingListResponse {
  success: boolean;
  data: {
    billings: DomoprimeBilling[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface Iso3SimulationResponse {
  success: boolean;
  data: Iso3SimulationResult;
}

export interface Iso3ImportResponse {
  success: boolean;
  data: {
    imported: number;
    errors?: string[];
  };
  message?: string;
}

// ----------------------------------------------------------------------------
// Company Models & Document Signatures
// ----------------------------------------------------------------------------

export interface CompanyModel {
  id: number;
  name: string;
  value: string;
  fileUrl: string | null;
}

export interface CompanyDocSignature {
  id: number;
  modelName: string;
  isSigned: boolean;
  signedAt: string | null;
}

export interface CompanyModelListResponse {
  success: boolean;
  data: {
    models: CompanyModel[];
  };
}

export interface CompanyDocSignatureListResponse {
  success: boolean;
  data: {
    documents: CompanyDocSignature[];
  };
}
