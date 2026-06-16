// ============================================================================
// CustomersContracts Module - TypeScript Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// Status Entities
// ----------------------------------------------------------------------------

export interface ContractStatus {
  id: number;
  name: string;
  color: string;
  icon: string;
  value?: string;
}

export interface ContractAdminStatus {
  id: number;
  name: string;
  color: string;
  icon: string;
  value?: string;
}

export interface ContractInstallStatus {
  id: number;
  name: string;
  color: string;
  icon: string;
  value?: string;
}

export interface NamedRelation {
  id: number;
  name: string;
}

export interface PolluterRelation {
  id: number;
  name: string;
  commercial?: string;
  type?: string;
}

// ----------------------------------------------------------------------------
// Customer & Address (nested in contract)
// ----------------------------------------------------------------------------

export interface CustomerAddress {
  id: number;
  address1: string;
  address2: string;
  postcode: string;
  city: string;
  country: string;
}

export interface ContractCustomer {
  id: number;
  company?: string;
  gender?: string | null;
  firstname: string;
  lastname: string;
  nom_prenom?: string;
  email?: string;
  phone: string;
  mobile?: string;
  mobile2?: string;
  phone1?: string;
  telephone?: string;
  birthday?: string | null;
  age?: string | null;
  occupation?: string | null;
  salary?: string | null;
  union_id?: number;
  address?: CustomerAddress;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// ----------------------------------------------------------------------------
// Contract Product
// ----------------------------------------------------------------------------

export interface ContractProduct {
  id: number;
  contract_id: number;
  product_id: number;
  details: string;
  product?: {
    id: number;
    name: string;
    reference?: string;
    price?: number;
  };
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Contract Contributor
// ----------------------------------------------------------------------------

export interface ContractContributor {
  id: number;
  type: string;
  contract_id: number;
  user_id: number;
  attribution_id: number;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Contract History
// ----------------------------------------------------------------------------

export interface ContractHistory {
  id: number;
  contract_id: number;
  user_id: number;
  user_application: 'admin' | 'superadmin';
  history: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
  };
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// Domoprime Calculation (nested in contract list)
// ----------------------------------------------------------------------------

export interface ContractCalculation {
  status: string;
  status_i18n: string;
  is_accepted: boolean;
}

// ----------------------------------------------------------------------------
// Main Contract Entity (Updated to match backend structure)
// ----------------------------------------------------------------------------

export interface CustomerContract {
  id: number;
  reference: string;

  // Customer (nested object)
  customer?: ContractCustomer;
  customer_id: number;

  // Dates (both old and new field names for compatibility)
  quoted_at?: string | null;
  billing_at?: string | null;
  opened_at?: string | null;
  sent_at?: string | null;
  payment_at?: string | null;
  opc_at?: string | null;
  apf_at?: string | null;
  date_ouverture?: string | null;
  date_envoi?: string | null;
  date_paiement?: string | null;
  date_opc?: string | null;
  date_apf?: string | null;

  // Additional IDs
  meeting_id?: number | null;
  financial_partner_id?: number | null;
  tax_id?: number | null;
  team_id?: number | null;
  opened_at_range_id?: number | null;
  opc_range_id?: number | null;
  company_id?: number | null;

  // Signature status
  is_signed?: 'YES' | 'NO';
  variables?: any;

  // Access & Source
  acces_1: string | null;
  acces_2: string | null;
  source: string | null;
  periode_cee: string | null;
  surface_parcelle: string | null;
  societe_porteuse: string | null;

  // Team & Staff IDs (support both naming conventions)
  regie_callcenter?: number;
  telepro_id?: number;
  commercial_1_id?: number;
  commercial_2_id?: number;
  sale_1_id?: number;
  sale_2_id?: number;
  manager_id?: number;
  assistant_id?: number;
  installateur_id?: number | null;
  installer_user_id?: number | null;
  createur_id?: number | null;
  created_by_id?: number | null;
  confirmateur_id?: number | null;
  equipe_installation?: string | null;
  sous_traitant_id?: number | null;

