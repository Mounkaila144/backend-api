'use client'

import { useState, useCallback, useMemo } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Tooltip from '@mui/material/Tooltip'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import { useTheme } from '@mui/material/styles'

import type { MeetingFilterOptions, ScheduleFilters } from '../../../types'

interface FilterOption {
  id: number | string
  name: string
}

interface ScheduleFilterPanelProps {
  filters: ScheduleFilters
  filterOptions: MeetingFilterOptions
  onFilterChange: (key: keyof ScheduleFilters, value: any) => void
  onClose: () => void
}

interface MultiSelectFilterProps {
  label: string
  options: FilterOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
}

const MultiSelectFilter = ({ label, options, selectedIds, onChange, placeholder }: MultiSelectFilterProps) => {
  const theme = useTheme()

  const selectedOptions = useMemo(
    () => options.filter(opt => selectedIds.includes(String(opt.id))),
    [options, selectedIds]
  )

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          mb: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          color: 'text.secondary',
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          letterSpacing: '0.05em',
        }}
      >
        {label}
        {selectedIds.length > 0 && (
          <Box
            component="span"
            sx={{
              backgroundColor: theme.palette.primary.main,
              color: '#fff',
              borderRadius: '10px',
              px: 0.7,
              fontSize: '0.6rem',
              fontWeight: 700,
              lineHeight: 1.6,
              minWidth: 16,
              textAlign: 'center',
            }}
          >
            {selectedIds.length}
          </Box>
        )}
      </Typography>
      <Autocomplete
        multiple
        size="small"
        options={options}
        value={selectedOptions}
        getOptionLabel={opt => opt.name}
        isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
        onChange={(_event, newValue) => {
          onChange(newValue.map(v => String(v.id)))
        }}
        disableCloseOnSelect
        renderOption={(props, option, { selected }) => {
          const { key, ...rest } = props as any
          return (
            <li key={key} {...rest} style={{ padding: '2px 8px', fontSize: '0.8rem' }}>
              <Checkbox
                size="small"
                checked={selected}
                sx={{ mr: 0.5, p: 0.25 }}
              />
              {option.name}
            </li>
          )
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index })
            return (
              <Chip
                key={key}
                label={option.name}
                size="small"
                {...tagProps}
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  maxWidth: 150,
                  '& .MuiChip-label': { px: 0.75 },
                  '& .MuiChip-deleteIcon': { fontSize: 14 },
                }}
              />
            )
          })
        }
        renderInput={params => (
          <TextField
            {...params}
            placeholder={selectedOptions.length === 0 ? (placeholder || 'Rechercher...') : ''}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.8rem',
                minHeight: 36,
                py: '2px !important',
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />
        )}
        slotProps={{
          paper: {
            sx: {
              fontSize: '0.8rem',
              '& .MuiAutocomplete-listbox': {
                maxHeight: 220,
                py: 0.5,
              },
            },
          },
          popper: {
            placement: 'bottom-start',
            modifiers: [{ name: 'flip', enabled: true }],
          },
        }}
        noOptionsText="Aucun résultat"
      />
    </Box>
  )
}

