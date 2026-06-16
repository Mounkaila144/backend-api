import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import type { SxProps, Theme } from '@mui/material/styles'

import type { ContractFilterOptions, FilterOption } from '../../../types'
import type { ContractTranslations } from '../../hooks/useContractTranslations'

// ── Text search columns (free-text input) ──
// Note: customer handled separately (section 7) because it has domoprime_status sub-filter
export const TEXT_SEARCH_COLUMNS = new Set([
  'id', 'customer_phone', 'customer_city', 'customer_postcode'
])

// ── Boolean filter columns (YES/NO or Y/N selects) ──
export const BOOLEAN_FILTER_COLUMNS: Record<string, { yes: string; no: string }> = {
  is_confirmed:  { yes: 'YES', no: 'NO' },
  is_billable:   { yes: 'YES', no: 'NO' },
  is_hold:       { yes: 'YES', no: 'NO' },
  is_hold_quote: { yes: 'YES', no: 'NO' },
  is_document:   { yes: 'Y',   no: 'N' },
  is_photo:      { yes: 'Y',   no: 'N' },
  is_quality:    { yes: 'Y',   no: 'N' },
}

// ── Status filter columns → key in ContractFilterOptions ──
const STATUS_FILTER_MAP: Record<string, keyof ContractFilterOptions> = {
  contract_status: 'contract_statuses',
  install_status:  'install_statuses',
  admin_status:    'admin_statuses',
  opc_status:      'opc_statuses',
  time_status:     'time_statuses',
}

// ── Entity filter columns → key in ContractFilterOptions ──
const ENTITY_FILTER_MAP: Record<string, keyof ContractFilterOptions> = {
  sale1:              'users',
  sale2:              'users',
  telepro:            'users',
  assistant:          'users',
  creator:            'users',
  team:               'teams',
  company:            'companies',
  financial_partner:  'financial_partners',
  partner_layer:      'partner_layers',
  polluter:           'polluters',
  campaign:           'campaigns',
}

// ── ACTIVE/DELETE status filter ──
const STATUS_ACTIVE_DELETE = new Set(['status'])

// ── Domoprime sidebar select filters → key in ContractFilterOptions ──
const DOMOPRIME_FILTER_MAP: Record<string, keyof ContractFilterOptions> = {
  class_energy: 'classes',
}

// ── Shared compact styling ──
const COMPACT_INPUT_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: '6px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'var(--mui-palette-divider)',
      transition: 'border-color 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: 'var(--mui-palette-primary-light)',
    },
    '&.Mui-focused fieldset': {
      borderWidth: '1.5px',
    },
  },
  '& .MuiOutlinedInput-input': {
    padding: '4px 10px',
    height: '1.5em',
  },
}

const COMPACT_SELECT_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: '6px',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'var(--mui-palette-divider)',
      transition: 'border-color 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: 'var(--mui-palette-primary-light)',
    },
    '&.Mui-focused fieldset': {
      borderWidth: '1.5px',
    },
  },
  '& .MuiSelect-select': {
    padding: '4px 32px 4px 10px !important',
    height: '1.5em',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8125rem',
  },
}

const COMPACT_AUTOCOMPLETE_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: '6px',
    padding: '2px 6px !important',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'var(--mui-palette-divider)',
      transition: 'border-color 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: 'var(--mui-palette-primary-light)',
    },
    '&.Mui-focused fieldset': {
      borderWidth: '1.5px',
    },
    '& .MuiOutlinedInput-input': {
      padding: '2px 4px !important',
      height: '1.5em',
    },
  },
}


const COMPACT_CHECKBOX_SX = {
  '& .MuiCheckbox-root': { padding: '2px' },
  '& .MuiFormControlLabel-label': { fontSize: '0.7rem' },
}

function TextSearchFilter({
  value,
  onFilterChange,
  columnId,
  loading,
  placeholder,
  commitOnEnter,
}: {
  value: string
  onFilterChange: (columnId: string, value: string) => void
  columnId: string
  loading: boolean
  placeholder: string
  commitOnEnter?: boolean
}) {
  const [localValue, setLocalValue] = useState(value)
  const committedValueRef = useRef(value)

  useEffect(() => {
    setLocalValue(value)
    committedValueRef.current = value
  }, [value])

  const commitFilter = useCallback(() => {
    if (localValue === committedValueRef.current) return

    committedValueRef.current = localValue
    onFilterChange(columnId, localValue)
  }, [columnId, localValue, onFilterChange])

  return (
    <TextField
      size='small'
      value={commitOnEnter ? localValue : value}
      onChange={e => {
        if (commitOnEnter) {
          setLocalValue(e.target.value)

          return
        }

        onFilterChange(columnId, e.target.value)
      }}
      onBlur={commitOnEnter ? commitFilter : undefined}
      onKeyDown={commitOnEnter ? e => {
        if (e.key === 'Enter') commitFilter()
      } : undefined}
      placeholder={placeholder}
      fullWidth
      variant='outlined'
      disabled={loading}
      sx={{ ...COMPACT_INPUT_SX, minWidth: 120 }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position='start' sx={{ mr: 0.5 }}>
              <i className='ri-search-line' style={{ fontSize: '0.875rem', opacity: 0.5 }} />
            </InputAdornment>
          ),
        },
      }}
    />
  )
}