  // Status Fields (support both naming conventions)
  status_contrat_id?: number;
  status_contrat?: ContractStatus;
  state_id?: number;
  contract_status?: ContractStatus;
  status_installation_id?: number | null;
  status_installation?: ContractInstallStatus | null;
  install_state_id?: number | null;
  install_status?: ContractInstallStatus | null;
  status_admin_id?: number | null;
  status_admin?: ContractAdminStatus | null;
  admin_status_id?: number | null;
  admin_status?: ContractAdminStatus | null;
  opc_status_id?: number | null;
  opc_status?: ContractStatus | null;
  time_state_id?: number | null;
  time_status?: ContractStatus | null;

  // Boolean Flags (frontend mapped)
  confirme?: boolean;
  facturable?: boolean;
  bloque?: boolean;
  devis_bloque?: boolean;
  has_photos?: boolean;
  controle_qualite_valide?: boolean;
  has_documents?: boolean;

  // Boolean Flags (API returns string values)
  is_confirmed?: 'YES' | 'NO';
  is_hold?: 'YES' | 'NO';
  is_hold_admin?: 'YES' | 'NO';
  is_hold_quote?: 'YES' | 'NO';
  is_billable?: 'YES' | 'NO';
  is_document?: 'Y' | 'N';
  is_photo?: 'Y' | 'N';
  is_quality?: 'Y' | 'N';

  // Computed state flags (from backend based on state_id vs settings)
  is_cancelled?: boolean;
  is_blowing?: boolean;
  is_placement?: boolean;

  // Reports
  rapport_temps: string | null;
  rapport_admin: string | null;
  rapport_attribution: string | null;
  rapport_installation: string | null;

  // Financial (support both naming conventions)
  montant_ttc?: number;
  montant_ht?: number;
  total_price_with_taxe?: number;
  total_price_without_taxe?: number;
  mensuality?: number;
  advance_payment?: number;

  // Campaign
  campaign_id?: number | null;
  campaign?: NamedRelation | null;

  // Contributors (attributions)
  contributor_summary?: string | null;

  // Domoprime surfaces (from variables JSON)
  surface_home?: string | number | null;
  surface_top?: string | number | null;
  surface_wall?: string | number | null;
  surface_floor?: string | number | null;
  surface_parcel?: string | number | null;

  // Domoprime pricing & class
  pricing?: string | null;
  class_energy?: string | null;

  // Domoprime calculation (cumac status)
  calculation?: ContractCalculation | null;

  // Prime Rénov (via customer)
  prime_renov?: {
    reference?: string | null;
    amount?: number | null;
    state1?: string | null;
    state2?: string | null;
  } | null;

  // Other Fields
  esclave?: string | null;
  actif?: boolean;
  status?: 'ACTIVE' | 'DELETE';
  status_flag?: 'ACTIVE' | 'DELETE';
  remarques?: string;
  remarks?: string;
  sav_at_range_id?: number;

  // Relation objects (from backend ContractListResource)
  sale1?: NamedRelation | null;
  sale2?: NamedRelation | null;
  telepro?: NamedRelation | null;
  assistant?: NamedRelation | null;
  team?: NamedRelation | null;
  financial_partner?: NamedRelation | null;
  partner_layer?: NamedRelation | null;
  polluter?: PolluterRelation | null;
  company?: NamedRelation | null;
  creator?: NamedRelation | null;
  installer_user?: NamedRelation | null;
  tax?: { id: number; rate: number } | null;

  // Missing dates (from backend)
  sav_at?: string | null;
  pre_meeting_at?: string | null;
  doc_at?: string | null;
  closed_at?: string | null;

  // Additional IDs (from detail endpoint)
  polluter_id?: number | null;
  partner_layer_id?: number | null;

  // Relations (optional, loaded on demand)
  products?: ContractProduct[];
  contributors?: ContractContributor[];
  history?: ContractHistory[];

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface ContractListResponse {
  success: boolean;
  data: {
    contracts: CustomerContract[];
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      from: number | null;
      to: number | null;
    };
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
}

export interface ContractDetailResponse {
  success: boolean;
  data: CustomerContract;
}

export interface ContractStatsResponse {
  success: boolean;
  data: {
    total_contracts: number;
    total_signed: number;
    total_unsigned: number;
    total_revenue: number;
    by_status: Array<{
      status_id: number;
      status_name: string;
      count: number;
    }>;
    by_install_status: Array<{
      status_id: number;
      status_name: string;
      count: number;
    }>;
    recent_contracts: number;
  };
}

export interface ContractHistoryResponse {
  success: boolean;
  data: ContractHistory[];
}

export interface ContractActionResponse {
  success: boolean;
  action: string;
  id: number;
  state?: { icon: string; color: string };
  state_i18n?: string;
  message: string;
}

// ----------------------------------------------------------------------------
// Filter Types (Updated to match backend fields)
// ----------------------------------------------------------------------------

export interface ContractFilters {

