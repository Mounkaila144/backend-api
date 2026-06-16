import {
  object,
  string,
  number,
  optional,
  union,
  literal,
} from 'valibot'
import type { InferInput } from 'valibot'

// ---------------------------------------------------------------------------
// Dates & Statuses (main meeting details)
// ---------------------------------------------------------------------------

export const meetingDetailsEditSchema = object({
  // Dates
  in_at: optional(string()),
  out_at: optional(string()),
  callback_at: optional(string()),
  opc_at: optional(string()),
  created_at: optional(string()),
  treated_at: optional(string()),

  // Statuses
  state_id: optional(number()),
  status_call_id: optional(number()),
  status_lead_id: optional(number()),

  // Ranges
  in_at_range_id: optional(number()),
  opc_range_id: optional(number()),

  // Type
  type_id: optional(number()),
})

export type MeetingDetailsEditFormData = InferInput<typeof meetingDetailsEditSchema>

// ---------------------------------------------------------------------------
// Team, Entities, Finance, Comments, Flags
// ---------------------------------------------------------------------------

export const teamEditSchema = object({
  // Team
  telepro_id: optional(number()),
  sales_id: optional(number()),
  sale2_id: optional(number()),
  assistant_id: optional(number()),
  created_by_id: optional(number()),
  confirmator_id: optional(number()),

  // Entities
  campaign_id: optional(number()),
  callcenter_id: optional(number()),
  company_id: optional(number()),
  polluter_id: optional(number()),
  partner_layer_id: optional(number()),

  // Finance
  turnover: optional(number()),

  // Comments
  remarks: optional(string()),
  sale_comments: optional(string()),

  // Flags
  see_with_mr: optional(union([literal('YES'), literal('NO')])),
  see_with_mrs: optional(union([literal('YES'), literal('NO')])),
  is_qualified: optional(union([literal('YES'), literal('NO')])),
  status: optional(union([literal('ACTIVE'), literal('DELETE')])),
})

export type TeamEditFormData = InferInput<typeof teamEditSchema>

// ---------------------------------------------------------------------------
// Customer (editable when meeting is un-hold)
// ---------------------------------------------------------------------------

export const customerEditSchema = object({
  customer: optional(object({
    gender: optional(string()),
    lastname: optional(string()),
    firstname: optional(string()),
    phone: optional(string()),
    email: optional(string()),
    mobile: optional(string()),
    mobile2: optional(string()),
    company: optional(string()),
    address: optional(object({
      address1: optional(string()),
      address2: optional(string()),
      postcode: optional(string()),
      city: optional(string()),
    })),
  })),
})

export type CustomerEditFormData = InferInput<typeof customerEditSchema>

// ---------------------------------------------------------------------------
// Domoprime (fiscal, habitat, surfaces)
// ---------------------------------------------------------------------------

export const domoprimeEditSchema = object({
  // Fiscal
  revenue: optional(number()),
  number_of_people: optional(number()),
  number_of_parts: optional(number()),
  declarants: optional(string()),
  number_of_fiscal: optional(number()),

  // Habitat
  energy_id: optional(number()),
  previous_energy_id: optional(number()),
  occupation_id: optional(number()),
  layer_type_id: optional(number()),
  pricing_id: optional(number()),
  more_2_years: optional(union([literal('YES'), literal('NO')])),

  // Surfaces
  surface_home: optional(number()),
  surface_ite: optional(number()),
  surface_wall: optional(number()),
  surface_top: optional(number()),
  surface_floor: optional(number()),
  parcel_surface: optional(number()),
})

export type DomoprimeEditFormData = InferInput<typeof domoprimeEditSchema>
