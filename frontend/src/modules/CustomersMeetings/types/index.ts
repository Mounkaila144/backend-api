// ============================================================================
// CustomersMeetings Module - TypeScript Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// Status Entities
// ----------------------------------------------------------------------------

export interface MeetingStatus {
  id: number
  name: string
  color?: string
  icon?: string
  value?: string
}

export interface NamedRelation {
  id: number
  name: string
}

export interface PolluterRelation {
  id: number
  name: string
  commercial?: string
  type?: string
}

export interface OpcRangeRelation {
  id: number
  name: string
  color?: string | null
  from?: string
  to?: string
}

export interface InAtRangeRelation {
  id: number
  name: string
  color?: string | null
  value?: string
}

// ----------------------------------------------------------------------------
// Meeting Comment
// ----------------------------------------------------------------------------

export interface MeetingComment {
  id: number
  comment: string
  type?: string
  created_at?: string
}

// ----------------------------------------------------------------------------
// Customer & Address (nested in meeting)
// ----------------------------------------------------------------------------

export interface CustomerAddress {
  id: number
  address1: string
  address2?: string
  postcode?: string
  city?: string
  state?: string
  country?: string
  coordinates?: string
}

export interface MeetingCustomer {
  id: number
  company?: string
  gender?: string | null
  firstname: string
  lastname: string
  email?: string
  phone?: string
  mobile?: string
  mobile2?: string
  status?: string
  address?: CustomerAddress
  addresses?: CustomerAddress[]
}

// ----------------------------------------------------------------------------
// Meeting Product
// ----------------------------------------------------------------------------

export interface MeetingProduct {
  id: number
  meeting_id?: number
  product_id: number
  details?: string
  status?: string
  product?: {
    id: number
    name: string
    reference?: string
    price?: number
  }
}

// ----------------------------------------------------------------------------
// Meeting History
// ----------------------------------------------------------------------------

export interface MeetingHistory {
  id: number
  customer_id: number
  user_id: number
  old_status_id?: number
  new_status_id?: number
  comment?: string
  user?: {
    id: number
    firstname: string
    lastname: string
  }
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------------------
// Domoprime Request (fiscal, habitat, surfaces)
// ----------------------------------------------------------------------------

export interface DomoprimeRequest {
  id?: number

  // Fiscal
  revenue?: number
  number_of_people?: number
  number_of_children?: number
  number_of_fiscal?: number
  number_of_parts?: number
  declarants?: string

  // Surfaces
  surface_home?: number
  surface_wall?: number
  surface_top?: number
  surface_floor?: number
  surface_ite?: number
  parcel_surface?: number
  parcel_reference?: string

  // Habitat
  more_2_years?: 'YES' | 'NO'
  build_year?: string

  // FK IDs
  energy_id?: number | null
  previous_energy_id?: number | null
  occupation_id?: number | null
  layer_type_id?: number | null
  pricing_id?: number | null

  // Related entities
  energy?: NamedRelation | null
  previous_energy?: NamedRelation | null
  occupation?: NamedRelation | null
  layer_type?: NamedRelation | null
  pricing?: NamedRelation | null
}

// ----------------------------------------------------------------------------
// Main Meeting Entity (matches MeetingListResource)
// ----------------------------------------------------------------------------

export interface CustomerMeeting {
  id: number
  registration: string

  // Customer (nested object)
  customer?: MeetingCustomer
  customer_id?: number

  // Dates
  in_at?: string | null
  out_at?: string | null
  callback_at?: string | null
  creation_at?: string | null
  treated_at?: string | null
  confirmed_at?: string | null
  opc_at?: string | null
  state_updated_at?: string | null
  callback_cancel_at?: string | null
  lock_time?: string | null

  // Users (relation objects from backend)
  telepro_id?: number
  telepro?: NamedRelation | null
  sales_id?: number
  sales?: NamedRelation | null
  sale2_id?: number
  sale2?: NamedRelation | null
  assistant_id?: number
  assistant?: NamedRelation | null
  created_by_id?: number
  creator?: NamedRelation | null
  confirmator_id?: number
  confirmator?: NamedRelation | null
  confirmed_by_id?: number
  confirmed_by?: NamedRelation | null
  lock_user_id?: number
  lock_user?: NamedRelation | null

  // Statuses
  state_id?: number
  meeting_status?: MeetingStatus | null
  status_call_id?: number
  status_call?: MeetingStatus | null
  status_lead_id?: number
  status_lead?: MeetingStatus | null

  // Type & Campaign
  type_id?: number
  meeting_type?: MeetingStatus | null
  campaign_id?: number
  campaign?: NamedRelation | null