  // Search & Basic Filters
  reference?: string;
  customer_id?: number;
  remarques?: string;
  search_lastname?: string;
  search_phone?: string;
  search_city?: string;
  search_id?: string;
  postcode?: string;

  // Status Filters (backend param names)
  state_id?: number | string;
  install_state_id?: number | string;
  admin_status_id?: number | string;
  opc_status_id?: number | string;
  time_state_id?: number | string;
  status?: string;

  // Team & Staff Filters (backend param names)
  telepro_id?: number | string;
  sale_1_id?: number | string;
  sale_2_id?: number | string;
  assistant_id?: number | string;
  created_by_id?: number | string;
  installer_user_id?: number | string;
  team_id?: number | string;
  campaign_id?: number | string;

  // Partner Filters
  financial_partner_id?: number | string;
  partner_layer_id?: number | string;
  polluter_id?: number | string;
  company_id?: number | string;

  // Date Range Selects (Symfony template lines 374-395)
  opc_range_id?: number | string;
  sav_at_range_id?: number | string;

  // Domoprime status (plugin filter)
  domoprime_status?: string;

  // Boolean Filters (YES/NO, Y/N)
  is_confirmed?: string;
  is_hold?: string;
  is_hold_quote?: string;
  is_billable?: string;
  is_document?: string;
  is_photo?: string;
  is_quality?: string;
  is_signed?: string;

  // Date Range Filters
  opened_at_from?: string;
  opened_at_to?: string;
  opc_at_from?: string;
  opc_at_to?: string;
  sav_at_from?: string;
  sav_at_to?: string;
  payment_at_from?: string;
  payment_at_to?: string;
  signed_at_from?: string;
  signed_at_to?: string;
  created_at_from?: string;
  created_at_to?: string;

  // Financial Filters
  price_min?: number;
  price_max?: number;

  // Pagination & Sorting
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  lang?: string;

  // Allow additional dynamic filter params
  [key: string]: any;
}

// ----------------------------------------------------------------------------
// Form Data Types (Updated to match backend structure)
// ----------------------------------------------------------------------------

export interface CreateContractData {
  reference?: string;
  customer_id?: number;

  // Dates (API expects these field names)
  quoted_at?: string;
  billing_at?: string;
  opened_at?: string;
  opc_at?: string;
  date_ouverture?: string;
  date_envoi?: string;
  date_paiement?: string;
  date_opc?: string;
  date_apf?: string;

  // Nested customer data (for creating new customer with contract)
  customer?: {
    gender?: string;
    lastname: string;
    firstname: string;
    phone: string;
    email?: string;
    mobile?: string;
    mobile2?: string;
    company?: string;
    union_id?: number;
    address: {
      address1: string;
      address2?: string;
      postcode: string;
      city: string;
    };
  };

  // Additional date fields
  sent_at?: string;
  payment_at?: string;
  apf_at?: string;
  sav_at?: string;
  pre_meeting_at?: string;
  doc_at?: string;
  closed_at?: string;

  // Range IDs
  opened_at_range_id?: number;
  opc_range_id?: number;
  sav_at_range_id?: number;

  // Status IDs
  state_id?: number;
  install_state_id?: number;
  admin_status_id?: number;
  opc_status_id?: number;
  time_state_id?: number;

  // Finance
  total_price_with_taxe?: number;
  total_price_without_taxe?: number;
  has_tva?: string;
  mensuality?: number;
  advance_payment?: number;
  remarks?: string;
  variables?: any;
  is_signed?: 'YES' | 'NO';
  is_billable?: 'YES' | 'NO';
  status?: 'ACTIVE' | 'DELETE';

  // References
  company_id?: number;
  team_id?: number;
  meeting_id?: number;
  financial_partner_id?: number;
  tax_id?: number;
  polluter_id?: number;
  partner_layer_id?: number;
  campaign_id?: number;

