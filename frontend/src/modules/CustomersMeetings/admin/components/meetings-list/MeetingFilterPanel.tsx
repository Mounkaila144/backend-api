import { useState, useMemo, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import type { SxProps, Theme } from '@mui/material/styles'

import type { MeetingFilterOptions, FilterOption } from '../../../types'
import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'
import { SIDEBAR_KEYS, useSidebarFilterParams } from '../../hooks/useSidebarFilterParams'

// ── Input styling ──
const FIELD_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: 1,
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused': { '& fieldset': { borderWidth: '1.5px' } },
  },
  '& .MuiOutlinedInput-input': { padding: '6px 10px', height: '1.4em' },
}

const SELECT_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: 1,
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused': { '& fieldset': { borderWidth: '1.5px' } },
  },
  '& .MuiSelect-select': {
    padding: '6px 28px 6px 10px !important',
    height: '1.4em',
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8125rem',
  },
}

const AUTOCOMPLETE_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: 1,
    padding: '2px 6px !important',
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused': { '& fieldset': { borderWidth: '1.5px' } },
    '& .MuiOutlinedInput-input': { padding: '4px 4px !important', height: '1.4em' },
  },
}

const DROPDOWN_PAPER_SX = {
  borderRadius: 1,
  boxShadow: 'var(--mui-customShadows-lg)',
  border: '1px solid var(--mui-palette-divider)',
}

// ── Date type options (matching Symfony sidebar) ──
const DATE_TYPES = [
  { value: 'in_at', labelKey: 'filterDateRdv' as const, icon: 'ri-calendar-event-line' },
  { value: 'treated_at', labelKey: 'filterDateTreated' as const, icon: 'ri-check-double-line' },
  { value: 'creation_at', labelKey: 'filterDateCreation' as const, icon: 'ri-add-circle-line' },
  { value: 'confirmed_at', labelKey: 'filterDateConfirmed' as const, icon: 'ri-checkbox-circle-line' },
  { value: 'callback_at', labelKey: 'filterDateCallback' as const, icon: 'ri-phone-line' },
]

// ── Searchable Autocomplete ──
function PanelAutocomplete({
  value, items, onChange, loading, placeholder,
}: {
  value: string
  items: FilterOption[]
  onChange: (value: string) => void
  loading: boolean
  placeholder: string
}) {
  const selected = useMemo(
    () => (value ? items.find(o => String(o.id) === value) ?? null : null),
    [value, items]
  )

  return (
    <Autocomplete<FilterOption, false, false, false>
      size='small'
      fullWidth
      value={selected}
      onChange={(_, v) => onChange(v ? String(v.id) : '')}
      options={items}
      getOptionLabel={o => o.name}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={loading}
      sx={AUTOCOMPLETE_SX}
      slotProps={{
        paper: {
          sx: {
            ...DROPDOWN_PAPER_SX,
            '& .MuiAutocomplete-listbox': {
              maxHeight: 220,
              '& .MuiAutocomplete-option': { fontSize: '0.8125rem', padding: '4px 10px', minHeight: 'unset' },
            },
          },
        },
        popper: { placement: 'bottom-start' },
      }}
      renderInput={params => <TextField {...params} placeholder={placeholder} variant='outlined' />}
    />
  )
}

