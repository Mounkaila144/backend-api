'use client'

import { useState, useEffect } from 'react'

import { contractsService } from '../services/contractsService'
import type { ContractFilterOptions } from '../../types'

const EMPTY_OPTIONS: ContractFilterOptions = {
  contract_statuses: [],
  install_statuses: [],
  admin_statuses: [],
  opc_statuses: [],
  time_statuses: [],
  users: [],
  teams: [],
  companies: [],
  financial_partners: [],
  partner_layers: [],
  polluters: [],
  campaigns: [],
  date_ranges: [],
  domoprime_statuses: [],
  products: [],
  zones: [],
  energies: [],
  sectors: [],
  classes: [],
  quotation_signed: [],
  document_signed: [],
}

/**
 * Fetches filter dropdown options once on mount.
 * Matches Symfony's CustomerContractsFormFilter server-populated selects.
 */
export function useFilterOptions(lang: string = 'fr') {
  const [options, setOptions] = useState<ContractFilterOptions>(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    contractsService.getFilterOptions(lang).then(res => {
      if (!cancelled && res.success) {
        setOptions(res.data)
      }
    }).catch(() => {
      // Silently fail - filters will just not have dropdown options
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [lang])

  return { filterOptions: options, filterOptionsLoading: loading }
}
