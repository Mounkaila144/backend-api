import {
  object,
  string,
  number,
  optional,
  pipe,
  nonEmpty,
  union,
  literal,
  array,
} from 'valibot'
import type { InferInput } from 'valibot'

// ---------------------------------------------------------------------------
// Step 1 – Customer (always new)
// ---------------------------------------------------------------------------

export const customerSchema = object({
  customer: object({
    gender: optional(string()),
    lastname: pipe(string(), nonEmpty('Required')),
    firstname: pipe(string(), nonEmpty('Required')),
    phone: pipe(string(), nonEmpty('Required')),
    email: optional(string()),
    mobile: optional(string()),
    mobile2: optional(string()),
    company: optional(string()),
    union_id: optional(number()),
    address: object({
      address1: pipe(string(), nonEmpty('Required')),
      address2: optional(string()),
      postcode: pipe(string(), nonEmpty('Required')),
      city: pipe(string(), nonEmpty('Required')),
    }),
  }),
})

export type CustomerFormData = InferInput<typeof customerSchema>

// ---------------------------------------------------------------------------
// Step 2 – Contract Details (dates + reference + remarks)
// All dates are optional in schema since "remove" credentials can hide them.
// Visual "required" is handled in the component.
// ---------------------------------------------------------------------------

export const contractDetailsSchema = object({
  // Dates (all from template lines 4-121)
  sav_at: optional(string()),
  pre_meeting_at: optional(string()),
  quoted_at: optional(string()),
  opened_at: optional(string()),
  billing_at: optional(string()),
  doc_at: optional(string()),
  opc_at: optional(string()),
  payment_at: optional(string()),
  apf_at: optional(string()),
  closed_at: optional(string()),

  // TVA & Finance (template lines 123-157)
  has_tva: optional(string()),
  total_price_with_taxe: optional(number()),
  tax_id: optional(number()),
  total_price_without_taxe: optional(number()),

  // References (template lines 166-198)
  company_id: optional(number()),
  financial_partner_id: optional(number()),
  remarks: optional(string()),
  partner_layer_id: optional(number()),

  // State & Ranges (template lines 199-228)
  state_id: optional(number()),
  opc_range_id: optional(number()),
  sav_at_range_id: optional(number()),
})

export type ContractDetailsFormData = InferInput<typeof contractDetailsSchema>

// ---------------------------------------------------------------------------
// Step 3 – Team, Finance & Status (all optional)
// ---------------------------------------------------------------------------

export const teamFinanceSchema = object({
  // Team (attribution credentials)
  telepro_id: optional(number()),
  sale_1_id: optional(number()),
  sale_2_id: optional(number()),
  manager_id: optional(number()),
  assistant_id: optional(number()),
  installer_user_id: optional(number()),
  team_id: optional(number()),

  // Finance (remaining — prices/tax/financial_partner moved to contractDetailsSchema)
  mensuality: optional(number()),
  advance_payment: optional(number()),

  // Additional references
  polluter_id: optional(number()),
  campaign_id: optional(number()),

  // Sous-traitant
  sous_traitant_id: optional(number()),

  // Reports
  rapport_installation: optional(string()),
  rapport_temps: optional(string()),

  // Other
  periode_cee: optional(string()),
  surface_parcelle: optional(string()),

  // Status (state_id moved to contractDetailsSchema)
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
// Step 3 – Fiscal et Habitat
// Template sources:
//   1) services_impot_verif_newForContract.tpl  (fiscal verification)
//   2) app_domoprime_iso_requestForNewContract2.tpl (fiscal + habitat + financial)
// Permission: "Fiscal supplement" section gated by contract_new_fiscal_supplement
// ---------------------------------------------------------------------------

export const isoSchema = object({
  // Fiscal (template 2, section "Fiscal")
  ana_prime: optional(number()),
  number_of_people: optional(number()),
  revenue: optional(number()),
  number_of_fiscal: optional(number()),
  declarants: optional(string()),
  number_of_parts: optional(number()),

  // Fiscal supplement (permission: contract_new_fiscal_supplement)
  number_of_children: optional(number()),
  tax_credit_used: optional(number()),

  // Home (template 2, section "Home")
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

  // Surfaces Installateur (template 2)
  install_surface_top: optional(number()),
  install_surface_wall: optional(number()),
  install_surface_floor: optional(number()),
})

export type IsoFormData = InferInput<typeof isoSchema>

// ---------------------------------------------------------------------------
// Step 3 – Fiscal Verification (dynamic add/remove pairs)
// Template source: services_impot_verif_newForContract.tpl
// ---------------------------------------------------------------------------

export const verifSchema = object({
  verif: array(
    object({
      reference: optional(string()),
      number: optional(string()),
    })
  ),
})

export type VerifFormData = InferInput<typeof verifSchema>
