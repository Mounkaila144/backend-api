import { useCallback } from 'react'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

/** All sidebar filter keys shared across components */
export const SIDEBAR_KEYS = [
  // Date
  'date_from', 'date_to', 'date_type',

  // Search
  'sidebar_search', 'sidebar_phone', 'sidebar_postcode', 'sidebar_city',

  // Ranges
  'sidebar_opc_range', 'sidebar_in_at_range',

  // Team
  'sidebar_telepro', 'sidebar_sales', 'sidebar_sale2', 'sidebar_assistant',
  'sidebar_creator', 'sidebar_confirmator',

  // Statuses
  'sidebar_state', 'sidebar_status_call', 'sidebar_status_lead',

  // Selections
  'sidebar_campaign', 'sidebar_callcenter', 'sidebar_polluter',
  'sidebar_company', 'sidebar_partner_layer', 'sidebar_meeting_type',

  // Flags
  'sidebar_is_confirmed', 'sidebar_is_hold', 'sidebar_is_hold_quote', 'sidebar_is_qualified',
] as const

export type SidebarKey = (typeof SIDEBAR_KEYS)[number]

const STORAGE_KEY = 'meeting_sidebar_filters'

// ── localStorage helpers (safe for SSR) ──

function saveToStorage(filters: Record<string, string>) {
  try {
    if (Object.keys(filters).length === 0) {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    }
  } catch { /* incognito / quota exceeded */ }
}

function readFromStorage(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }

  
return {}
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

// ── Pure reader: URL params first, localStorage fallback ──

/** Read sidebar filters from URL search params, fall back to localStorage */
export function readSidebarFiltersFromParams(
  searchParams: URLSearchParams
): Record<string, string> {
  // 1. Try URL search params
  const fromUrl: Record<string, string> = {}

  for (const key of SIDEBAR_KEYS) {
    const val = searchParams.get(key)

    if (val) fromUrl[key] = val
  }

  if (Object.keys(fromUrl).length > 0) return fromUrl

  // 2. Fallback: localStorage
  if (typeof window !== 'undefined') return readFromStorage()

  return {}
}

/** Hook for writing/clearing sidebar filters in URL + localStorage */
export function useSidebarFilterParams() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  /** Write sidebar filters to URL + localStorage */
  const writeToUrl = useCallback((filters: Record<string, string>) => {
    // Persist to localStorage (survives navigation)
    const toStore: Record<string, string> = {}

    for (const key of SIDEBAR_KEYS) {
      if (filters[key]) toStore[key] = filters[key]
    }

    saveToStorage(toStore)

    // Also write to URL (for shareability / bookmarks)
    const params = new URLSearchParams(searchParams.toString())

    for (const key of SIDEBAR_KEYS) {
      params.delete(key)
    }

    for (const key of SIDEBAR_KEYS) {
      const value = filters[key]

      if (value) params.set(key, value)
    }

    const qs = params.toString()

    router.replace(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false })
  }, [searchParams, router, pathname])

  /** Clear all sidebar params from URL + localStorage */
  const clearUrl = useCallback(() => {
    clearStorage()

    const params = new URLSearchParams(searchParams.toString())

    for (const key of SIDEBAR_KEYS) {
      params.delete(key)
    }

    const qs = params.toString()

    router.replace(`${pathname}${qs ? '?' + qs : ''}`, { scroll: false })
  }, [searchParams, router, pathname])

  return { searchParams, writeToUrl, clearUrl }
}
