import {
  object,
  string,
  number,
  optional,
  union,
  literal,
  array,
} from 'valibot'
import type { InferInput } from 'valibot'

// ---------------------------------------------------------------------------
// Edit: Customer (all fields optional since editing existing customer)
// ---------------------------------------------------------------------------

export const customerEditSchema = object({
  customer: object({
    gender: optional(string()),
    lastname: optional(string()),
    firstname: optional(string()),
    phone: optional(string()),
    email: optional(string()),
    mobile: optional(string()),
    mobile2: optional(string()),
    company: optional(string()),
    union_id: optional(number()),
    address: object({
      address1: optional(string()),
      address2: optional(string()),
      postcode: optional(string()),
      city: optional(string()),
    }),
  }),
})

export type CustomerEditFormData = InferInput<typeof customerEditSchema>

// ---------------------------------------------------------------------------
// Edit: Contract Details (dates, TVA, reference, remarks)
// The edit module has its own schema — independent of the wizard's field split.
// ---------------------------------------------------------------------------

export const contractDetailsSchema = object({
  quoted_at: optional(string()),
  billing_at: optional(string()),
  opened_at: optional(string()),
  opc_at: optional(string()),
  sent_at: optional(string()),
  payment_at: optional(string()),
  apf_at: optional(string()),
  sav_at: optional(string()),
  pre_meeting_at: optional(string()),
  doc_at: optional(string()),
  closed_at: optional(string()),
  has_tva: optional(string()),
  reference: optional(string()),
  remarks: optional(string()),

  // Additional fields from wizard
  total_price_with_taxe: optional(number()),
  tax_id: optional(number()),
  total_price_without_taxe: optional(number()),
  company_id: optional(number()),
  financial_partner_id: optional(number()),
  partner_layer_id: optional(number()),
  state_id: optional(number()),
  opc_range_id: optional(number()),
  sav_at_range_id: optional(number()),
})

export type ContractDetailsFormData = InferInput<typeof contractDetailsSchema>

// ---------------------------------------------------------------------------
// Edit: Team, Finance & Status
// ---------------------------------------------------------------------------

export const teamFinanceSchema = object({
  // Team
  telepro_id: optional(number()),
  sale_1_id: optional(number()),
  sale_2_id: optional(number()),
  manager_id: optional(number()),
  assistant_id: optional(number()),
  installer_user_id: optional(number()),
  team_id: optional(number()),

  // Finance
  financial_partner_id: optional(number()),
  tax_id: optional(number()),
  total_price_without_taxe: optional(number()),
  total_price_with_taxe: optional(number()),
  mensuality: optional(number()),
  advance_payment: optional(number()),
  state_id: optional(number()),

  // References
  company_id: optional(number()),
  polluter_id: optional(number()),
  partner_layer_id: optional(number()),
  campaign_id: optional(number()),
  sous_traitant_id: optional(number()),
  opc_range_id: optional(number()),
  sav_at_range_id: optional(number()),

  // Reports
  rapport_installation: optional(string()),
  rapport_temps: optional(string()),

  // Other
  periode_cee: optional(string()),
  surface_parcelle: optional(string()),

  // Status
  install_state_id: optional(number()),
  admin_status_id: optional(number()),
  opc_status_id: optional(number()),
  time_state_id: optional(number()),
  is_signed: optional(union([literal('YES'), literal('NO')])),
  is_billable: optional(union([literal('YES'), literal('NO')])),
  status: optional(union([literal('ACTIVE'), literal('DELETE')])),
})

export type TeamFinanceFormData = InferInput<typeof teamFinanceSchema>

// ---------------------------------------------------------------------------
// Edit: ISO (Fiscal & Habitat)
// ---------------------------------------------------------------------------

export const isoEditSchema = object({
  // Fiscal
  ana_prime: optional(number()),
  number_of_people: optional(number()),
  revenue: optional(number()),
  number_of_fiscal: optional(number()),
  declarants: optional(string()),
  number_of_parts: optional(number()),

  // Fiscal supplement
  number_of_children: optional(number()),
  tax_credit_used: optional(number()),

  // Home
  surface_home: optional(number()),
  surface_top: optional(number()),
  surface_wall: optional(number()),
  surface_floor: optional(number()),
  surface_ite: optional(number()),
  boiler_quantity: optional(number()),
  pack_quantity: optional(number()),
  energy_id: optional(number()),
  previous_energy_id: optional(number()),
  occupation_id: optional(number()),
  more_2_years: optional(union([literal('YES'), literal('NO')])),
  parcel_reference: optional(string()),
  pricing_id: optional(number()),
  parcel_surface: optional(number()),
  layer_type_id: optional(number()),

  // Surfaces Installateur
  install_surface_top: optional(number()),
  install_surface_wall: optional(number()),
  install_surface_floor: optional(number()),
})

export type IsoEditFormData = InferInput<typeof isoEditSchema>

// ---------------------------------------------------------------------------
// Edit: Fiscal Verification
// ---------------------------------------------------------------------------

export const verifEditSchema = object({
  verif: array(
    object({
      reference: optional(string()),
      number: optional(string()),
    })
  ),
})

export type VerifEditFormData = InferInput<typeof verifEditSchema>
