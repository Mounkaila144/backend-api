import { useCallback } from 'react'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'

/** All sidebar filter keys shared across components */
export const SIDEBAR_KEYS = [
  'date_from', 'date_to', 'date_type', 'date_null',
  'surface_parcel_check',
  'sidebar_search', 'sidebar_phone', 'sidebar_postcode', 'sidebar_city',
  'opc_range_id', 'sav_at_range_id',
  'acces_1', 'acces_2', 'source',
  'confirmateur_id', 'regie_callcenter',
  'rapport_installation', 'rapport_attribution', 'rapport_temps', 'rapport_admin',
  'product_id', 'sidebar_financial_partner', 'installer_user_id',
  'sidebar_partner_layer', 'sidebar_creator', 'sidebar_company',
  'energy_id', 'sector_id', 'zone_id',
  'quotation_is_signed', 'document_is_signed',
] as const

export type SidebarKey = (typeof SIDEBAR_KEYS)[number]

const STORAGE_KEY = 'contract_sidebar_filters'

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
  searchParams: URLSearchParams | ReadonlyURLSearchParams
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