const ScheduleFilterPanel = ({ filters, filterOptions, onFilterChange, onClose }: ScheduleFilterPanelProps) => {
  const [postcode, setPostcode] = useState(filters.postcode || '')

  const getSelectedIds = useCallback((filterValue: string | undefined): string[] => {
    if (!filterValue) return []
    return filterValue.split(',').filter(Boolean)
  }, [])

  const handleMultiChange = useCallback(
    (filterKey: keyof ScheduleFilters) => (ids: string[]) => {
      onFilterChange(filterKey, ids.length > 0 ? ids.join(',') : undefined)
    },
    [onFilterChange]
  )

  const handlePostcodeSubmit = useCallback(() => {
    onFilterChange('postcode', postcode || undefined)
  }, [postcode, onFilterChange])

  const handleClearAll = useCallback(() => {
    const keysToReset: (keyof ScheduleFilters)[] = [
      'in_telepro_id', 'in_sales_id', 'in_state_id', 'in_status_call_id',
      'in_status_lead_id', 'in_campaign_id', 'in_callcenter_id', 'is_confirmed', 'postcode',
    ]
    keysToReset.forEach(key => onFilterChange(key, undefined))
    setPostcode('')
  }, [onFilterChange])

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          pb: 1,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Filtres
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Réinitialiser">
            <IconButton size="small" onClick={handleClearAll}>
              <i className="ri-restart-line" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fermer">
            <IconButton size="small" onClick={onClose}>
              <i className="ri-close-line" style={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {/* Postcode */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              display: 'block',
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
            }}
          >
            Code postal
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="ex: 75, 69..."
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handlePostcodeSubmit()}
            onBlur={handlePostcodeSubmit}
            sx={{
              '& .MuiInputBase-input': { fontSize: '0.8rem', py: 0.75 },
              '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
            }}
          />
        </Box>

        <Divider sx={{ mx: 1.5 }} />

        {/* Confirmation */}
        <Box sx={{ px: 1.5, py: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              mb: 0.5,
              display: 'block',
              color: 'text.secondary',
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
            }}
          >
            Confirmation
          </Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.is_confirmed === 'YES'}
                  onChange={() => onFilterChange('is_confirmed', filters.is_confirmed === 'YES' ? undefined : 'YES')}
                  sx={{ py: 0.25 }}
                />
              }
              label={<Typography variant="caption" sx={{ fontSize: '0.8rem' }}>Confirmé</Typography>}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={filters.is_confirmed === 'NO'}
                  onChange={() => onFilterChange('is_confirmed', filters.is_confirmed === 'NO' ? undefined : 'NO')}
                  sx={{ py: 0.25 }}
                />
              }
              label={<Typography variant="caption" sx={{ fontSize: '0.8rem' }}>Non confirmé</Typography>}
            />
          </FormGroup>
        </Box>

        <Divider sx={{ mx: 1.5 }} />

        {/* Multi-select filters */}
        {filterOptions.users.length > 0 && (
          <MultiSelectFilter
            label="Source (Télépro)"
            options={filterOptions.users}
            selectedIds={getSelectedIds(filters.in_telepro_id)}
            onChange={handleMultiChange('in_telepro_id')}
            placeholder="Sélectionner télépro..."
          />
        )}

        {filterOptions.users.length > 0 && (
          <MultiSelectFilter
            label="Commercial"
            options={filterOptions.users}
            selectedIds={getSelectedIds(filters.in_sales_id)}
            onChange={handleMultiChange('in_sales_id')}
            placeholder="Sélectionner commercial..."
          />
        )}

        {filterOptions.meeting_statuses.length > 0 && (
          <MultiSelectFilter
            label="Statut RDV"
            options={filterOptions.meeting_statuses}
            selectedIds={getSelectedIds(filters.in_state_id)}
            onChange={handleMultiChange('in_state_id')}
            placeholder="Sélectionner statut..."
          />
        )}

        {filterOptions.status_calls.length > 0 && (
          <MultiSelectFilter
            label="Statut Appel"
            options={filterOptions.status_calls}
            selectedIds={getSelectedIds(filters.in_status_call_id)}
            onChange={handleMultiChange('in_status_call_id')}
            placeholder="Sélectionner statut appel..."
          />
        )}

        {filterOptions.status_leads.length > 0 && (
          <MultiSelectFilter
            label="Statut Lead"
            options={filterOptions.status_leads}
            selectedIds={getSelectedIds(filters.in_status_lead_id)}
            onChange={handleMultiChange('in_status_lead_id')}
            placeholder="Sélectionner statut lead..."
          />
        )}

        {filterOptions.campaigns.length > 0 && (
          <MultiSelectFilter
            label="Campagne"
            options={filterOptions.campaigns}
            selectedIds={getSelectedIds(filters.in_campaign_id)}
            onChange={handleMultiChange('in_campaign_id')}
            placeholder="Sélectionner campagne..."
          />
        )}

        {filterOptions.callcenters.length > 0 && (
          <MultiSelectFilter
            label="Call Center"
            options={filterOptions.callcenters}
            selectedIds={getSelectedIds(filters.in_callcenter_id)}
            onChange={handleMultiChange('in_callcenter_id')}
            placeholder="Sélectionner call center..."
          />
        )}
      </Box>
    </Box>
  )
}

export default ScheduleFilterPanel
