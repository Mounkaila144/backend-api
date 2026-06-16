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

import type { ContractFilterOptions, FilterOption } from '../../../types'
import type { ContractTranslations } from '../../hooks/useContractTranslations'
import { SIDEBAR_KEYS, useSidebarFilterParams } from '../../hooks/useSidebarFilterParams'

// ── Input styling: theme-aware with subtle inset ──
const FIELD_SX: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.8125rem',
    borderRadius: 1,
    backgroundColor: 'var(--mui-palette-background-paper)',
    transition: 'all 0.2s ease',
    '& fieldset': { borderColor: 'var(--mui-palette-divider)' },
    '&:hover fieldset': { borderColor: 'var(--mui-palette-primary-light)' },
    '&.Mui-focused': {
      '& fieldset': { borderWidth: '1.5px' },
    },
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
    '&.Mui-focused': {
      '& fieldset': { borderWidth: '1.5px' },
    },
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
    '&.Mui-focused': {
      '& fieldset': { borderWidth: '1.5px' },
    },
    '& .MuiOutlinedInput-input': { padding: '4px 4px !important', height: '1.4em' },
  },
}

const DROPDOWN_PAPER_SX = {
  borderRadius: 1,
  boxShadow: 'var(--mui-customShadows-lg)',
  border: '1px solid var(--mui-palette-divider)',
}

