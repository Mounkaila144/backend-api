// ============================================================================
// AppDomoprime Module - Type Definitions
// ============================================================================
// Types matching the Laravel backend Modules/AppDomoprime entities
// and Symfony app_domoprime_iso module (t_domoprime_iso_customer_request)
// ============================================================================

// ----------------------------------------------------------------------------
// Common Types
// ----------------------------------------------------------------------------

export interface NamedRelation {
  id: number;
  name: string;
}

export interface FilterOption {
  id: number | string;
  name: string;
}

// ----------------------------------------------------------------------------
// Reference / Configuration Entities
// ----------------------------------------------------------------------------

export interface DomoprimeEnergy {
  id: number;
  name: string;
  type: string;
  translations?: DomoprimeI18n[];
}

export interface DomoprimeClass {
  id: number;
  name: string;
  coef: number;
  color?: string | null;
  multiple?: number | null;
  multiple_floor?: number | null;
  multiple_top?: number | null;
  multiple_wall?: number | null;
  prime?: number | null;
  pack_prime?: number | null;
  coef_prime?: number | null;
  subvention?: number | null;
  bbc_subvention?: number | null;
  translations?: DomoprimeI18n[];
}

export interface DomoprimeRegion {
  id: number;
  name: string;
  zones?: DomoprimeZone[];
}

export interface DomoprimeZone {
  id: number;
  code: string;
  dept: string;
  region_id: number;
  sector: string;
  region?: DomoprimeRegion;
}

export interface DomoprimeSector {
  id: number;
  name: string;
}

export interface DomoprimeSubventionType {
  id: number;
  name: string;
  commercial: string;
}

export interface DomoprimeI18n {
  id: number;
  lang: string;
  value: string;
  body?: string;
}

// ----------------------------------------------------------------------------
// ISO Module Types (from Symfony app_domoprime_iso)
// Table: t_domoprime_iso_customer_request
// ----------------------------------------------------------------------------

export interface DomoprimeOccupation {
  id: number;
  name: string;
  translations?: DomoprimeI18n[];
}

export interface DomoprimeTypeLayer {
  id: number;
  name: string;
  translations?: DomoprimeI18n[];
}

export interface DomoprimeIsoCustomerRequest {
  id: number;
  meeting_id?: number | null;
  contract_id?: number | null;
  customer_id?: number | null;

  // Foreign keys (dropdowns)
  energy_id?: number | null;
  previous_energy_id?: number | null;
  occupation_id?: number | null;
  layer_type_id?: number | null;
  pricing_id?: number | null;
  engine_id?: number | null;

  // Surfaces (m2)
  surface_wall?: number | null;
  surface_top?: number | null;
  surface_floor?: number | null;
  src_surface_wall?: number | null;
  src_surface_top?: number | null;
  src_surface_floor?: number | null;
  install_surface_wall?: number | null;
  install_surface_top?: number | null;
  install_surface_floor?: number | null;
  surface_home?: number | null;
  surface_ite?: number | null;

  // People / Census
  number_of_people?: number | null;
  number_of_children?: number | null;
  number_of_fiscal?: number | null;
  number_of_parts?: number | null;
  declarants?: string | null;

  // Parcel
  parcel_surface?: number | null;
  parcel_reference?: string | null;

  // Equipment / Installation
  packboiler_quantity?: number | null;
  pack_quantity?: number | null;
  boiler_quantity?: number | null;
  ana_prime?: number | null;
  has_strainer?: 'Y' | 'N' | null;
  has_bbc?: 'Y' | 'N' | null;

  // Financial / Tax
  revenue?: number | null;
  tax_credit_used?: number | null;

  // Pricing per surface
  added_price_with_tax_wall?: number | null;
  added_price_without_tax_wall?: number | null;
  added_price_with_tax_top?: number | null;
  added_price_without_tax_top?: number | null;
  added_price_with_tax_floor?: number | null;
  added_price_without_tax_floor?: number | null;
  restincharge_price_with_tax_wall?: number | null;
  restincharge_price_without_tax_wall?: number | null;
  restincharge_price_with_tax_top?: number | null;
  restincharge_price_without_tax_top?: number | null;
  restincharge_price_with_tax_floor?: number | null;
  restincharge_price_without_tax_floor?: number | null;

  // Energy metrics
  cef?: number | null;
  cef_project?: number | null;
  cep?: number | null;
  cep_project?: number | null;
  power_consumption?: number | null;
  economy?: number | null;
  energy_class?: string | null;
  previous_energy_class?: string | null;

