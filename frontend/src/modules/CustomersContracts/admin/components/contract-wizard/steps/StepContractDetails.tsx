'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'

import { useWizardPermissions } from '../useWizardPermissions'
import type { ContractDetailsFormData } from '../contractFormSchema'
import type { ContractFilterOptions, FilterOption } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface StepContractDetailsProps {
  form: UseFormReturn<ContractDetailsFormData>
  filterOptions: ContractFilterOptions
  filterOptionsLoading: boolean
  t: ContractTranslations
}

function AutocompleteField({
  name,
  control,
  label,
  options,
}: {
  name: keyof ContractDetailsFormData
  control: UseFormReturn<ContractDetailsFormData>['control']
  label: string
  options: FilterOption[]
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          options={options}
          getOptionLabel={opt => opt.name}
          value={options.find(o => o.id === field.value) ?? null}
          onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
          renderInput={params => <TextField {...params} label={label} />}
          isOptionEqualToValue={(opt, val) => opt.id === val.id}
        />
      )}
    />
  )
}

export default function StepContractDetails({ form, filterOptions, filterOptionsLoading, t }: StepContractDetailsProps) {
  const { control } = form
  const { canShow } = useWizardPermissions()

  // Template-only permissions (hasCredential in the .tpl file)
  const showClosedAt = canShow('contract_new_closed_at')
  const showHasTva = canShow('contract_new_hastva')
  const showTotalPriceTtc = canShow('contract_new_total_price_with_taxe')
  const showTax = canShow('contract_new_tva')
  const showTotalPriceHt = canShow('contract_new_total_price_without_taxe')
  const showOpcRange = canShow('contract_new_opc_range')

  if (filterOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  // All date fields — template lines 4-121
  // Fields with hasValidator only (no hasCredential) → always visible
  // closed_at has explicit hasCredential → permission-gated
  const dateFields: { name: keyof ContractDetailsFormData; label: string; visible: boolean }[] = [
    { name: 'sav_at', label: t.wizardDateInstallation, visible: true },
    { name: 'pre_meeting_at', label: t.datePreMeeting, visible: true },
    { name: 'quoted_at', label: t.dateQuote, visible: true },
    { name: 'opened_at', label: t.dateEngagement, visible: true },
    { name: 'billing_at', label: t.dateBilling, visible: true },
    { name: 'doc_at', label: t.dateDoc, visible: true },
    { name: 'opc_at', label: t.dateOpc, visible: true },
    { name: 'payment_at', label: t.datePayment, visible: true },
    { name: 'apf_at', label: t.dateApf, visible: true },
    { name: 'closed_at', label: t.dateClosed, visible: showClosedAt },
  ]

  const visibleDates = dateFields.filter(d => d.visible)

  return (
    <Box>
      {/* ── Dates (template lines 4-121) ── */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-calendar-check-line' />
        {t.sectionDates}
      </Typography>
      <Grid container spacing={3}>
        {visibleDates.map(({ name, label }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={label}
                  type='date'
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* ── TVA & Finance (template lines 123-157) ── */}
      {(showHasTva || showTotalPriceTtc || showTax || showTotalPriceHt) ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-money-euro-circle-line' />
            {t.wizardFinanceSection}
          </Typography>
          <Grid container spacing={3}>
            {showHasTva ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='has_tva'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      select
                      label={t.wizardHasTva}
                      fullWidth
                    >
                      <MenuItem value=''>&nbsp;</MenuItem>
                      <MenuItem value='1'>{t.wizardHasTvaYes}</MenuItem>
                      <MenuItem value='0'>{t.wizardHasTvaNo}</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            ) : null}
            {showTotalPriceTtc ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='total_price_with_taxe'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      label={t.priceTtc}
                      type='number'
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position='end'>EUR</InputAdornment>,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            ) : null}
            {showTax ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='tax_id'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      label={t.wizardTax}
                      type='number'
                      fullWidth
                    />
                  )}
                />
              </Grid>
            ) : null}
            {showTotalPriceHt ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='total_price_without_taxe'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      label={t.priceHt}
                      type='number'
                      fullWidth
                      slotProps={{
                        input: {
                          endAdornment: <InputAdornment position='end'>EUR</InputAdornment>,
                        },
                      }}
                    />
                  )}
                />
              </Grid>
            ) : null}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* ── References: Company, Financial Partner, Remarks, Layer (template lines 166-198) ── */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-file-text-line' />
        {t.sectionOther}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='company_id' control={control} label={t.wizardCompany} options={filterOptions.companies} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='financial_partner_id' control={control} label={t.wizardFinancialPartner} options={filterOptions.financial_partners} />
        </Grid>
        <Grid size={12}>
          <Controller
            name='remarks'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.remarks}
                fullWidth
                multiline
                rows={3}
                placeholder={t.remarksPlaceholder}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='partner_layer_id' control={control} label={t.wizardPartnerLayer} options={filterOptions.partner_layers} />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* ── State & Ranges (template lines 199-228) ── */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-settings-3-line' />
        {t.sectionStatus}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='state_id' control={control} label={t.wizardContractStatus} options={filterOptions.contract_statuses} />
        </Grid>
        {showOpcRange ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField name='opc_range_id' control={control} label={t.wizardOpcRange} options={filterOptions.date_ranges} />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='sav_at_range_id' control={control} label={t.wizardSavRange} options={filterOptions.date_ranges} />
        </Grid>
      </Grid>
    </Box>
  )
}
