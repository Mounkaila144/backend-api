'use client'

import { useState, useCallback } from 'react'

import { useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'

import {
  contractDetailsSchema,
  teamFinanceSchema,
  customerEditSchema,
  isoEditSchema,
  verifEditSchema,
} from './editFormSchema'
import type {
  ContractDetailsFormData,
  TeamFinanceFormData,
  CustomerEditFormData,
  IsoEditFormData,
  VerifEditFormData,
} from './editFormSchema'
import { formatDateForInput } from '../contract-modal/contractFormDefaults'
import type { CustomerContract, UpdateContractData } from '../../../types'

export function useEditContractState() {
  const [activeTab, setActiveTab] = useState(0)
  const [contract, setContract] = useState<CustomerContract | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detailsForm = useForm<ContractDetailsFormData>({
    resolver: valibotResolver(contractDetailsSchema),
    defaultValues: {},
  })

  const teamFinanceForm = useForm<TeamFinanceFormData>({
    resolver: valibotResolver(teamFinanceSchema),
    defaultValues: {},
  })

  const customerForm = useForm<CustomerEditFormData>({
    resolver: valibotResolver(customerEditSchema),
    defaultValues: {
      customer: {
        address: {},
      },
    },
  })

  const isoForm = useForm<IsoEditFormData>({
    resolver: valibotResolver(isoEditSchema),
    defaultValues: {},
  })

  const verifForm = useForm<VerifEditFormData>({
    resolver: valibotResolver(verifEditSchema),
    defaultValues: {
      verif: [{ reference: '', number: '' }],
    },
  })

  const loadContract = useCallback(
    async (
      id: number,
      fetchFn: (id: number) => Promise<CustomerContract | null>,
      fetchIsoFn?: (id: number) => Promise<Record<string, unknown> | null>
    ) => {
      const normalizeOptionalId = (value: number | string | null | undefined): number | undefined => {
        if (value == null) return undefined
        const numeric = Number(value)

        if (!Number.isFinite(numeric) || numeric <= 0) return undefined

        return numeric
      }

      // Resolve an id from either direct foreign key or nested relation object.
      const resolveId = (
        directId: number | null | undefined,
        relation: { id: number | string } | null | undefined
      ): number | undefined => {
        const normalizedDirect = normalizeOptionalId(directId)

        if (normalizedDirect != null) return normalizedDirect

        const normalizedRelation = normalizeOptionalId(relation?.id)

        if (normalizedRelation != null) return normalizedRelation

        return undefined
      }

      const pickString = (...values: unknown[]): string => {
        for (const value of values) {
          if (value == null) continue
          const normalized = String(value).trim()

          if (normalized !== '') return normalized
        }

        return ''
      }

      const pickNumber = (...values: unknown[]): number | undefined => {
        for (const value of values) {
          if (value == null || value === '') continue
          const numeric = Number(value)

          if (Number.isFinite(numeric)) return numeric
        }

        return undefined
      }

      const normalizeYesNo = (value: unknown): 'YES' | 'NO' | '' => {
        if (value == null || value === '') return ''
        const normalized = String(value).toUpperCase()

        if (normalized === 'YES' || normalized === 'Y') return 'YES'
        if (normalized === 'NO' || normalized === 'N') return 'NO'
        
return ''
      }

      const parseVerifEntries = (value: unknown): Array<{ reference: string; number: string }> => {
        const toArray = (input: unknown): unknown[] => {
          if (Array.isArray(input)) return input

          if (typeof input === 'string') {
            try {
              const parsed = JSON.parse(input)

              
return Array.isArray(parsed) ? parsed : []
            } catch {
              return []
            }
          }

          
return []
        }

        return toArray(value)
          .map(item => {
            if (item && typeof item === 'object') {
              const rec = item as Record<string, unknown>

              
return {
                reference: pickString(rec.reference, rec.ref),
                number: pickString(rec.number, rec.num),
              }
            }

            
return { reference: '', number: '' }
          })
          .filter(entry => entry.reference !== '' || entry.number !== '')
      }

      setLoading(true)
      setError(null)
      setActiveTab(0)

      try {
        const data = await fetchFn(id)

        if (!data) {
          setError('Contract not found')
          
return
        }

        setContract(data)

        // Details form
        detailsForm.reset({
          quoted_at: formatDateForInput(data.quoted_at),
          billing_at: formatDateForInput(data.billing_at),
          opened_at: formatDateForInput(data.opened_at),
          opc_at: formatDateForInput(data.opc_at),
          sent_at: formatDateForInput(data.sent_at),
          payment_at: formatDateForInput(data.payment_at),
          apf_at: formatDateForInput(data.apf_at),
          sav_at: formatDateForInput(data.sav_at),
          pre_meeting_at: formatDateForInput(data.pre_meeting_at),
          doc_at: formatDateForInput(data.doc_at ?? undefined),
          closed_at: formatDateForInput(data.closed_at),
          has_tva: data.variables?.has_tva ?? '',
          reference: data.reference || '',
          remarks: data.remarks || '',
          total_price_with_taxe: data.total_price_with_taxe ?? undefined,
          tax_id: normalizeOptionalId(data.tax_id),
          total_price_without_taxe: data.total_price_without_taxe ?? undefined,
          company_id: resolveId(data.company_id, data.company),
          financial_partner_id: resolveId(data.financial_partner_id, data.financial_partner),
          partner_layer_id: resolveId(data.partner_layer_id, data.partner_layer),
          state_id: normalizeOptionalId(data.state_id),
          opc_range_id: normalizeOptionalId(data.opc_range_id),
          sav_at_range_id: normalizeOptionalId(data.sav_at_range_id),
        })

        // Customer form
        if (data.customer) {
          const customerAddress = (data.customer.address ?? {}) as Record<string, unknown>
          const customerAddresses = (data.customer as unknown as { addresses?: unknown[] }).addresses

          const firstAddress =
            Array.isArray(customerAddresses) && customerAddresses.length > 0
              ? (customerAddresses[0] as Record<string, unknown>)
              : {}

          const customer = data.customer as unknown as Record<string, unknown>

          customerForm.reset({
            customer: {
              gender: data.customer.gender || '',
              lastname: data.customer.lastname || '',
              firstname: data.customer.firstname || '',
              phone: data.customer.phone || '',
              email: data.customer.email || '',
              mobile: data.customer.mobile || '',
              mobile2: data.customer.mobile2 || '',
              company: data.customer.company || '',
              union_id: normalizeOptionalId(data.customer.union_id),
              address: {
                address1: pickString(
                  customerAddress.address1,
                  firstAddress.address1,
                  customer.address1,
                  customerAddress.address,
                  customer.street,
                  customer.street1
                ),
                address2: pickString(customerAddress.address2, firstAddress.address2),
                postcode: pickString(
                  customerAddress.postcode,
                  firstAddress.postcode,
                  customer.postcode,
                  customerAddress.postal_code,
                  firstAddress.postal_code,
                  customer.postal_code,
                  customerAddress.zip,
                  firstAddress.zip,
                  customer.zip,
                  customerAddress.zip_code,
                  firstAddress.zip_code,
                  customer.zip_code
                ),
                city: pickString(customerAddress.city, firstAddress.city, customer.city),
              },
            },
          })
        }

        // ISO form - extract from domoprime ISO request first, then contract variables/top-level.
        const isoRequest = fetchIsoFn ? await fetchIsoFn(id) : null
        const vars = (data.variables && !Array.isArray(data.variables) ? data.variables : {}) as Record<string, unknown>
        const iso = (isoRequest ?? {}) as Record<string, unknown>

        isoForm.reset({
          ana_prime: pickNumber(iso.ana_prime, vars.ana_prime, data.ana_prime),
          number_of_people: pickNumber(iso.number_of_people, vars.number_of_people, data.number_of_people),
          revenue: pickNumber(iso.revenue, vars.revenue, data.revenue),
          number_of_fiscal: pickNumber(iso.number_of_fiscal, vars.number_of_fiscal, data.number_of_fiscal),
          declarants: pickString(iso.declarants, vars.declarants, data.declarants),
          number_of_parts: pickNumber(iso.number_of_parts, vars.number_of_parts, data.number_of_parts),
          number_of_children: pickNumber(iso.number_of_children, vars.number_of_children, data.number_of_children),
          tax_credit_used: pickNumber(iso.tax_credit_used, vars.tax_credit_used, data.tax_credit_used),
          surface_home: pickNumber(iso.surface_home, data.surface_home, vars.surface_home),
          surface_top: pickNumber(iso.surface_top, iso.src_surface_top, data.surface_top, vars.surface_top),
          surface_wall: pickNumber(iso.surface_wall, iso.src_surface_wall, data.surface_wall, vars.surface_wall),
          surface_floor: pickNumber(iso.surface_floor, iso.src_surface_floor, data.surface_floor, vars.surface_floor),
          surface_ite: pickNumber(iso.surface_ite, data.surface_ite, vars.surface_ite),
          boiler_quantity: pickNumber(iso.boiler_quantity, vars.boiler_quantity, data.boiler_quantity),
          pack_quantity: pickNumber(iso.pack_quantity, iso.packboiler_quantity, vars.pack_quantity, data.pack_quantity),
          energy_id: normalizeOptionalId(pickNumber(iso.energy_id, data.energy_id, data.energy?.id)),
          previous_energy_id: normalizeOptionalId(pickNumber(iso.previous_energy_id, vars.previous_energy_id)),
          occupation_id: normalizeOptionalId(pickNumber(iso.occupation_id, vars.occupation_id)),
          more_2_years: normalizeYesNo(iso.more_2_years || vars.more_2_years),
          parcel_reference: pickString(iso.parcel_reference, vars.parcel_reference, data.parcel_reference),
          pricing_id: normalizeOptionalId(pickNumber(iso.pricing_id, vars.pricing_id)),
          parcel_surface: pickNumber(iso.parcel_surface, vars.parcel_surface, data.parcel_surface),
          layer_type_id: normalizeOptionalId(pickNumber(iso.layer_type_id, vars.layer_type_id)),
          install_surface_top: pickNumber(iso.install_surface_top, data.install_surface_top, vars.install_surface_top),
          install_surface_wall: pickNumber(iso.install_surface_wall, data.install_surface_wall, vars.install_surface_wall),
          install_surface_floor: pickNumber(iso.install_surface_floor, data.install_surface_floor, vars.install_surface_floor),
        })

        // Verif form - extract from variables and domoprime payload variants
        const verifData = parseVerifEntries(iso.verif || vars.verif || vars.verifs || data.verif)

        verifForm.reset({
          verif: verifData.length > 0 ? verifData : [{ reference: '', number: '' }],
        })

        teamFinanceForm.reset({
          telepro_id: resolveId(data.telepro_id, data.telepro),
          sale_1_id: resolveId(data.sale_1_id, data.sale1),
          sale_2_id: resolveId(data.sale_2_id, data.sale2),
          manager_id: normalizeOptionalId(data.manager_id),
          assistant_id: resolveId(data.assistant_id, data.assistant),
          installer_user_id: resolveId(data.installer_user_id, data.installer_user),
          team_id: resolveId(data.team_id, data.team),
          mensuality: data.mensuality ?? undefined,
          advance_payment: data.advance_payment ?? undefined,
          polluter_id: resolveId(data.polluter_id, data.polluter),
          campaign_id: resolveId(data.campaign_id, data.campaign),
          sous_traitant_id: normalizeOptionalId(data.sous_traitant_id),
          rapport_installation: data.rapport_installation ?? '',
          rapport_temps: data.rapport_temps ?? '',
          periode_cee: data.periode_cee ?? '',
          surface_parcelle: data.surface_parcelle ?? '',
          install_state_id: normalizeOptionalId(data.install_state_id),
          admin_status_id: normalizeOptionalId(data.admin_status_id),
          opc_status_id: normalizeOptionalId(data.opc_status_id),
          time_state_id: normalizeOptionalId(data.time_state_id),
          is_signed: data.is_signed ?? 'NO',
          is_billable: data.is_billable ?? 'NO',
          status: data.status_flag ?? 'ACTIVE',
        })
      } catch {
        setError('Error loading contract')
      } finally {
        setLoading(false)
      }
    },
    [detailsForm, teamFinanceForm, customerForm, isoForm, verifForm]
  )

  const getFormData = useCallback((): UpdateContractData => {
    const details = detailsForm.getValues()
    const teamFinance = teamFinanceForm.getValues()
    const customer = customerForm.getValues()
    const iso = isoForm.getValues()
    const verif = verifForm.getValues()

    // Helper to clean nested objects (remove undefined and empty strings)
    const cleanObject = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
      return Object.fromEntries(
        Object.entries(obj).filter(([, v]) => {
          if (v === undefined || v === null) return false
          if (typeof v === 'string' && v.trim() === '') return false

          if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
            const cleaned = cleanObject(v as Record<string, unknown>)

            
return Object.keys(cleaned).length > 0
          }

          
return true
        })
      ) as Partial<T>
    }

    const merged: UpdateContractData = { ...details, ...teamFinance }

    // Add customer data (cleaned)
    if (customer.customer) {
      const cleanedCustomer = cleanObject(customer.customer)

      if (Object.keys(cleanedCustomer).length > 0) {
        merged.customer = cleanedCustomer as typeof customer.customer
      }
    }

    // Add ISO data (cleaned)
    if (iso) {
      const cleanedIso = cleanObject(iso)

      if (Object.keys(cleanedIso).length > 0) {
        merged.iso = cleanedIso as typeof iso
      }
    }

    // Add verif data (only non-empty entries)
    if (verif.verif && verif.verif.length > 0) {
      const cleanedVerif = verif.verif.filter(
        entry => entry.reference?.trim() || entry.number?.trim()
      )

      if (cleanedVerif.length > 0) {
        merged.verif = cleanedVerif
      }
    }

    // Wrap has_tva in variables object for backend
    if (details.has_tva !== undefined && details.has_tva !== '') {
      merged.variables = { has_tva: details.has_tva }
    }

    // Clean empty strings and undefined from top-level fields
    // Note: We keep null values to allow explicitly clearing fields (e.g., partner_layer_id)
    const cleaned = Object.fromEntries(
      Object.entries(merged).filter(([, v]) => {
        // Remove undefined values
        if (v === undefined) return false

        // Remove empty strings
        if (typeof v === 'string' && v === '') return false

        // Keep everything else, including null (to explicitly clear fields)
        return true
      })
    ) as UpdateContractData

    // Keep nested objects that were explicitly cleaned above
    if (merged.variables) {
      cleaned.variables = merged.variables
    }

    if (merged.customer && Object.keys(merged.customer).length > 0) {
      cleaned.customer = merged.customer
    }

    if (merged.iso && Object.keys(merged.iso).length > 0) {
      cleaned.iso = merged.iso
    }

    if (merged.verif && merged.verif.length > 0) {
      cleaned.verif = merged.verif
    }

    return cleaned
  }, [detailsForm, teamFinanceForm, customerForm, isoForm, verifForm])

  const resetAll = useCallback(() => {
    setContract(null)
    setActiveTab(0)
    setError(null)
    setLoading(false)
    setSubmitting(false)
    detailsForm.reset({})
    teamFinanceForm.reset({})
    customerForm.reset({ customer: { address: {} } })
    isoForm.reset({})
    verifForm.reset({ verif: [{ reference: '', number: '' }] })
  }, [detailsForm, teamFinanceForm, customerForm, isoForm, verifForm])

  return {
    activeTab,
    setActiveTab,
    contract,
    loading,
    submitting,
    setSubmitting,
    error,
    setError,
    detailsForm,
    teamFinanceForm,
    customerForm,
    isoForm,
    verifForm,
    loadContract,
    getFormData,
    resetAll,
  }
}
