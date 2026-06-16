import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'

import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import type { SxProps, Theme } from '@mui/material/styles'

import type { MeetingFilterOptions, FilterOption } from '../../../types'
import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'

export const TEXT_SEARCH_COLUMNS = new Set([
  'customer_phone', 'customer_city', 'customer_postcode'
])

export const BOOLEAN_FILTER_COLUMNS: Record<string, { yes: string; no: string }> = {
  is_confirmed:  { yes: 'YES', no: 'NO' },
  is_hold:       { yes: 'YES', no: 'NO' },
  is_hold_quote: { yes: 'YES', no: 'NO' },
  is_qualified:  { yes: 'YES', no: 'NO' },
}

const STATUS_FILTER_MAP: Record<string, keyof MeetingFilterOptions> = {
  meeting_status: 'meeting_statuses',
  status_call:    'status_calls',
  status_lead:    'status_leads',
}

const ENTITY_FILTER_MAP: Record<string, keyof MeetingFilterOptions> = {
  sales:          'users',
  sale2:          'users',
  telepro:        'users',
  assistant:      'users',
  creator:        'users',
  confirmator:    'users',
  confirmed_by:   'users',
  callcenter:     'callcenters',
  company:        'companies',
  partner_layer:  'partner_layers',
  polluter:       'polluters',
  campaign:       'campaigns',
  meeting_type:   'meeting_types',
  opc_range:      'date_ranges',
}

const STATUS_ACTIVE_DELETE = new Set(['status'])

const COMPACT_INPUT_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem', borderRadius: '6px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused fieldset': { borderWidth: '1.5px' },
  },
  '& .MuiOutlinedInput-input': { padding: '4px 10px', height: '1.5em' },
}

const COMPACT_SELECT_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem', borderRadius: '6px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused fieldset': { borderWidth: '1.5px' },
  },
  '& .MuiSelect-select': {
    padding: '4px 32px 4px 10px !important', height: '1.5em',
    display: 'flex', alignItems: 'center', fontSize: '0.8125rem',
  },
}

const COMPACT_AUTOCOMPLETE_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem', borderRadius: '6px', padding: '2px 6px !important',
    backgroundColor: 'var(--mui-palette-background-paper)',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused fieldset': { borderWidth: '1.5px' },
    '& .MuiOutlinedInput-input': { padding: '2px 4px !important', height: '1.5em' },
  },
}

const DEBOUNCE_MS = 400

function DebouncedTextFilter({
  columnId, externalValue, onFilterChange, placeholder, sx,
}: {
  columnId: string; externalValue: string
  onFilterChange: (columnId: string, value: string) => void
  placeholder: string; sx: SxProps<Theme>
}) {
  const [localValue, setLocalValue] = useState(externalValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onFilterChangeRef = useRef(onFilterChange)

  onFilterChangeRef.current = onFilterChange

  // Sync from external only when the user isn't actively typing (e.g. clear-all)
  useEffect(() => {
    if (externalValue !== localValue && externalValue === '') {
      setLocalValue('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    setLocalValue(val)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onFilterChangeRef.current(columnId, val)
    }, DEBOUNCE_MS)
  }, [columnId])

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <TextField
      size='small' value={localValue}
      onChange={handleChange}
      placeholder={placeholder} fullWidth variant='outlined'
      sx={{ ...sx, minWidth: 120 }}
      slotProps={{ input: { startAdornment: (
        <InputAdornment position='start' sx={{ mr: 0.5 }}>
          <i className='ri-search-line' style={{ fontSize: '0.875rem', opacity: 0.5 }} />
        </InputAdornment>
      ) } }}
    />
  )
}