  // Partners
  callcenter_id?: number
  callcenter?: NamedRelation | null
  partner_layer_id?: number
  partner_layer?: NamedRelation | null
  polluter_id?: number
  polluter?: PolluterRelation | null
  company_id?: number
  company?: NamedRelation | null

  // Ranges
  in_at_range_id?: number
  in_at_range?: InAtRangeRelation | null
  opc_range_id?: number
  opc_range?: OpcRangeRelation | null

  // Financial
  turnover?: number

  // Domoprime ISO surfaces
  surface_top?: number
  surface_wall?: number
  surface_floor?: number

  // Flags (API returns string values)
  is_confirmed?: 'YES' | 'NO'
  is_hold?: 'YES' | 'NO'
  is_hold_quote?: 'YES' | 'NO'
  is_qualified?: 'YES' | 'NO'
  is_works_hold?: 'Y' | 'N'
  is_locked?: 'YES' | 'NO'
  is_callback_cancelled?: 'YES' | 'NO'
  transferred?: boolean | 'YES' | 'NO' | 0 | 1 | '0' | '1' | null

  // Computed state flags (from backend)
  is_cancelled?: boolean

  // Status
  status?: 'ACTIVE' | 'DELETE' | 'INPROGRESS'

  // Text
  remarks?: string
  sale_comments?: string
  variables?: any

  // Domoprime
  domoprime_request?: DomoprimeRequest | null

  // Relations (loaded on demand)
  products?: MeetingProduct[]
  history?: MeetingHistory[]
  comments?: MeetingComment[]

  // Timestamps
  created_at: string
  updated_at: string
}

// ----------------------------------------------------------------------------
// API Request/Response Types
// ----------------------------------------------------------------------------

export interface MeetingListResponse {
  success: boolean
  data: {
    meetings: CustomerMeeting[]
    pagination?: {
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number | null
      to: number | null
    }
  }
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number | null
    to: number | null
    permitted_fields?: string[]
  }
}

export interface MeetingDetailResponse {
  success: boolean
  data: CustomerMeeting
}

export interface MeetingActionResponse {
  success: boolean
  action: string
  id?: number
  state?: { icon: string; color: string }
  state_i18n?: string
  message?: string
  // Story M4 — populated when action is 'CreateContract'
  meeting_id?: number
  customer_id?: number
  contract_id?: number
  reference?: string
  quotations_migrated?: number
  already_existed?: boolean
}

export interface MeetingHistoryResponse {
  success: boolean
  data: MeetingHistory[]
}

// ----------------------------------------------------------------------------
// Filter Types (matches backend MeetingRepository filters)
// ----------------------------------------------------------------------------

export interface MeetingFilters {

  // Search
  search_lastname?: string
  search_phone?: string
  search_city?: string
  search_id?: string
  postcode?: string

  // Status
  state_id?: number | string
  status_call_id?: number | string
  status_lead_id?: number | string
  status?: string

  // Users
  telepro_id?: number | string
  sales_id?: number | string
  sale2_id?: number | string
  assistant_id?: number | string
  created_by_id?: number | string
  confirmator_id?: number | string

  // Entities
  type_id?: number | string
  campaign_id?: number | string
  callcenter_id?: number | string
  company_id?: number | string
  polluter_id?: number | string
  partner_layer_id?: number | string

  // Ranges
  in_at_range_id?: number | string
  opc_range_id?: number | string

  // Boolean
  is_confirmed?: string
  is_hold?: string
  is_hold_quote?: string
  is_qualified?: string
  is_locked?: string

  // Date ranges
  in_at_from?: string
  in_at_to?: string
  created_at_from?: string
  created_at_to?: string
  callback_at_from?: string
  callback_at_to?: string
  opc_at_from?: string
  opc_at_to?: string

  // Financial
  turnover_min?: number
  turnover_max?: number

  // Pagination & Sorting
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  per_page?: number
  page?: number
  lang?: string
  with_relations?: boolean

  [key: string]: any
}

// ----------------------------------------------------------------------------
// Form Data Types
// ----------------------------------------------------------------------------