// ── Searchable Autocomplete filter (with built-in search bar) ──
function SearchableSelectFilter({
  value,
  items,
  onFilterChange,
  columnId,
  loading,
  labelAll,
  labelSearch,
}: {
  value: string
  items: FilterOption[]
  onFilterChange: (columnId: string, value: string) => void
  columnId: string
  loading: boolean
  labelAll: string
  labelSearch: string
}) {
  const selectedOption = useMemo(
    () => (value ? items.find(o => String(o.id) === value) ?? null : null),
    [value, items]
  )

  return (
    <Autocomplete<FilterOption, false, false, false>
      size='small'
      fullWidth
      value={selectedOption}
      onChange={(_, newValue) => onFilterChange(columnId, newValue ? String(newValue.id) : '')}
      options={items}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      disabled={loading}
      sx={{ ...COMPACT_AUTOCOMPLETE_SX, minWidth: 130 }}
      slotProps={{
        paper: {
          sx: {
            '& .MuiAutocomplete-listbox': {
              maxHeight: 220,
              '& .MuiAutocomplete-option': {
                fontSize: '0.8125rem',
                padding: '4px 12px',
                minHeight: 'unset',
              },
            },
          },
        },
        popper: { placement: 'bottom-start' },
      }}
      renderInput={params => (
        <TextField
          {...params}
          placeholder={labelAll}
          variant='outlined'
        />
      )}
      noOptionsText={labelSearch}
    />
  )
}

