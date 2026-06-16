import {
  object,
  string,
  number,
  optional,
  pipe,
  nonEmpty,
  union,
  literal,
} from 'valibot'
import type { InferInput } from 'valibot'

// ---------------------------------------------------------------------------
// Step 0 – Customer
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
// Step 1 – Dates & Statuses
// All dates are optional in schema since "remove" credentials can hide them.
// Visual "required" is handled in the component.
// ---------------------------------------------------------------------------

export const meetingDetailsSchema = object({
  in_at: optional(string()),
  out_at: optional(string()),
  callback_at: optional(string()),
  opc_at: optional(string()),
  created_at: optional(string()),
  treated_at: optional(string()),
  state_id: optional(number()),
  status_call_id: optional(number()),
  status_lead_id: optional(number()),
  in_at_range_id: optional(number()),
  opc_range_id: optional(number()),
})

export type MeetingDetailsFormData = InferInput<typeof meetingDetailsSchema>

// ---------------------------------------------------------------------------
// Step 2 – Team & Details
// ---------------------------------------------------------------------------

export const teamSchema = object({
  telepro_id: optional(number()),
  sales_id: optional(number()),
  sale2_id: optional(number()),
  assistant_id: optional(number()),
  campaign_id: optional(number()),
  callcenter_id: optional(number()),
  company_id: optional(number()),
  polluter_id: optional(number()),
  partner_layer_id: optional(number()),
  turnover: optional(number()),
  remarks: optional(string()),
  sale_comments: optional(string()),
  see_with_mr: optional(union([literal('YES'), literal('NO')])),
  see_with_mrs: optional(union([literal('YES'), literal('NO')])),
  is_qualified: optional(union([literal('YES'), literal('NO')])),
  status: optional(union([literal('ACTIVE'), literal('DELETE')])),
})

export type TeamFormData = InferInput<typeof teamSchema>