  // Access & Source
  acces_1?: string;
  acces_2?: string;
  source?: string;
  periode_cee?: string;
  surface_parcelle?: string;
  societe_porteuse?: string;

  // Team & Staff
  regie_callcenter?: number;
  telepro_id?: number;
  sale_1_id?: number;
  sale_2_id?: number;
  commercial_1_id?: number;
  commercial_2_id?: number;
  manager_id?: number;
  assistant_id?: number;
  installer_user_id?: number;
  installateur_id?: number;
  createur_id?: number;
  confirmateur_id?: number;
  equipe_installation?: string;
  sous_traitant_id?: number;

  // Status
  status_contrat_id?: number;
  status_installation_id?: number;
  status_admin_id?: number;

  // Boolean Flags
  confirme?: boolean;
  facturable?: boolean;
  bloque?: boolean;
  devis_bloque?: boolean;
  has_photos?: boolean;
  controle_qualite_valide?: boolean;
  has_documents?: boolean;

  // Reports
  rapport_temps?: string;
  rapport_admin?: string;
  rapport_attribution?: string;
  rapport_installation?: string;

  // Financial
  montant_ttc?: number;
  montant_ht?: number;

  // Other
  esclave?: string;
  actif?: boolean;
  status_flag?: 'ACTIVE' | 'DELETE';
  remarques?: string;

  // Products
  products?: Array<{
    product_id: number;
    details?: string;
  }>;

  // Fiscal verification (dynamic array, sent at root level)
  verif?: Array<{ reference?: string; number?: string }>;

