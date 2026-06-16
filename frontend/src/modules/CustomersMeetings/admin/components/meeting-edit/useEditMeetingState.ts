'use client'

import { useState, useCallback } from 'react'

import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  meetingDetailsEditSchema,
  teamEditSchema,
  customerEditSchema,
  domoprimeEditSchema,
} from './editFormSchema'
import type {
  MeetingDetailsEditFormData,
  TeamEditFormData,
  CustomerEditFormData,
  DomoprimeEditFormData,
} from './editFormSchema'
import type { CustomerMeeting, UpdateMeetingData } from '../../../types'

function formatDateForInput(value: string | null | undefined): string {
  if (!value) return ''
  const d = new Date(value)

  if (isNaN(d.getTime())) return ''

  const pad = (n: number) => String(n).padStart(2, '0')

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function normalizeOptionalId(value: number | string | null | undefined): number | undefined {
  if (value == null) return undefined
  const numeric = Number(value)

  if (!Number.isFinite(numeric) || numeric <= 0) return undefined

  return numeric
}

function resolveId(
  directId: number | null | undefined,
  relation: { id: number | string } | null | undefined
): number | undefined {
  return normalizeOptionalId(directId) ?? normalizeOptionalId(relation?.id)
}

export function useEditMeetingState() {
  const [activeTab, setActiveTab] = useState(0)
  const [meeting, setMeeting] = useState<CustomerMeeting | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detailsForm = useForm<MeetingDetailsEditFormData>({
    resolver: valibotResolver(meetingDetailsEditSchema),
    defaultValues: {},
  })

  const teamForm = useForm<TeamEditFormData>({
    resolver: valibotResolver(teamEditSchema),
    defaultValues: {},
  })

  const customerForm = useForm<CustomerEditFormData>({
    resolver: valibotResolver(customerEditSchema),
    defaultValues: { customer: { address: {} } },
  })

  const domoprimeForm = useForm<DomoprimeEditFormData>({
    resolver: valibotResolver(domoprimeEditSchema),
    defaultValues: {},
  })

  const loadMeeting = useCallback(
    async (
      id: number,
      fetchFn: (id: number) => Promise<CustomerMeeting | null>
    ) => {
      setLoading(true)
      setError(null)
      setActiveTab(0)

      try {
        const data = await fetchFn(id)

        if (!data) {
          setError('Meeting not found')
          
return
        }

        setMeeting(data)

        // Details form
        detailsForm.reset({
          in_at: formatDateForInput(data.in_at),
          out_at: formatDateForInput(data.out_at),
          callback_at: formatDateForInput(data.callback_at),
          opc_at: formatDateForInput(data.opc_at),
          created_at: formatDateForInput(data.creation_at),
          treated_at: formatDateForInput(data.treated_at),
          state_id: normalizeOptionalId(data.state_id),
          status_call_id: normalizeOptionalId(data.status_call_id),
          status_lead_id: normalizeOptionalId(data.status_lead_id),
          in_at_range_id: normalizeOptionalId(data.in_at_range_id),
          opc_range_id: normalizeOptionalId(data.opc_range_id),
          type_id: normalizeOptionalId(data.type_id),
        })

        // Team form
        teamForm.reset({
          telepro_id: resolveId(data.telepro_id, data.telepro),
          sales_id: resolveId(data.sales_id, data.sales),
          sale2_id: resolveId(data.sale2_id, data.sale2),
          assistant_id: resolveId(data.assistant_id, data.assistant),
          created_by_id: resolveId(data.created_by_id, data.creator),
          confirmator_id: resolveId(data.confirmator_id, data.confirmator),
          campaign_id: resolveId(data.campaign_id, data.campaign),
          callcenter_id: resolveId(data.callcenter_id, data.callcenter),
          company_id: resolveId(data.company_id, data.company),
          polluter_id: resolveId(data.polluter_id, data.polluter),
          partner_layer_id: resolveId(data.partner_layer_id, data.partner_layer),
          turnover: data.turnover ?? undefined,
          remarks: data.remarks ?? '',
          sale_comments: data.sale_comments ?? '',
          see_with_mr: data.is_hold !== 'YES' ? (data as unknown as Record<string, string | undefined>).see_with_mr as 'YES' | 'NO' | undefined : undefined,
          see_with_mrs: data.is_hold !== 'YES' ? (data as unknown as Record<string, string | undefined>).see_with_mrs as 'YES' | 'NO' | undefined : undefined,
          is_qualified: data.is_qualified ?? undefined,
          status: data.status === 'ACTIVE' || data.status === 'DELETE' ? data.status : 'ACTIVE',
        })

        // Customer form (populated from meeting's customer)
        if (data.customer) {
          const addr = data.customer.address ?? data.customer.addresses?.[0]

          customerForm.reset({
            customer: {
              gender: data.customer.gender ?? '',
              lastname: data.customer.lastname ?? '',
              firstname: data.customer.firstname ?? '',
              phone: data.customer.phone ?? '',
              email: data.customer.email ?? '',
              mobile: data.customer.mobile ?? '',
              mobile2: data.customer.mobile2 ?? '',
              company: data.customer.company ?? '',
              address: {
                address1: addr?.address1 ?? '',
                address2: addr?.address2 ?? '',
                postcode: addr?.postcode ?? '',
                city: addr?.city ?? '',
              },
            },
          })
        }

        // Domoprime form (populated from meeting's domoprime_request)
        const dp = data.domoprime_request

        domoprimeForm.reset({
          revenue: dp?.revenue ?? undefined,
          number_of_people: dp?.number_of_people ?? undefined,
          number_of_parts: dp?.number_of_parts ?? undefined,
          declarants: dp?.declarants ?? '',
          number_of_fiscal: dp?.number_of_fiscal ?? undefined,
          energy_id: resolveId(dp?.energy_id, dp?.energy),
          previous_energy_id: resolveId(dp?.previous_energy_id, dp?.previous_energy),
          occupation_id: resolveId(dp?.occupation_id, dp?.occupation),
          layer_type_id: resolveId(dp?.layer_type_id, dp?.layer_type),
          pricing_id: resolveId(dp?.pricing_id, dp?.pricing),
          more_2_years: dp?.more_2_years ?? undefined,
          surface_home: dp?.surface_home ?? undefined,
          surface_ite: dp?.surface_ite ?? undefined,
          surface_wall: dp?.surface_wall ?? undefined,
          surface_top: dp?.surface_top ?? undefined,
          surface_floor: dp?.surface_floor ?? undefined,
          parcel_surface: dp?.parcel_surface ?? undefined,
        })
      } catch {
        setError('Error loading meeting')
      } finally {
        setLoading(false)
      }
    },
    [detailsForm, teamForm, customerForm, domoprimeForm]
  )

  const getFormData = useCallback((): UpdateMeetingData => {
    const details = detailsForm.getValues()
    const team = teamForm.getValues()
    const customer = customerForm.getValues()

    const merged: UpdateMeetingData = {
      // Dates
      in_at: details.in_at || undefined,
      out_at: details.out_at || undefined,
      callback_at: details.callback_at || undefined,
      opc_at: details.opc_at || undefined,
      creation_at: details.created_at || undefined,
      treated_at: details.treated_at || undefined,

      // Statuses
      state_id: details.state_id,
      status_call_id: details.status_call_id,
      status_lead_id: details.status_lead_id,

      // Ranges
      in_at_range_id: details.in_at_range_id,
      opc_range_id: details.opc_range_id,

      // Type
      type_id: details.type_id,

      // Team
      telepro_id: team.telepro_id,
      sales_id: team.sales_id,
      sale2_id: team.sale2_id,
      assistant_id: team.assistant_id,
      confirmator_id: team.confirmator_id,

      // Entities
      campaign_id: team.campaign_id,
      callcenter_id: team.callcenter_id,
      company_id: team.company_id,
      polluter_id: team.polluter_id,
      partner_layer_id: team.partner_layer_id,

      // Finance
      turnover: team.turnover,

      // Comments
      remarks: team.remarks || undefined,
      sale_comments: team.sale_comments || undefined,

      // Flags
      see_with_mr: team.see_with_mr,
      see_with_mrs: team.see_with_mrs,
      is_qualified: team.is_qualified,
      status: team.status ?? 'ACTIVE',
    }

    // Customer data
    if (customer.customer) {
      const c = customer.customer
      const hasCustomerData = c.lastname || c.firstname || c.phone

      if (hasCustomerData) {
        merged.customer = {
          gender: c.gender || undefined,
          lastname: c.lastname ?? '',
          firstname: c.firstname ?? '',
          phone: c.phone ?? '',
          email: c.email || undefined,
          mobile: c.mobile || undefined,
          mobile2: c.mobile2 || undefined,
          company: c.company || undefined,
          address: {
            address1: c.address?.address1 ?? '',
            address2: c.address?.address2 || undefined,
            postcode: c.address?.postcode ?? '',
            city: c.address?.city ?? '',
          },
        }
      }
    }

    // Domoprime data
    const domoprime = domoprimeForm.getValues()

    const dpCleaned = Object.fromEntries(
      Object.entries(domoprime).filter(([, v]) => {
        if (v === undefined) return false
        if (typeof v === 'string' && v === '') return false

        return true
      })
    )

    if (Object.keys(dpCleaned).length > 0) {
      ;(merged as Record<string, unknown>).domoprime_request = dpCleaned
    }

    // Clean empty strings and undefined from top-level
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => {
        if (v === undefined) return false
        if (typeof v === 'string' && v === '') return false

        return true
      })
    ) as UpdateMeetingData

    // Keep nested objects
    if (merged.customer) {
      cleaned.customer = merged.customer
    }

    if ((merged as Record<string, unknown>).domoprime_request) {
      ;(cleaned as Record<string, unknown>).domoprime_request = (merged as Record<string, unknown>).domoprime_request
    }

    return cleaned
  }, [detailsForm, teamForm, customerForm, domoprimeForm])

  const resetAll = useCallback(() => {
    setMeeting(null)
    setActiveTab(0)
    setError(null)
    setLoading(false)
    setSubmitting(false)
    detailsForm.reset({})
    teamForm.reset({})
    customerForm.reset({ customer: { address: {} } })
    domoprimeForm.reset({})
  }, [detailsForm, teamForm, customerForm, domoprimeForm])

  return {
    activeTab,
    setActiveTab,
    meeting,
    loading,
    submitting,
    setSubmitting,
    error,
    setError,
    detailsForm,
    teamForm,
    customerForm,
    domoprimeForm,
    loadMeeting,
    getFormData,
    resetAll,
  }
}