// ── Simple Select ──
function PanelSelect({
  value, items, onChange, loading, placeholder, withNull,
}: {
  value: string
  items: FilterOption[]
  onChange: (value: string) => void
  loading: boolean
  placeholder: string
  withNull?: boolean
}) {
  return (
    <FormControl size='small' fullWidth sx={SELECT_SX}>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        displayEmpty
        disabled={loading}
        variant='outlined'
        MenuProps={{ slotProps: { paper: { sx: DROPDOWN_PAPER_SX } } }}
      >
        <MenuItem value='' sx={{ fontSize: '0.8125rem' }}>{placeholder}</MenuItem>
        {withNull && <MenuItem value='IS_NULL' sx={{ fontSize: '0.8125rem' }}>----</MenuItem>}
        {items.map(item => (
          <MenuItem key={item.id} value={String(item.id)} sx={{ fontSize: '0.8125rem' }}>{item.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

// ── Text input ──
function PanelTextInput({
  value, onChange, loading, placeholder, icon,
}: {
  value: string
  onChange: (value: string) => void
  loading: boolean
  placeholder: string
  icon?: string
}) {
  return (
    <TextField
      size='small'
      fullWidth
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={loading}
      variant='outlined'
      sx={FIELD_SX}
      slotProps={icon ? {
        input: {
          startAdornment: (
            <InputAdornment position='start' sx={{ mr: 0.3 }}>
              <i className={icon} style={{ fontSize: '0.85rem', color: 'var(--mui-palette-text-disabled)' }} />
            </InputAdornment>
          ),
        },
      } : undefined}
    />
  )
}

// ── Section header ──
function Section({ icon, label }: { icon: string; label: string }) {
  return (
    <Box sx={{
      px: 2.5,
      py: 1.25,
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      bgcolor: 'var(--mui-palette-action-hover)',
    }}>
      <i className={icon} style={{ fontSize: '0.95rem', color: 'var(--mui-palette-primary-main)' }} />
      <Typography
        variant='caption'
        sx={{
          fontWeight: 700,
          color: 'text.primary',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        {label}
      </Typography>
    </Box>
  )
}

// ── Filter row ──
function FilterRow({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <Box sx={{
      px: 2.5,
      py: 1,
      transition: 'background 0.15s ease',
      '&:hover': { bgcolor: 'action.hover' },
    }}>
      <Typography
        variant='caption'
        sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: 'text.secondary',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          mb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
        }}
      >
        <i className={icon} style={{ fontSize: '0.7rem' }} />
        {label}
      </Typography>
      {children}
    </Box>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface MeetingFilterPanelProps {
  columnFilters: Record<string, string>
  onFilterChange: (columnId: string, value: string) => void
  loading: boolean
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

export default function MeetingFilterPanel({
  columnFilters, onFilterChange, loading, filterOptions, t,
}: MeetingFilterPanelProps) {
  const { writeToUrl, clearUrl } = useSidebarFilterParams()

  const [localFilters, setLocalFilters] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}

    for (const key of SIDEBAR_KEYS) {
      if (columnFilters[key]) init[key] = columnFilters[key]
    }

    
return init
  })

  const f = (key: string) => localFilters[key] || ''

  const setLocal = useCallback((key: string, value: string) => {
    setLocalFilters(prev => {
      if (!value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [key]: _removed, ...rest } = prev


return rest
      }

      
return { ...prev, [key]: value }
    })
  }, [])

  // Date type chip toggling (comma-separated values)
  const dateTypeRaw = localFilters['date_type'] || ''
  const activeDateTypes = new Set(dateTypeRaw ? dateTypeRaw.split(',') : [])

  const toggleDateType = (value: string) => {
    const next = new Set(activeDateTypes)

    if (next.has(value)) { next.delete(value) } else { next.add(value) }
    setLocal('date_type', Array.from(next).join(','))
  }

  const activeCount = useMemo(
    () => SIDEBAR_KEYS.filter(k => !!localFilters[k]).length,
    [localFilters]
  )

  const handleApply = useCallback(() => {
    writeToUrl(localFilters)

    for (const key of SIDEBAR_KEYS) {
      const localVal = localFilters[key] || ''
      const parentVal = columnFilters[key] || ''

      if (localVal !== parentVal) {
        onFilterChange(key, localVal)
      }
    }
  }, [localFilters, columnFilters, onFilterChange, writeToUrl])

  const handleClear = useCallback(() => {
    setLocalFilters({})
    clearUrl()

    for (const key of SIDEBAR_KEYS) {
      if (columnFilters[key]) {
        onFilterChange(key, '')
      }
    }
  }, [columnFilters, onFilterChange, clearUrl])

  return (
    <Card sx={{
      width: 260,
      minWidth: 260,
      flexShrink: 0,
      alignSelf: 'flex-start',
      overflow: 'hidden',
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 120px)',
      position: 'sticky',
      top: 80,
      borderLeft: '3px solid var(--mui-palette-primary-main)',
      '&::-webkit-scrollbar': { width: 5 },
      '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: 'var(--mui-palette-action-disabled)',
        borderRadius: 3,
        '&:hover': { bgcolor: 'var(--mui-palette-action-active)' },
      },
    }}>
      {/* ── Header ── */}
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-filter-3-line' style={{ fontSize: '1.1rem' }} />
            <Typography variant='h6' sx={{ fontSize: '0.95rem' }}>Filtres</Typography>
            {activeCount > 0 && (
              <Chip
                label={activeCount}
                color='primary'
                size='small'
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
              />
            )}
          </Box>
        }
        action={
          activeCount > 0 ? (
            <IconButton size='small' onClick={handleClear} title={t.filterClear}>
              <i className='ri-close-line' style={{ fontSize: '1rem' }} />
            </IconButton>
          ) : undefined
        }
        sx={{
          py: 2,
          px: 2.5,
          '& .MuiCardHeader-action': { mt: 0 },
        }}
      />
      <Divider />

      {/* ══════════ DATE ══════════ */}
      <Section icon='ri-calendar-2-line' label={t.sectionDate} />

      <FilterRow icon='ri-calendar-check-line' label={t.filterFrom}>
        <TextField
          type='date'
          size='small'
          fullWidth
          value={f('date_from')}
          onChange={e => setLocal('date_from', e.target.value)}
          disabled={loading}
          variant='outlined'
          sx={FIELD_SX}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </FilterRow>

      <FilterRow icon='ri-calendar-close-line' label={t.filterTo}>
        <TextField
          type='date'
          size='small'
          fullWidth
          value={f('date_to')}
          onChange={e => setLocal('date_to', e.target.value)}
          disabled={loading}
          variant='outlined'
          sx={FIELD_SX}
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </FilterRow>

      <Box sx={{ px: 2.5, py: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {DATE_TYPES.map(dt => (
          <Chip
            key={dt.value}
            icon={<i className={dt.icon} style={{ fontSize: '0.7rem' }} />}
            label={t[dt.labelKey]}
            size='small'
            variant={activeDateTypes.has(dt.value) ? 'filled' : 'outlined'}
            color={activeDateTypes.has(dt.value) ? 'primary' : 'default'}
            onClick={() => toggleDateType(dt.value)}
            sx={{
              fontSize: '0.68rem',
              height: 24,
              cursor: 'pointer',
              '& .MuiChip-icon': { fontSize: '0.7rem', ml: 0.5 },
            }}
          />
        ))}
      </Box>

      <Divider />

      {/* ══════════ RECHERCHE ══════════ */}
      <Section icon='ri-search-line' label={t.sectionSearch} />

      <FilterRow icon='ri-user-search-line' label={t.filterClientRef}>
        <PanelTextInput
          value={f('sidebar_search')}
          onChange={v => setLocal('sidebar_search', v)}
          loading={loading}
          placeholder={t.filterSearch}
          icon='ri-search-line'
        />
      </FilterRow>

      <FilterRow icon='ri-phone-line' label={t.filterPhone}>
        <PanelTextInput
          value={f('sidebar_phone')}
          onChange={v => setLocal('sidebar_phone', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-map-pin-2-line' label={t.filterPostcode}>
        <PanelTextInput
          value={f('sidebar_postcode')}
          onChange={v => setLocal('sidebar_postcode', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-building-2-line' label={t.filterCity}>
        <PanelTextInput
          value={f('sidebar_city')}
          onChange={v => setLocal('sidebar_city', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ PLAGES ══════════ */}
      <Section icon='ri-time-line' label={t.sectionRanges} />

      <FilterRow icon='ri-calendar-event-line' label={t.filterOpcRange}>
        <PanelSelect
          value={f('sidebar_opc_range')}
          items={filterOptions.date_ranges}
          onChange={v => setLocal('sidebar_opc_range', v)}
          loading={loading}
          placeholder={t.filterAll}
          withNull
        />
      </FilterRow>

      <FilterRow icon='ri-calendar-event-line' label={t.filterInAtRange}>
        <PanelSelect
          value={f('sidebar_in_at_range')}
          items={filterOptions.date_ranges}
          onChange={v => setLocal('sidebar_in_at_range', v)}
          loading={loading}
          placeholder={t.filterAll}
          withNull
        />
      </FilterRow>

      <Divider />

      {/* ══════════ ÉQUIPE ══════════ */}
      <Section icon='ri-team-line' label={t.sectionTeam} />

      <FilterRow icon='ri-headphone-line' label={t.filterTelepro}>
        <PanelAutocomplete
          value={f('sidebar_telepro')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_telepro', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-star-line' label={t.filterSales}>
        <PanelAutocomplete
          value={f('sidebar_sales')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_sales', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-star-line' label={t.filterSale2}>
        <PanelAutocomplete
          value={f('sidebar_sale2')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_sale2', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-follow-line' label={t.filterAssistant}>
        <PanelAutocomplete
          value={f('sidebar_assistant')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_assistant', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-add-line' label={t.filterCreator}>
        <PanelAutocomplete
          value={f('sidebar_creator')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_creator', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-check-line' label={t.filterConfirmator}>
        <PanelAutocomplete
          value={f('sidebar_confirmator')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_confirmator', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ STATUTS ══════════ */}
      <Section icon='ri-list-ordered-2' label={t.sectionStatuses} />

      <FilterRow icon='ri-flag-line' label={t.filterMeetingStatus}>
        <PanelAutocomplete
          value={f('sidebar_state')}
          items={filterOptions.meeting_statuses}
          onChange={v => setLocal('sidebar_state', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-phone-line' label={t.filterStatusCall}>
        <PanelAutocomplete
          value={f('sidebar_status_call')}
          items={filterOptions.status_calls}
          onChange={v => setLocal('sidebar_status_call', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-received-line' label={t.filterStatusLead}>
        <PanelAutocomplete
          value={f('sidebar_status_lead')}
          items={filterOptions.status_leads}
          onChange={v => setLocal('sidebar_status_lead', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ SÉLECTIONS ══════════ */}
      <Section icon='ri-list-check-2' label={t.sectionSelections} />

      <FilterRow icon='ri-megaphone-line' label={t.filterCampaign}>
        <PanelAutocomplete
          value={f('sidebar_campaign')}
          items={filterOptions.campaigns}
          onChange={v => setLocal('sidebar_campaign', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-phone-fill' label={t.filterCallcenter}>
        <PanelAutocomplete
          value={f('sidebar_callcenter')}
          items={filterOptions.callcenters}
          onChange={v => setLocal('sidebar_callcenter', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-leaf-line' label={t.filterPolluter}>
        <PanelAutocomplete
          value={f('sidebar_polluter')}
          items={filterOptions.polluters}
          onChange={v => setLocal('sidebar_polluter', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-building-4-line' label={t.filterCompany}>
        <PanelAutocomplete
          value={f('sidebar_company')}
          items={filterOptions.companies}
          onChange={v => setLocal('sidebar_company', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-building-line' label={t.filterPartnerLayer}>
        <PanelAutocomplete
          value={f('sidebar_partner_layer')}
          items={filterOptions.partner_layers}
          onChange={v => setLocal('sidebar_partner_layer', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      {filterOptions.meeting_types.length > 0 && (
        <FilterRow icon='ri-price-tag-3-line' label={t.filterMeetingType}>
          <PanelAutocomplete
            value={f('sidebar_meeting_type')}
            items={filterOptions.meeting_types}
            onChange={v => setLocal('sidebar_meeting_type', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      <Divider />

      {/* ══════════ INDICATEURS ══════════ */}
      <Section icon='ri-toggle-line' label={t.sectionFlags} />

      <Box sx={{ px: 2.5, py: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          label={t.colConfirmed}
          size='small'
          variant={f('sidebar_is_confirmed') === 'YES' ? 'filled' : 'outlined'}
          color={f('sidebar_is_confirmed') === 'YES' ? 'success' : f('sidebar_is_confirmed') === 'NO' ? 'warning' : 'default'}
          onClick={() => {
            const cur = f('sidebar_is_confirmed')

            setLocal('sidebar_is_confirmed', cur === '' ? 'YES' : cur === 'YES' ? 'NO' : '')
          }}
          sx={{ fontSize: '0.72rem', height: 24, cursor: 'pointer' }}
        />
        <Chip
          label={t.colHold}
          size='small'
          variant={f('sidebar_is_hold') === 'YES' ? 'filled' : 'outlined'}
          color={f('sidebar_is_hold') === 'YES' ? 'error' : f('sidebar_is_hold') === 'NO' ? 'success' : 'default'}
          onClick={() => {
            const cur = f('sidebar_is_hold')

            setLocal('sidebar_is_hold', cur === '' ? 'YES' : cur === 'YES' ? 'NO' : '')
          }}
          sx={{ fontSize: '0.72rem', height: 24, cursor: 'pointer' }}
        />
        <Chip
          label={t.colHoldQuote}
          size='small'
          variant={f('sidebar_is_hold_quote') === 'YES' ? 'filled' : 'outlined'}
          color={f('sidebar_is_hold_quote') === 'YES' ? 'error' : f('sidebar_is_hold_quote') === 'NO' ? 'success' : 'default'}
          onClick={() => {
            const cur = f('sidebar_is_hold_quote')

            setLocal('sidebar_is_hold_quote', cur === '' ? 'YES' : cur === 'YES' ? 'NO' : '')
          }}
          sx={{ fontSize: '0.72rem', height: 24, cursor: 'pointer' }}
        />
        <Chip
          label={t.colQualified}
          size='small'
          variant={f('sidebar_is_qualified') === 'YES' ? 'filled' : 'outlined'}
          color={f('sidebar_is_qualified') === 'YES' ? 'success' : f('sidebar_is_qualified') === 'NO' ? 'default' : 'default'}
          onClick={() => {
            const cur = f('sidebar_is_qualified')

            setLocal('sidebar_is_qualified', cur === '' ? 'YES' : cur === 'YES' ? 'NO' : '')
          }}
          sx={{ fontSize: '0.72rem', height: 24, cursor: 'pointer' }}
        />
      </Box>

      {/* ══════════ ACTION BUTTONS ══════════ */}
      <Box sx={{
        position: 'sticky',
        bottom: 0,
        px: 2.5,
        py: 2,
        display: 'flex',
        gap: 1,
        bgcolor: 'var(--mui-palette-background-paper)',
        borderTop: '1px solid var(--mui-palette-divider)',
      }}>
        <Button
          variant='contained'
          size='small'
          fullWidth
          disabled={loading || activeCount === 0}
          onClick={handleApply}
          startIcon={<i className='ri-filter-3-line' style={{ fontSize: '0.9rem' }} />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
          }}
        >
          {t.filterApply}{activeCount > 0 ? ` (${activeCount})` : ''}
        </Button>

        <Button
          variant='outlined'
          color='error'
          size='small'
          disabled={loading || activeCount === 0}
          onClick={handleClear}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8125rem',
            minWidth: 'auto',
            px: 1.5,
          }}
        >
          <i className='ri-delete-bin-line' style={{ fontSize: '0.9rem' }} />
        </Button>
      </Box>
    </Card>
  )
}