// ── Date type options ──
const DATE_TYPES = [
  { value: 'created_at', labelKey: 'filterDateCreated' as const, icon: 'ri-add-circle-line' },
  { value: 'opened_at', labelKey: 'filterDateInstall' as const, icon: 'ri-tools-line' },
  { value: 'opc_at', labelKey: 'filterDateAcceptation' as const, icon: 'ri-checkbox-circle-line' },
  { value: 'quoted_at', labelKey: 'filterDateSignDevis' as const, icon: 'ri-draft-line' },
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

interface ContractFilterPanelProps {
  columnFilters: Record<string, string>
  onFilterChange: (columnId: string, value: string) => void
  loading: boolean
  filterOptions: ContractFilterOptions
  t: ContractTranslations
}

export default function ContractFilterPanel({
  columnFilters, onFilterChange, loading, filterOptions, t,
}: ContractFilterPanelProps) {
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
        <Chip
          icon={<i className='ri-close-circle-line' style={{ fontSize: '0.7rem' }} />}
          label={t.filterDateNull}
          size='small'
          variant={f('date_null') === 'YES' ? 'filled' : 'outlined'}
          color={f('date_null') === 'YES' ? 'error' : 'default'}
          onClick={() => setLocal('date_null', f('date_null') === 'YES' ? '' : 'YES')}
          sx={{
            fontSize: '0.68rem',
            height: 24,
            cursor: 'pointer',
            '& .MuiChip-icon': { fontSize: '0.7rem', ml: 0.5 },
          }}
        />
      </Box>

      <FilterRow icon='ri-checkbox-circle-line' label={t.filterSurfaceParcelCheck}>
        <Chip
          label={f('surface_parcel_check') === 'YES' ? t.chipYes : t.chipNo}
          size='small'
          variant={f('surface_parcel_check') === 'YES' ? 'filled' : 'outlined'}
          color={f('surface_parcel_check') === 'YES' ? 'primary' : 'default'}
          onClick={() => setLocal('surface_parcel_check', f('surface_parcel_check') === 'YES' ? '' : 'YES')}
          sx={{ fontSize: '0.72rem', height: 24, cursor: 'pointer' }}
        />
      </FilterRow>

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
          value={f('opc_range_id')}
          items={filterOptions.date_ranges}
          onChange={v => setLocal('opc_range_id', v)}
          loading={loading}
          placeholder={t.filterAll}
          withNull
        />
      </FilterRow>

      <FilterRow icon='ri-calendar-event-line' label={t.filterSavRange}>
        <PanelSelect
          value={f('sav_at_range_id')}
          items={filterOptions.date_ranges}
          onChange={v => setLocal('sav_at_range_id', v)}
          loading={loading}
          placeholder={t.filterAll}
          withNull
        />
      </FilterRow>

      <Divider />

      {/* ══════════ DÉTAILS ══════════ */}
      <Section icon='ri-file-info-line' label={t.sectionDetails} />

      <FilterRow icon='ri-key-line' label={t.filterAcces1}>
        <PanelTextInput
          value={f('acces_1')}
          onChange={v => setLocal('acces_1', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-key-line' label={t.filterAcces2}>
        <PanelTextInput
          value={f('acces_2')}
          onChange={v => setLocal('acces_2', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-link' label={t.filterSource}>
        <PanelTextInput
          value={f('source')}
          onChange={v => setLocal('source', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ ÉQUIPE ══════════ */}
      <Section icon='ri-team-line' label={t.sectionTeamFilter} />

      <FilterRow icon='ri-user-check-line' label={t.filterConfirmateur}>
        <PanelAutocomplete
          value={f('confirmateur_id')}
          items={filterOptions.users}
          onChange={v => setLocal('confirmateur_id', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-phone-fill' label={t.filterRegie}>
        <PanelAutocomplete
          value={f('regie_callcenter')}
          items={filterOptions.teams}
          onChange={v => setLocal('regie_callcenter', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ RAPPORTS ══════════ */}
      <Section icon='ri-file-chart-line' label={t.sectionReports} />

      <FilterRow icon='ri-file-list-line' label={t.filterRapport}>
        <PanelTextInput
          value={f('rapport_installation')}
          onChange={v => setLocal('rapport_installation', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-git-branch-line' label={t.filterRapportAttribution}>
        <PanelTextInput
          value={f('rapport_attribution')}
          onChange={v => setLocal('rapport_attribution', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-timer-line' label={t.filterRapportTemps}>
        <PanelTextInput
          value={f('rapport_temps')}
          onChange={v => setLocal('rapport_temps', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <FilterRow icon='ri-admin-line' label={t.filterRapportAdmin}>
        <PanelTextInput
          value={f('rapport_admin')}
          onChange={v => setLocal('rapport_admin', v)}
          loading={loading}
          placeholder={t.filterSearch}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ SÉLECTIONS ══════════ */}
      <Section icon='ri-list-check-2' label={t.sectionSelections} />

      {filterOptions.products.length > 0 && (
        <FilterRow icon='ri-shopping-bag-line' label={t.filterProduct}>
          <PanelAutocomplete
            value={f('product_id')}
            items={filterOptions.products}
            onChange={v => setLocal('product_id', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      <FilterRow icon='ri-tools-line' label={t.filterEquipeInstall}>
        <PanelAutocomplete
          value={f('sidebar_financial_partner')}
          items={filterOptions.financial_partners}
          onChange={v => setLocal('sidebar_financial_partner', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-settings-line' label={t.filterInstallateur}>
        <PanelAutocomplete
          value={f('installer_user_id')}
          items={filterOptions.users}
          onChange={v => setLocal('installer_user_id', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-building-line' label={t.filterSousTraitant}>
        <PanelAutocomplete
          value={f('sidebar_partner_layer')}
          items={filterOptions.partner_layers}
          onChange={v => setLocal('sidebar_partner_layer', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-user-add-line' label={t.filterCreateur}>
        <PanelAutocomplete
          value={f('sidebar_creator')}
          items={filterOptions.users}
          onChange={v => setLocal('sidebar_creator', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <FilterRow icon='ri-building-4-line' label={t.filterSociete}>
        <PanelAutocomplete
          value={f('sidebar_company')}
          items={filterOptions.companies}
          onChange={v => setLocal('sidebar_company', v)}
          loading={loading}
          placeholder={t.filterAll}
        />
      </FilterRow>

      <Divider />

      {/* ══════════ DOMOPRIME ══════════ */}
      <Section icon='ri-leaf-line' label={t.sectionDomoprime} />

      {filterOptions.energies.length > 0 && (
        <FilterRow icon='ri-flashlight-line' label={t.filterEnergy}>
          <PanelAutocomplete
            value={f('energy_id')}
            items={filterOptions.energies}
            onChange={v => setLocal('energy_id', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      {filterOptions.sectors.length > 0 && (
        <FilterRow icon='ri-pie-chart-line' label={t.filterSector}>
          <PanelAutocomplete
            value={f('sector_id')}
            items={filterOptions.sectors}
            onChange={v => setLocal('sector_id', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      {filterOptions.zones.length > 0 && (
        <FilterRow icon='ri-map-pin-line' label={t.filterZone}>
          <PanelAutocomplete
            value={f('zone_id')}
            items={filterOptions.zones}
            onChange={v => setLocal('zone_id', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      {filterOptions.quotation_signed.length > 0 && (
        <FilterRow icon='ri-file-text-line' label={t.filterQuotationSigned}>
          <PanelSelect
            value={f('quotation_is_signed')}
            items={filterOptions.quotation_signed}
            onChange={v => setLocal('quotation_is_signed', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

      {filterOptions.document_signed.length > 0 && (
        <FilterRow icon='ri-file-check-line' label={t.filterDocumentSigned}>
          <PanelSelect
            value={f('document_is_signed')}
            items={filterOptions.document_signed}
            onChange={v => setLocal('document_is_signed', v)}
            loading={loading}
            placeholder={t.filterAll}
          />
        </FilterRow>
      )}

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
