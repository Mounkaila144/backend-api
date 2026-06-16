'use client'

import { useState, useCallback } from 'react'

import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  customerSchema,
  contractDetailsSchema,
  teamFinanceSchema,
  isoSchema,
  verifSchema,
} from './contractFormSchema'
import type {
  CustomerFormData,
  ContractDetailsFormData,
  TeamFinanceFormData,
  IsoFormData,
  VerifFormData,
} from './contractFormSchema'
import type { CreateContractData } from '../../../types'

const TOTAL_STEPS = 5

export function useContractWizardState() {
  const [activeStep, setActiveStep] = useState(0)

  // --- Step 1: Customer ---
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
        union_id: undefined,
        address: { address1: '', address2: '', postcode: '', city: '' },
      },
    },
  })

  // --- Step 2: Contract Details ---
  const detailsForm = useForm<ContractDetailsFormData>({
    resolver: valibotResolver(contractDetailsSchema),
    defaultValues: {
      sav_at: '',
      pre_meeting_at: '',
      quoted_at: '',
      opened_at: '',
      billing_at: '',
      doc_at: '',
      opc_at: '',
      payment_at: '',
      apf_at: '',
      closed_at: '',
      has_tva: '',
      total_price_with_taxe: undefined,
      tax_id: undefined,
      total_price_without_taxe: undefined,
      company_id: undefined,
      financial_partner_id: undefined,
      remarks: '',
      partner_layer_id: undefined,
      state_id: undefined,
      opc_range_id: undefined,
      sav_at_range_id: undefined,
    },
  })

  // --- Step 4: Team & Finance ---
  const teamFinanceForm = useForm<TeamFinanceFormData>({
    resolver: valibotResolver(teamFinanceSchema),
    defaultValues: {
      telepro_id: undefined,
      sale_1_id: undefined,
      sale_2_id: undefined,
      manager_id: undefined,
      assistant_id: undefined,
      installer_user_id: undefined,
      team_id: undefined,
      mensuality: undefined,
      advance_payment: undefined,
      polluter_id: undefined,
      campaign_id: undefined,
      sous_traitant_id: undefined,
      rapport_installation: '',
      rapport_temps: '',
      periode_cee: '',
      surface_parcelle: '',
      install_state_id: undefined,
      admin_status_id: undefined,
      opc_status_id: undefined,
      time_state_id: undefined,
      is_signed: 'NO',
      is_billable: 'NO',
      status: 'ACTIVE',
    },
  })

  // --- Step 3: Fiscal et Habitat (ISO / Domoprime + fiscal verif) ---
  const isoForm = useForm<IsoFormData>({
    resolver: valibotResolver(isoSchema),
    defaultValues: {
      ana_prime: undefined,
      number_of_people: undefined,
      revenue: undefined,
      number_of_fiscal: undefined,
      declarants: '',
      number_of_parts: undefined,
      number_of_children: undefined,
      tax_credit_used: undefined,
      surface_home: undefined,
      surface_top: undefined,
      surface_wall: undefined,
      surface_floor: undefined,
      surface_ite: undefined,
      boiler_quantity: undefined,
      pack_quantity: undefined,
      energy_id: undefined,
      previous_energy_id: undefined,
      occupation_id: undefined,
      more_2_years: undefined,
      parcel_reference: '',
      pricing_id: undefined,
      parcel_surface: undefined,
      layer_type_id: undefined,
      install_surface_top: undefined,
      install_surface_wall: undefined,
      install_surface_floor: undefined,
    },
  })

  // --- Step 3 (bis): Fiscal verification (dynamic pairs, same step as ISO) ---
  const verifForm = useForm<VerifFormData>({
    resolver: valibotResolver(verifSchema),
    defaultValues: {
      verif: [{ reference: '', number: '' }],
    },
  })

  const formByStep = [customerForm, detailsForm, isoForm, teamFinanceForm] as const

  // --- Navigation ---
  const handleNext = useCallback(async () => {
    if (activeStep < formByStep.length) {
      const currentForm = formByStep[activeStep]
      const valid = await currentForm.trigger()

      if (!valid) return false

      // Step 2 (ISO) also needs verifForm validation
      if (activeStep === 2) {
        const verifValid = await verifForm.trigger()

        if (!verifValid) return false
      }
    }

    setActiveStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1))

    return true
  }, [activeStep, formByStep, verifForm])

  const handleBack = useCallback(() => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }, [])

  // --- Combined data ---
  const getCombinedFormData = useCallback((): CreateContractData => {
    const customer = customerForm.getValues()
    const details = detailsForm.getValues()
    const teamFinance = teamFinanceForm.getValues()
    const iso = isoForm.getValues()

    const data: CreateContractData = {
      // Dates
      sav_at: details.sav_at || undefined,
      pre_meeting_at: details.pre_meeting_at || undefined,
      quoted_at: details.quoted_at || undefined,
      opened_at: details.opened_at || undefined,
      billing_at: details.billing_at || undefined,
      doc_at: details.doc_at || undefined,
      opc_at: details.opc_at || undefined,
      payment_at: details.payment_at || undefined,
      apf_at: details.apf_at || undefined,
      closed_at: details.closed_at || undefined,

      // TVA & Finance (from details step)
      has_tva: details.has_tva || undefined,
      total_price_with_taxe: details.total_price_with_taxe,
      tax_id: details.tax_id,
      total_price_without_taxe: details.total_price_without_taxe,

      // References (from details step)
      company_id: details.company_id,
      financial_partner_id: details.financial_partner_id,
      remarks: details.remarks || undefined,
      partner_layer_id: details.partner_layer_id,

      // State & Ranges (from details step)
      state_id: details.state_id,
      opc_range_id: details.opc_range_id,
      sav_at_range_id: details.sav_at_range_id,

      // Team & remaining finance (spread all fields)
      ...teamFinance,

      // Status
      is_signed: teamFinance.is_signed ?? 'NO',
      is_billable: teamFinance.is_billable ?? 'NO',
      status: teamFinance.status ?? 'ACTIVE',
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
      union_id: customer.customer?.union_id,
      address: {
        address1: customer.customer?.address?.address1 ?? '',
        address2: customer.customer?.address?.address2 || undefined,
        postcode: customer.customer?.address?.postcode ?? '',
        city: customer.customer?.address?.city ?? '',
      },
    }

    // ISO / Domoprime data (separate object like Symfony params.CustomerContract.iso)
    const isoData = Object.fromEntries(
      Object.entries(iso).filter(([, v]) => v !== undefined && v !== '')
    )

    if (Object.keys(isoData).length > 0) {
      data.iso = isoData as CreateContractData['iso']
    }

    // Fiscal verification (dynamic array at root level)
    const verifEntries = verifForm.getValues().verif.filter(v => v.reference || v.number)

    if (verifEntries.length > 0) {
      data.verif = verifEntries
    }

    return data
  }, [customerForm, detailsForm, teamFinanceForm, isoForm, verifForm])

  // --- Reset ---
  const resetAll = useCallback(() => {
    setActiveStep(0)
    customerForm.reset()
    detailsForm.reset()
    teamFinanceForm.reset()
    isoForm.reset()
    verifForm.reset()
  }, [customerForm, detailsForm, teamFinanceForm, isoForm, verifForm])

  return {
    activeStep,
    totalSteps: TOTAL_STEPS,
    customerForm,
    detailsForm,
    teamFinanceForm,
    isoForm,
    verifForm,
    handleNext,
    handleBack,
    getCombinedFormData,
    resetAll,
  }
}