  // ISO / Domoprime data (sent as separate object, matches Symfony params.CustomerContract.iso)
  iso?: {

    // Fiscal
    ana_prime?: number;
    number_of_people?: number;
    revenue?: number;
    number_of_fiscal?: number;
    declarants?: string;
    number_of_parts?: number;

    // Fiscal supplement
    number_of_children?: number;
    tax_credit_used?: number;

    // Home
    surface_top?: number;
    surface_wall?: number;
    surface_floor?: number;
    surface_ite?: number;
    boiler_quantity?: number;
    pack_quantity?: number;
    energy_id?: number;
    previous_energy_id?: number;
    occupation_id?: number;
    more_2_years?: 'YES' | 'NO';
    parcel_reference?: string;
    pricing_id?: number;
    parcel_surface?: number;
    layer_type_id?: number;

    // Surfaces installateur
    install_surface_top?: number;
    install_surface_wall?: number;
    install_surface_floor?: number;
  };
}

export interface UpdateContractData extends Partial<CreateContractData> {}

// ----------------------------------------------------------------------------
// Utility Types
// ----------------------------------------------------------------------------

export type ContractSortField =
  | 'reference'
  | 'customer_id'
  | 'date_ouverture'
  | 'date_paiement'
  | 'date_opc'
  | 'montant_ttc'
  | 'created_at'
  | 'updated_at';

export type ContractStatusType = 'ACTIVE' | 'DELETE';
export type ContractUserApplication = 'admin' | 'superadmin';

// ----------------------------------------------------------------------------
// Filter Options (dropdown data from /contracts/filter-options)
// ----------------------------------------------------------------------------

export interface FilterOption {
  id: number | string;
  name: string;
}

export interface ContractFilterOptions {
  contract_statuses: FilterOption[];
  install_statuses: FilterOption[];
  admin_statuses: FilterOption[];
  opc_statuses: FilterOption[];
  time_statuses: FilterOption[];
  users: FilterOption[];
  teams: FilterOption[];
  companies: FilterOption[];
  financial_partners: FilterOption[];
  partner_layers: FilterOption[];
  polluters: FilterOption[];
  campaigns: FilterOption[];
  date_ranges: FilterOption[];
  domoprime_statuses: FilterOption[];
  products: FilterOption[];
  zones: FilterOption[];
  energies: FilterOption[];
  sectors: FilterOption[];
  classes: FilterOption[];
  quotation_signed: FilterOption[];
  document_signed: FilterOption[];
}

export interface FilterOptionsResponse {
  success: boolean;
  data: ContractFilterOptions;
}

// ----------------------------------------------------------------------------
// Tabs (dynamic, from TabsManager API)
// ----------------------------------------------------------------------------

export interface ContractTab {
  key: string;
  title: string;
  icon: string | null;
  component: string | null;
  help: string | null;
  module: string | null;
}

export interface ContractTabsResponse {
  success: boolean;
  data: ContractTab[];
}

// Generic response for tab data endpoints
export interface TabDataResponse<T> {
  success: boolean;
  data: T;
}

// Tab: Products
export interface ContractProductItem {
  id: number;
  product_id: number;
  reference: string | null;
  name: string | null;
  unit: string | null;
  quantity: number;
  purchase_price_ht: number;
  sale_price_ht: number;
  purchase_price_ttc: number;
  sale_price_ttc: number;
  total_purchase_ht: number;
  total_sale_ht: number;
  total_purchase_ttc: number;
  total_sale_ttc: number;
  details: string | null;
  is_one_shoot: boolean;
  created_at: string | null;
}

// Tab: Comments
export interface ContractCommentItem {
  id: number;
  comment: string;
  status: string;
  type: string;
  user: { id: number; name: string } | null;
  created_at: string | null;
}

// Tab: Emails
export interface ContractEmailItem {
  id: number;
  email: string;
  subject: string;
  body: string;
  is_sent: boolean;
  sent_at: string | null;
  user: { id: number; name: string } | null;
  created_at: string | null;
}

// Tab: SMS
export interface ContractSmsItem {
  id: number;
  mobile: string;
  message: string;
  send_at: string | null;
  created_at: string | null;
}

// Tab: Documents
export interface ContractDocumentItem {
  id: number;
  title: string;
  file: string;
  extension: string;
  created_at: string | null;
}

// Tab: Installations
export interface ContractInstallationItem {
  id: number;
  product: { id: number; reference: string; name: string } | null;
  installer: { id: number; name: string } | null;
  in_at: string | null;
  details: string | null;
  status: string;
  created_at: string | null;
}

// Tab: Billing (Factures Domoprime)
export interface ContractBillingItem {
  id: number;
  reference: string;
  dated_at: string | null;
  total_sale_ht: number;
  total_tax: number;
  total_sale_ttc: number;
  prime: number;
  tax_credit: number;
  qmac_value: number;
  number_of_people: number;
  number_of_children: number;
  tax_credit_used: number;
  rest_in_charge: number;
  tax_credit_limit: number;
  rest_in_charge_after_credit: number;
  tax_credit_available: number;
  creator: string | null;
  status: string;
  created_at: string | null;
}

// Tab: WhatsApp message
export interface ContractWhatsAppItem {
  id: number;
  mobile: string;
  message: string;
  user: { id: number; name: string } | null;
  send_at: string | null;
  created_at: string | null;
}

// Tab: Steps / Participants
export interface ContractStepsData {
  erdf: Record<string, unknown> | null;
  erdf_quotation: Record<string, unknown> | null;
  cityhall: Record<string, unknown> | null;
  consuel: { id: number; status_id: number; send_at: string | null; conformity: string; installer: string | null; remarks: string } | null;
  installation: { id: number; type: string; counter_at: string | null; linked_at: string | null; worked_at: string | null; installer: string | null } | null;
}

// Tab: Doc Check
export interface DocumentCheckerItem {
  id: number;
  name: string;
}

// Tab: Requests (Domoprime Calculations)
export interface ContractRequestItem {
  id: number;
  region: string | null;
  zone: string | null;
  sector: string | null;
  energy: string | null;
  class: string | null;
  revenue: number;
  number_of_people: number;
  qmac: number;
  qmac_value: number;
  status: string;
  is_last: string;
  causes: string | null;
  user: string | null;
  accepted_by: string | null;
  created_at: string | null;
}

// Tab: Avoirs (Assets)
export interface ContractAssetItem {
  id: number;
  reference: string;
  dated_at: string | null;
  total_ht: number;
  total_ttc: number;
  total_tax: number;
  billing_id: number | null;
  comments: string | null;
  creator: string | null;
  created_at: string | null;
}

// Tab: Localisation (Map)
export interface ContractLocalisation {
  lat: number;
  lng: number;
  address1: string;
  address2: string;
  postcode: string;
  city: string;
  country: string;
  full_address: string;
}