  // Property details
  counter_type_id?: number | null;
  equipment_type_id?: number | null;
  house_type_id?: number | null;
  roof_type1_id?: number | null;
  roof_type2_id?: number | null;
  build_year?: string | null;

  // More 2 years rule
  more_2_years?: 'YES' | 'NO' | null;

  // Relations (loaded on demand)
  energy?: DomoprimeEnergy | null;
  occupation?: DomoprimeOccupation | null;
  layer_type?: DomoprimeTypeLayer | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateIsoCustomerRequestData {
  contract_id?: number;
  meeting_id?: number;
  customer_id?: number;

  // Fiscal
  number_of_people?: number;
  number_of_children?: number;
  revenue?: number;
  number_of_fiscal?: number;
  tax_credit_used?: number;
  declarants?: string;

  // Habitat
  energy_id?: number;
  previous_energy_id?: number;
  occupation_id?: number;
  layer_type_id?: number;
  more_2_years?: 'YES' | 'NO';
  parcel_reference?: string;
  parcel_surface?: number;
  surface_home?: number;

  // Surfaces
  surface_top?: number;
  surface_wall?: number;
  surface_floor?: number;
  install_surface_top?: number;
  install_surface_wall?: number;
  install_surface_floor?: number;
  surface_ite?: number;

  // Equipment
  pricing_id?: number;
  engine_id?: number;
  packboiler_quantity?: number;
  pack_quantity?: number;
  boiler_quantity?: number;
  has_strainer?: 'Y' | 'N';
  has_bbc?: 'Y' | 'N';

  // Property
  counter_type_id?: number;
  equipment_type_id?: number;
  house_type_id?: number;
  roof_type1_id?: number;
  roof_type2_id?: number;
  build_year?: string;
}

export type UpdateIsoCustomerRequestData = Partial<CreateIsoCustomerRequestData>;

// ----------------------------------------------------------------------------
// Calculation Engine
// ----------------------------------------------------------------------------

export interface DomoprimeCalculation {
  id: number;
  signature?: string | null;

  // Location
  region_id: number;
  sector_id: number;
  zone_id: number;
  energy_id: number;
  class_id: number;

  // Occupancy
  revenue: number;
  number_of_people: number;
  number_of_parts: number;

  // QMAC
  qmac_value: number;
  qmac: number;
  purchasing_price: number;

  // Premiums
  prime?: number | null;
  cee_prime?: number | null;
  budget?: number | null;
  ana_prime?: number | null;
  ana_limit?: string | null;
  is_economy_valid: 'YES' | 'NO';
  is_ana_available: 'YES' | 'NO';

  // Subvention / Pricing
  subvention?: number | null;
  polluter_pricing?: number | null;
  budget_to_add_ttc?: number | null;
  budget_to_add_ht?: number | null;
  bbc_subvention?: number | null;

  // Technical
  beta_surface: number;
  economy: number;
  cumac_coefficient: number;
  min_cee: number;
  coef_sale_price: number;
  quotation_coefficient: number;
  cef_cef_project: number;
  margin: number;

  // References
  meeting_id?: number | null;
  contract_id?: number | null;
  customer_id?: number | null;
  work_id?: number | null;
  polluter_id?: number | null;
  engine_id?: number | null;
  pricing_id?: number | null;

  // Audit
  user_id: number;
  accepted_by_id: number;
  isLast: 'YES' | 'NO';
  status: string;
  causes?: string | null;

  number_of_quotations: number;
  is_quotations_valid?: string | null;

  // Relations
  region?: DomoprimeRegion;
  sector?: DomoprimeSector;
  zone?: DomoprimeZone;
  energy?: DomoprimeEnergy;
  domoprimeClass?: DomoprimeClass;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Quotation
// ----------------------------------------------------------------------------

export interface DomoprimeQuotation {
  id: number;
  reference: string;
  month: number;
  year: number;
  number_of_parts: number;
  dated_at?: string | null;
  mode?: string;
  type?: string;

  // Financial totals
  total_sale_with_tax: number;
  total_sale_without_tax: number;
  total_tax: number;
  total_purchase_with_tax: number;
  total_purchase_without_tax: number;
  taxes: number;
  tax_credit?: number | null;
  one_euro: number;