export function createColumnFilterFactory(
  columnFilters: Record<string, string>,
  onFilterChange: (columnId: string, value: string) => void,
  loading: boolean,
  filterOptions: ContractFilterOptions,
  t: ContractTranslations
): (columnId: string) => ReactNode {
  return (columnId: string) => {
    const value = columnFilters[columnId] || ''

    // 1. Text search
    if (TEXT_SEARCH_COLUMNS.has(columnId)) {
      return (
        <TextSearchFilter
          value={value}
          onFilterChange={onFilterChange}
          columnId={columnId}
          placeholder={t.filterSearch}
          loading={loading}
          commitOnEnter={columnId === 'id'}
        />
      )
    }

    // 2. Boolean filters (YES/NO, Y/N) — few options, no search needed
    if (columnId in BOOLEAN_FILTER_COLUMNS) {
      const { yes, no } = BOOLEAN_FILTER_COLUMNS[columnId]

      return (
        <FormControl size='small' fullWidth sx={{ ...COMPACT_SELECT_SX, minWidth: 90 }}>
          <Select
            value={value}
            onChange={e => onFilterChange(columnId, e.target.value)}
            displayEmpty
            disabled={loading}
            variant='outlined'
          >
            <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
            <MenuItem value={yes} sx={{ fontSize: '0.8125rem' }}>{t.yes}</MenuItem>
            <MenuItem value={no} sx={{ fontSize: '0.8125rem' }}>{t.no}</MenuItem>
          </Select>
        </FormControl>
      )
    }

    // 3. ACTIVE/DELETE status — few options, no search needed
    if (STATUS_ACTIVE_DELETE.has(columnId)) {
      return (
        <FormControl size='small' fullWidth sx={{ ...COMPACT_SELECT_SX, minWidth: 90 }}>
          <Select
            value={value}
            onChange={e => onFilterChange(columnId, e.target.value)}
            displayEmpty
            disabled={loading}
            variant='outlined'
          >
            <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
            <MenuItem value='ACTIVE' sx={{ fontSize: '0.8125rem' }}>{t.statusActive}</MenuItem>
            <MenuItem value='DELETE' sx={{ fontSize: '0.8125rem' }}>{t.statusDeleted}</MenuItem>
          </Select>
        </FormControl>
      )
    }

    // 4. Status dropdown (server-populated) — searchable
    if (columnId in STATUS_FILTER_MAP) {
      const optionsKey = STATUS_FILTER_MAP[columnId]
      const items: FilterOption[] = filterOptions[optionsKey] as FilterOption[] || []

      return (
        <SearchableSelectFilter
          value={value}
          items={items}
          onFilterChange={onFilterChange}
          columnId={columnId}
          loading={loading}
          labelAll={t.filterAll}
          labelSearch={t.filterSearch}
        />
      )
    }

    // 5. Entity dropdown (users, teams, partners, etc.) — searchable
    if (columnId in ENTITY_FILTER_MAP) {
      const optionsKey = ENTITY_FILTER_MAP[columnId]
      const items: FilterOption[] = filterOptions[optionsKey] as FilterOption[] || []

      return (
        <SearchableSelectFilter
          value={value}
          items={items}
          onFilterChange={onFilterChange}
          columnId={columnId}
          loading={loading}
          labelAll={t.filterAll}
          labelSearch={t.filterSearch}
        />
      )
    }

    // 6. Date column — OPC + SAV range selects only (Symfony lines 374-395)
    if (columnId === 'date') {
      const rangeItems: FilterOption[] = filterOptions.date_ranges || []
      const opcValue = columnFilters['opc_range_id'] || ''
      const savValue = columnFilters['sav_at_range_id'] || ''

      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, minWidth: 200 }}>
          <Typography variant='caption' sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', opacity: 0.7 }}>OPC</Typography>
          <FormControl size='small' sx={{ ...COMPACT_SELECT_SX, flex: 1, minWidth: 80 }}>
            <Select
              value={opcValue}
              onChange={e => onFilterChange('opc_range_id', e.target.value)}
              displayEmpty
              disabled={loading}
              variant='outlined'
            >
              <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
              <MenuItem value='IS_NULL' sx={{ fontSize: '0.8125rem' }}>----</MenuItem>
              {rangeItems.map(item => (
                <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: '0.8125rem' }}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant='caption' sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', opacity: 0.7 }}>SAV</Typography>
          <FormControl size='small' sx={{ ...COMPACT_SELECT_SX, flex: 1, minWidth: 80 }}>
            <Select
              value={savValue}
              onChange={e => onFilterChange('sav_at_range_id', e.target.value)}
              displayEmpty
              disabled={loading}
              variant='outlined'
            >
              <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
              <MenuItem value='0' sx={{ fontSize: '0.8125rem' }}>----</MenuItem>
              {rangeItems.map(item => (
                <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: '0.8125rem' }}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )
    }

    // 7. Customer column — domoprime_status (Cumac) select only (Symfony lines 396-409)
    if (columnId === 'customer') {
      const domoItems: FilterOption[] = filterOptions.domoprime_statuses || []

      if (domoItems.length === 0) return null

      return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, minWidth: 130 }}>
          <Typography variant='caption' sx={{ fontSize: '0.7rem', whiteSpace: 'nowrap', opacity: 0.7 }}>Cumac</Typography>
          <FormControl size='small' sx={{ ...COMPACT_SELECT_SX, flex: 1, minWidth: 90 }}>
            <Select
              value={columnFilters['domoprime_status'] || ''}
              onChange={e => onFilterChange('domoprime_status', e.target.value)}
              displayEmpty
              disabled={loading}
              variant='outlined'
            >
              <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{t.filterAll}</MenuItem>
              {domoItems.map(item => (
                <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: '0.8125rem' }}>{item.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )
    }

    // 8. Class/Energy column — class_id select (Symfony lines 90-95)
    if (columnId in DOMOPRIME_FILTER_MAP) {
      const optionsKey = DOMOPRIME_FILTER_MAP[columnId]
      const items: FilterOption[] = filterOptions[optionsKey] as FilterOption[] || []

      if (items.length === 0) return null

      return (
        <SearchableSelectFilter
          value={columnFilters['class_id'] || ''}
          items={items}
          onFilterChange={(_, v) => onFilterChange('class_id', v)}
          columnId='class_id'
          loading={loading}
          labelAll={t.filterAll}
          labelSearch={t.filterSearch}
        />
      )
    }

    // 9. Surface parcel column — surface_parcel_check checkbox (Symfony lines 96-103)
    if (columnId === 'surface_parcel') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', ...COMPACT_CHECKBOX_SX }}>
          <FormControlLabel
            control={
              <Checkbox
                size='small'
                checked={columnFilters['surface_parcel_check'] === 'YES'}
                onChange={e => onFilterChange('surface_parcel_check', e.target.checked ? 'YES' : '')}
                disabled={loading}
              />
            }
            label={t.filterSurfaceParcelCheck}
          />
        </Box>
      )
    }

    return null
  }
}
