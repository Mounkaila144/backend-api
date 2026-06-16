'use client'

import { useState, useEffect } from 'react'

import { meetingsService } from '../services/meetingsService'
import type { MeetingFilterOptions } from '../../types'

const EMPTY_OPTIONS: MeetingFilterOptions = {
  meeting_statuses: [],
  status_calls: [],
  status_leads: [],
  meeting_types: [],
  campaigns: [],
  date_ranges: [],
  users: [],
  companies: [],
  callcenters: [],
  partner_layers: [],
  polluters: [],
  products: [],
}

export function useMeetingFilterOptions(lang: string = 'fr') {
  const [options, setOptions] = useState<MeetingFilterOptions>(EMPTY_OPTIONS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    meetingsService.getFilterOptions(lang).then(res => {
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