  // Sale variants
  total_sale_discount_with_tax: number;
  total_sale_discount_without_tax: number;
  total_sale_101_with_tax: number;
  total_sale_101_without_tax: number;
  total_sale_102_with_tax: number;
  total_sale_102_without_tax: number;
  total_sale_103_with_tax: number;
  total_sale_103_without_tax: number;

  // Added prices per surface
  total_added_with_tax_wall: number;
  total_added_with_tax_floor: number;
  total_added_with_tax_top: number;
  total_added_without_tax_wall: number;
  total_added_without_tax_floor: number;
  total_added_without_tax_top: number;

  // Rest in charge per surface
  total_restincharge_with_tax_wall: number;
  total_restincharge_with_tax_floor: number;
  total_restincharge_with_tax_top: number;
  total_restincharge_without_tax_wall: number;
  total_restincharge_without_tax_floor: number;
  total_restincharge_without_tax_top: number;

  // Premiums
  subvention: number;
  bbc_subvention: number;
  passoire_subvention: number;
  prime: number;
  cee_prime: number;
  pack_prime: number;
  ana_prime: number;
  ana_pack_prime: number;
  ite_prime: number;
  fixed_prime: number;
  fee_file: number;
  rest_in_charge: number;
  home_prime?: number | null;
  discount_amount?: number | null;
  qmac_value?: number | null;

  // Tax credit
  number_of_children: number;
  number_of_people: number;
  tax_credit_used: number;
  tax_credit_limit: number;
  rest_in_charge_after_credit: number;
  tax_credit_available: number;

  // References
  meeting_id?: number | null;
  customer_id: number;
  contract_id?: number | null;
  calculation_id?: number | null;
  company_id?: number | null;
  polluter_id?: number | null;
  creator_id: number;
  work_id?: number | null;
  subvention_type_id?: number | null;
  status_id: number;

  // Document
  comments: string;
  remarks?: string | null;
  header?: string | null;
  footer?: string | null;
  engine?: string | null;
  status: 'ACTIVE' | 'DELETE';
  is_signed: 'YES' | 'NO';
  signed_at?: string | null;
  is_last: 'YES' | 'NO';

  // Relations
  calculation?: DomoprimeCalculation;
  subventionType?: DomoprimeSubventionType;
  products?: DomoprimeQuotationProduct[];
  creator?: { id: number; firstname: string; lastname: string } | null;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Quotation Products
// ----------------------------------------------------------------------------

export interface DomoprimeQuotationProduct {
  id: number;
  quotation_id: number;
  product_id: number;
  meeting_id?: number;
  meeting_product_id?: number;
  work_id?: number;
  title: string;
  entitled: string;
  quantity: number;
  prime: number;
  tva_id: number;
  description?: string;
  details?: string;
  status: string;

  // Unit prices
  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  sale_standard_price_with_tax: number;
  sale_standard_price_without_tax: number;
  sale_discount_price_with_tax: number;
  sale_discount_price_without_tax: number;
  added_price_with_tax: number;
  added_price_without_tax: number;
  restincharge_price_with_tax: number;
  restincharge_price_without_tax: number;

  // Total prices
  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;
  total_sale_standard_price_with_tax: number;
  total_sale_standard_price_without_tax: number;
  total_sale_discount_price_with_tax: number;
  total_sale_discount_price_without_tax: number;
  total_added_price_with_tax: number;
  total_added_price_without_tax: number;
  total_restincharge_price_with_tax: number;
  total_restincharge_price_without_tax: number;

  items?: DomoprimeQuotationProductItem[];
}

export interface DomoprimeQuotationProductItem {
  id: number;
  quotation_id: number;
  quotation_product_id: number;
  product_id: number;
  product_item_id: number;
  item_id: number;
  title: string;
  entitled: string;
  quantity: number;
  unit: string;
  coefficient: number;
  tva_id: number;
  is_mandatory: 'YES' | 'NO';
  is_master: 'YES' | 'NO';
  description?: string;
  details?: string;
  status: string;