export interface CreateMeetingData {
  customer_id?: number
  customer?: {
    gender?: string
    lastname: string
    firstname: string
    phone: string
    email?: string
    mobile?: string
    mobile2?: string
    company?: string
    union_id?: number
    address: {
      address1: string
      address2?: string
      postcode: string
      city: string
    }
  }
  in_at?: string
  out_at?: string
  callback_at?: string
  creation_at?: string
  opc_at?: string
  in_at_range_id?: number
  opc_range_id?: number
  state_id?: number
  status_call_id?: number
  status_lead_id?: number
  type_id?: number
  campaign_id?: number
  callcenter_id?: number
  company_id?: number
  polluter_id?: number
  partner_layer_id?: number
  telepro_id?: number
  sales_id?: number
  sale2_id?: number
  assistant_id?: number
  confirmator_id?: number
  turnover?: number
  remarks?: string
  sale_comments?: string
  see_with_mr?: 'YES' | 'NO'
  see_with_mrs?: 'YES' | 'NO'
  treated_at?: string
  variables?: any
  is_confirmed?: 'YES' | 'NO'
  is_hold?: 'YES' | 'NO'
  is_hold_quote?: 'YES' | 'NO'
  is_qualified?: 'YES' | 'NO'
  status?: 'ACTIVE' | 'DELETE'
  products?: Array<{ product_id: number; details?: string }>
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {}

// ----------------------------------------------------------------------------
// Filter Options (dropdown data from /meetings/filter-options)
// ----------------------------------------------------------------------------

export interface FilterOption {
  id: number | string
  name: string
}

export interface MeetingFilterOptions {
  meeting_statuses: FilterOption[]
  status_calls: FilterOption[]
  status_leads: FilterOption[]
  meeting_types: FilterOption[]
  campaigns: FilterOption[]
  date_ranges: FilterOption[]
  users: FilterOption[]
  companies: FilterOption[]
  callcenters: FilterOption[]
  partner_layers: FilterOption[]
  polluters: FilterOption[]
  products: FilterOption[]
  energies?: FilterOption[]
  previous_energies?: FilterOption[]
  occupations?: FilterOption[]
  layer_types?: FilterOption[]
  pricings?: FilterOption[]
}

export interface FilterOptionsResponse {
  success: boolean
  data: MeetingFilterOptions
}

// ----------------------------------------------------------------------------
// Schedule / Calendar Types
// ----------------------------------------------------------------------------

export interface ScheduleEventCustomer {
  id: number
  name: string
  phone?: string
  mobile?: string
  postcode?: string
  city?: string
  address?: string
}

export interface ScheduleEventStatus {
  id: number
  name: string
  color?: string
  icon?: string
}

export interface ScheduleEventUser {
  id: number
  name: string
}

export interface ScheduleEventExtendedProps {
  meeting_id: number
  registration: string
  customer: ScheduleEventCustomer | null
  status: ScheduleEventStatus | null
  status_call: ScheduleEventStatus | null
  telepro: ScheduleEventUser | null
  sales: ScheduleEventUser | null
  sale2: ScheduleEventUser | null
  assistant: ScheduleEventUser | null
  callcenter: ScheduleEventUser | null
  campaign: ScheduleEventUser | null
  is_confirmed: 'YES' | 'NO'
  in_at: string | null
  out_at: string | null
  remarks: string | null
}

export interface ScheduleEvent {
  id: number
  title: string
  start: string | null
  end: string | null
  backgroundColor: string
  borderColor: string
  extendedProps: ScheduleEventExtendedProps
}

export interface ScheduleResponse {
  success: boolean
  data: ScheduleEvent[]
  meta: {
    total: number
    start: string
    end: string
  }
}

export interface ScheduleFilters {
  start: string
  end: string
  status?: string
  telepro_id?: number | string
  sales_id?: number | string
  campaign_id?: number | string
  callcenter_id?: number | string
  state_id?: number | string
  status_call_id?: number | string
  status_lead_id?: number | string
  is_confirmed?: string
  postcode?: string
  in_telepro_id?: string
  in_sales_id?: string
  in_state_id?: string
  in_status_call_id?: string
  in_campaign_id?: string
  in_callcenter_id?: string
  lang?: string
  [key: string]: any
}

// ----------------------------------------------------------------------------
// Tour Generator Types
// ----------------------------------------------------------------------------

export interface TourMeetingInGroup {
  id: number
  order_in_group: number
  customer_name: string
  address: string
  postcode: string
  city: string
  in_at: string | null
  lat: number | null
  lng: number | null
}

export interface TourGroup {
  id: number
  sale_id: number | null
  salesperson?: { id: number; name: string } | null
  total_distance: number
  total_duration: number
  meetings: TourMeetingInGroup[]
}

export interface TourGeneratorMessage {
  type: 'info' | 'warning' | 'error' | 'success'
  text: string
}

export interface Tour {
  id: number
  date: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  created_at: string
}

export interface TourGenerateResponse {
  success: boolean
  data: {
    tour: Tour
    groups: TourGroup[]
    messages: TourGeneratorMessage[]
  }
  message?: string
}

export interface TourDetailResponse {
  success: boolean
  data: {
    tour: Tour
    groups: TourGroup[]
    available_salespeople: Array<{ id: number; name: string }>
  }
}

export interface TourIndicator {
  id: number
  date: string
  status: string
  groups_count: number
  meetings_count: number
}

export interface GenerateTourParams {
  date: string
  number_of_salespeople: number
  states?: number[]
}