function SearchableSelectFilter({
  value, items, onFilterChange, columnId, loading, labelAll, labelSearch,
}: {
  value: string; items: FilterOption[]; onFilterChange: (columnId: string, value: string) => void
  columnId: string; loading: boolean; labelAll: string; labelSearch: string
}) {
  const selectedOption = useMemo(
    () => (value ? items.find(o => String(o.id) === value) ?? null : null),
    [value, items]
  )

  return (
    <Autocomplete<FilterOption, false, false, false>
      size='small' fullWidth value={selectedOption}
      onChange={(_, newValue) => onFilterChange(columnId, newValue ? String(newValue.id) : '')}
      options={items} getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={loading} sx={{ ...COMPACT_AUTOCOMPLETE_SX, minWidth: 130 }}
      slotProps={{
        paper: { sx: { '& .MuiAutocomplete-listbox': { maxHeight: 220, '& .MuiAutocomplete-option': { fontSize: '0.8125rem', padding: '4px 12px', minHeight: 'unset' } } } },
        popper: { placement: 'bottom-start' },
      }}
      renderInput={params => <TextField {...params} placeholder={labelAll} variant='outlined' />}
      noOptionsText={labelSearch}
    />
  )
}

export function createColumnFilterFactory(
  columnFilters: Record<string, string>,
  onFilterChange: (columnId: string, value: string) => void,
  loading: boolean,
  filterOptions: MeetingFilterOptions,
  t: MeetingTranslations
): (columnId: string) => ReactNode {
  return (columnId: string) => {
    const value = columnFilters[columnId] || ''

    // 1. Text search (debounced)
    if (TEXT_SEARCH_COLUMNS.has(columnId)) {
      return (
        <DebouncedTextFilter
          columnId={columnId} externalValue={value}
          onFilterChange={onFilterChange} placeholder={t.filterSearch}
          disabled={loading} sx={COMPACT_INPUT_SX}
        />
      )
    }

    // 2. Boolean filters
    if (columnId in BOOLEAN_FILTER_COLUMNS) {
      const { yes, no } = BOOLEAN_FILTER_COLUMNS[columnId]

      
return (
        <FormControl size='small' fullWidth sx={{ ...COMPACT_SELECT_SX, minWidth: 90 }}>
          <Select value={value} onChange={e => onFilterChange(columnId, e.target.value)} displayEmpty disabled={loading} variant='outlined'>
            <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
            <MenuItem value={yes} sx={{ fontSize: '0.8125rem' }}>{t.yes}</MenuItem>
            <MenuItem value={no} sx={{ fontSize: '0.8125rem' }}>{t.no}</MenuItem>
          </Select>
        </FormControl>
      )
    }

    // 3. ACTIVE/DELETE status
    if (STATUS_ACTIVE_DELETE.has(columnId)) {
      return (
        <FormControl size='small' fullWidth sx={{ ...COMPACT_SELECT_SX, minWidth: 90 }}>
          <Select value={value} onChange={e => onFilterChange(columnId, e.target.value)} displayEmpty disabled={loading} variant='outlined'>
            <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
            <MenuItem value='ACTIVE' sx={{ fontSize: '0.8125rem' }}>{t.statusActive}</MenuItem>
            <MenuItem value='DELETE' sx={{ fontSize: '0.8125rem' }}>{t.statusDeleted}</MenuItem>
          </Select>
        </FormControl>
      )
    }

    // 4. Status dropdown (server-populated)
    if (columnId in STATUS_FILTER_MAP) {
      const optionsKey = STATUS_FILTER_MAP[columnId]
      const items: FilterOption[] = filterOptions[optionsKey] as FilterOption[] || []

      
return (
        <SearchableSelectFilter value={value} items={items} onFilterChange={onFilterChange}
          columnId={columnId} loading={loading} labelAll={t.filterAll} labelSearch={t.filterSearch} />
      )
    }

    // 5. Entity dropdown
    if (columnId in ENTITY_FILTER_MAP) {
      const optionsKey = ENTITY_FILTER_MAP[columnId]
      const items: FilterOption[] = filterOptions[optionsKey] as FilterOption[] || []

      
return (
        <SearchableSelectFilter value={value} items={items} onFilterChange={onFilterChange}
          columnId={columnId} loading={loading} labelAll={t.filterAll} labelSearch={t.filterSearch} />
      )
    }

    // 6. Customer column — text search (debounced)
    if (columnId === 'customer') {
      return (
        <DebouncedTextFilter
          columnId='customer' externalValue={columnFilters['customer'] || ''}
          onFilterChange={onFilterChange} placeholder={t.filterSearch}
          disabled={loading} sx={COMPACT_INPUT_SX}
        />
      )
    }

    return null
  }
}