  // Same pricing structure as product
  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  sale_standard_price_with_tax: number;
  sale_standard_price_without_tax: number;
  sale_discount_price_with_tax: number;
  sale_discount_price_without_tax: number;
  added_price_with_tax: number;
  added_price_without_tax: number;
  restincharge_price_with_tax: number;
  restincharge_price_without_tax: number;

  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;
  total_sale_standard_price_with_tax: number;
  total_sale_standard_price_without_tax: number;
  total_sale_discount_price_with_tax: number;
  total_sale_discount_price_without_tax: number;
  total_added_price_with_tax: number;
  total_added_price_without_tax: number;
  total_restincharge_price_with_tax: number;
  total_restincharge_price_without_tax: number;
}

// ----------------------------------------------------------------------------
// Billing
// ----------------------------------------------------------------------------

export interface DomoprimeBilling {
  id: number;
  reference: string;
  month: number;
  day: number;
  year: number;
  dated_at?: string | null;
  mode?: string;
  type?: number | null;

  // Financial totals (same structure as quotation)
  total_sale_with_tax: number;
  total_sale_without_tax: number;
  total_tax: number;
  total_purchase_with_tax: number;
  total_purchase_without_tax: number;
  taxes: number;

  // Premiums (same as quotation)
  subvention: number;
  bbc_subvention: number;
  passoire_subvention: number;
  prime: number;
  cee_prime: number;
  pack_prime: number;
  ana_prime: number;
  ana_pack_prime: number;
  number_of_parts: number;
  ite_prime: number;
  fixed_prime: number;
  fee_file: number;
  rest_in_charge: number;
  home_prime?: number | null;
  discount_amount?: number | null;
  qmac_value?: number | null;
  tax_credit?: number | null;

  // Tax credit
  number_of_children: number;
  number_of_people: number;
  tax_credit_used: number;
  tax_credit_limit: number;
  rest_in_charge_after_credit: number;
  tax_credit_available: number;

  // References
  meeting_id?: number | null;
  contract_id?: number | null;
  calculation_id?: number | null;
  company_id?: number | null;
  polluter_id?: number | null;
  customer_id: number;
  creator_id: number;
  quotation_id: number;
  work_id?: number | null;
  subvention_type_id?: number | null;
  status_id: number;

  // Document
  comments: string;
  status: 'ACTIVE' | 'DELETE';
  is_last: 'YES' | 'NO';

  // Relations
  quotation?: DomoprimeQuotation;
  calculation?: DomoprimeCalculation;
  subventionType?: DomoprimeSubventionType;
  billingProducts?: DomoprimeBillingProduct[];

  created_at: string;
  updated_at: string;
}

export interface DomoprimeBillingProduct {
  id: number;
  billing_id: number;
  product_id: number;
  contract_id?: number;
  contract_product_id?: number;
  title: string;
  entitled: string;
  quantity: number;
  prime: number;
  tva_id: number;
  description?: string;
  details?: string;
  status: string;

  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;

  billingProductItems?: DomoprimeBillingProductItem[];
}

export interface DomoprimeBillingProductItem {
  id: number;
  billing_id: number;
  billing_product_id: number;
  product_id: number;
  product_item_id: number;
  item_id: number;
  title: string;
  entitled: string;
  quantity: number;
  unit: string;
  coefficient: number;
  tva_id: number;
  is_mandatory: 'YES' | 'NO';
  description?: string;
  details?: string;
  status: string;

  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;
}

// ----------------------------------------------------------------------------
// Asset
// ----------------------------------------------------------------------------

export interface DomoprimeAsset {
  id: number;
  reference: string;
  month: number;
  day: number;
  year: number;
  dated_at?: string | null;
  total_asset_without_tax: number;
  total_asset_with_tax: number;
  total_tax: number;

  meeting_id?: number | null;
  contract_id?: number | null;
  company_id?: number | null;
  customer_id: number;
  billing_id?: number | null;
  creator_id: number;
  work_id?: number | null;
  status_id: number;

  comments: string;
  status: 'ACTIVE' | 'DELETE';

  billing?: DomoprimeBilling;
  products?: DomoprimeAssetProduct[];

  created_at: string;
  updated_at: string;
}

export interface DomoprimeAssetProduct {
  id: number;
  asset_id: number;
  product_id: number;
  meeting_id?: number;
  meeting_product_id?: number;
  title: string;
  entitled: string;
  quantity: number;
  tva_id: number;
  description?: string;
  details?: string;
  status: string;

  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;

  items?: DomoprimeAssetProductItem[];
}

export interface DomoprimeAssetProductItem {
  id: number;
  asset_id: number;
  asset_product_id: number;
  product_id: number;
  product_item_id: number;
  item_id: number;
  title: string;
  entitled: string;
  quantity: number;
  unit: string;
  coefficient: number;
  tva_id: number;
  description?: string;
  details?: string;
  status: string;

