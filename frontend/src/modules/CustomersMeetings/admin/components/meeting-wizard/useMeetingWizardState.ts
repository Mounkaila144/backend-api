'use client'

import { useState, useCallback } from 'react'

import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  customerSchema,
  meetingDetailsSchema,
  teamSchema,
} from './meetingFormSchema'
import type {
  CustomerFormData,
  MeetingDetailsFormData,
  TeamFormData,
} from './meetingFormSchema'
import type { CreateMeetingData } from '../../../types'

const TOTAL_STEPS = 4

export function useMeetingWizardState() {
  const [activeStep, setActiveStep] = useState(0)

  const customerForm = useForm<CustomerFormData>({
    resolver: valibotResolver(customerSchema),
    defaultValues: {
      customer: {
        gender: '',
        lastname: '',
        firstname: '',
        phone: '',
        email: '',
        mobile: '',
        mobile2: '',
        company: '',
        address: { address1: '', address2: '', postcode: '', city: '' },
      },
    },
  })

  const detailsForm = useForm<MeetingDetailsFormData>({
    resolver: valibotResolver(meetingDetailsSchema),
    defaultValues: {
      in_at: '',
      out_at: '',
      callback_at: '',
      opc_at: '',
      created_at: '',
      treated_at: '',
      state_id: undefined,
      status_call_id: undefined,
      status_lead_id: undefined,
      in_at_range_id: undefined,
      opc_range_id: undefined,
    },
  })

  const teamForm = useForm<TeamFormData>({
    resolver: valibotResolver(teamSchema),
    defaultValues: {
      telepro_id: undefined,
      sales_id: undefined,
      sale2_id: undefined,
      assistant_id: undefined,
      campaign_id: undefined,
      callcenter_id: undefined,
      company_id: undefined,
      polluter_id: undefined,
      partner_layer_id: undefined,
      turnover: undefined,
      remarks: '',
      sale_comments: '',
      see_with_mr: undefined,
      see_with_mrs: undefined,
      is_qualified: undefined,
      status: 'ACTIVE',
    },
  })

  const formByStep = [customerForm, detailsForm, teamForm] as const

  const handleNext = useCallback(async () => {
    if (activeStep < formByStep.length) {
      const currentForm = formByStep[activeStep]
      const valid = await currentForm.trigger()

      if (!valid) return false
    }

    setActiveStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1))

    return true
  }, [activeStep, formByStep])

  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }, [])

  const getCombinedFormData = useCallback((): CreateMeetingData => {
    const customer = customerForm.getValues()
    const details = detailsForm.getValues()
    const team = teamForm.getValues()

    const data: CreateMeetingData = {
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

      // Team
      telepro_id: team.telepro_id,
      sales_id: team.sales_id,
      sale2_id: team.sale2_id,
      assistant_id: team.assistant_id,
      campaign_id: team.campaign_id,
      callcenter_id: team.callcenter_id,
      company_id: team.company_id,
      polluter_id: team.polluter_id,
      partner_layer_id: team.partner_layer_id,
      turnover: team.turnover,
      remarks: team.remarks || undefined,
      sale_comments: team.sale_comments || undefined,
      see_with_mr: team.see_with_mr,
      see_with_mrs: team.see_with_mrs,
      is_qualified: team.is_qualified,
      status: team.status ?? 'ACTIVE',
    }

    data.customer = {
      gender: customer.customer?.gender || undefined,
      lastname: customer.customer?.lastname ?? '',
      firstname: customer.customer?.firstname ?? '',
      phone: customer.customer?.phone ?? '',
      email: customer.customer?.email || undefined,
      mobile: customer.customer?.mobile || undefined,
      mobile2: customer.customer?.mobile2 || undefined,
      company: customer.customer?.company || undefined,
      address: {
        address1: customer.customer?.address?.address1 ?? '',
        address2: customer.customer?.address?.address2 || undefined,
        postcode: customer.customer?.address?.postcode ?? '',
        city: customer.customer?.address?.city ?? '',
      },
    }

    return data
  }, [customerForm, detailsForm, teamForm])

  const resetAll = useCallback(() => {
    setActiveStep(0)
    customerForm.reset()
    detailsForm.reset()
    teamForm.reset()
  }, [customerForm, detailsForm, teamForm])

  return {
    activeStep,
    totalSteps: TOTAL_STEPS,
    customerForm,
    detailsForm,
    teamForm,
    handleNext,
    handleBack,
    getCombinedFormData,
    resetAll,
  }
}