  purchase_price_with_tax: number;
  purchase_price_without_tax: number;
  sale_price_with_tax: number;
  sale_price_without_tax: number;
  total_purchase_price_with_tax: number;
  total_purchase_price_without_tax: number;
  total_sale_price_with_tax: number;
  total_sale_price_without_tax: number;
}

// ----------------------------------------------------------------------------
// Simulation (ISO module)
// ----------------------------------------------------------------------------

export interface DomoprimeIsoSimulation {
  id: number;
  reference: string;
  month: number;
  year: number;
  dated_at?: string | null;
  total_sale_without_tax: number;
  total_purchase_without_tax: number;
  total_sale_with_tax: number;
  total_tax: number;
  total_purchase_with_tax: number;
  prime: number;

  meeting_id?: number | null;
  contract_id?: number | null;
  customer_id: number;
  creator_id: number;
  status_id: number;

  rest_in_charge_after_credit: number;
  tax_credit_limit: number;
  number_of_children: number;
  rest_in_charge: number;
  number_of_people: number;
  tax_credit_used: number;
  qmac_value: number;
  tax_credit: number;
  tax_credit_available: number;
  one_euro: 'YES' | 'NO';

  comments: string;
  is_last: 'YES' | 'NO';
  status: 'ACTIVE' | 'DELETE';

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Polluter Configuration
// ----------------------------------------------------------------------------

export interface DomoprimePolluterClass {
  id: number;
  polluter_id: number;
  class_id?: number | null;
  coef: number;
  multiple?: number | null;
  multiple_floor?: number | null;
  multiple_top?: number | null;
  multiple_wall?: number | null;
  ite_coef?: number | null;
  pack_coef?: number | null;
  boiler_coef?: number | null;
  prime?: number | null;
  pack_prime?: number | null;
  ite_prime?: number | null;
  ana_prime?: number | null;
  bbc_prime?: number | null;
  strainer_prime?: number | null;
  bbc_article_prime?: number | null;
  strainer_article_prime?: number | null;
  max_limit?: number | null;
  ana_limit?: number | null;

  domoprimeClass?: DomoprimeClass;

  created_at: string;
  updated_at: string;
}

export interface DomoprimePolluterProperty {
  id: number;
  polluter_id: number;
  prime: number;
  ite_prime?: number | null;
  ana_prime?: number | null;
  pack_prime: number;
  home_prime?: number | null;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Product Calculation
// ----------------------------------------------------------------------------

export interface DomoprimeProductCalculation {
  id: number;
  calculation_id: number;
  product_id: number;
  work_id?: number | null;
  qmac_value: number;
  qmac: number;
  surface: number;
  purchasing_price: number;
  margin: number;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Class Region Pricing
// ----------------------------------------------------------------------------

export interface DomoprimeClassRegionPrice {
  id: number;
  region_id: number;
  class_id: number;
  number_of_people: number;
  price: number;

  region?: DomoprimeRegion;
  domoprimeClass?: DomoprimeClass;

  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// API Response Types
// ----------------------------------------------------------------------------

export interface DomoprimeIsoRequestResponse {
  success: boolean;
  data: DomoprimeIsoCustomerRequest;
}

export interface DomoprimeIsoRequestListResponse {
  success: boolean;
  data: {
    requests: DomoprimeIsoCustomerRequest[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface DomoprimeCalculationResponse {
  success: boolean;
  data: DomoprimeCalculation;
}

export interface DomoprimeQuotationResponse {
  success: boolean;
  data: DomoprimeQuotation;
}

export interface DomoprimeQuotationListResponse {
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

export interface DomoprimeBillingResponse {
  success: boolean;
  data: DomoprimeBilling;
}

export interface DomoprimeAssetResponse {
  success: boolean;
  data: DomoprimeAsset;
}

// ----------------------------------------------------------------------------
// Filter Options (dropdown data for forms)
// ----------------------------------------------------------------------------

export interface DomoprimeFilterOptions {
  energies: FilterOption[];
  occupations: FilterOption[];
  layer_types: FilterOption[];
  pricings: FilterOption[];
  previous_energies: FilterOption[];
  classes: FilterOption[];
  regions: FilterOption[];
  zones: FilterOption[];
  sectors: FilterOption[];
  subvention_types: FilterOption[];
}

export interface DomoprimeFilterOptionsResponse {
  success: boolean;
  data: DomoprimeFilterOptions;
}
