'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'

import { useEditPermissions } from '../useEditPermissions'
import type { TeamFinanceFormData } from '../editFormSchema'
import type { ContractFilterOptions, FilterOption } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabFinanceStatusProps {
  form: UseFormReturn<TeamFinanceFormData>
  filterOptions: ContractFilterOptions
  t: ContractTranslations
}

function AutocompleteField({
  name,
  control,
  label,
  options,
  disabled,
  helperText,
}: {
  name: keyof TeamFinanceFormData
  control: UseFormReturn<TeamFinanceFormData>['control']
  label: string
  options: FilterOption[]
  disabled?: boolean
  helperText?: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Autocomplete
          options={options}
          getOptionLabel={opt => opt.name}
          value={options.find(o => Number(o.id) === Number(field.value)) ?? null}
          onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
          disabled={disabled}
          renderInput={params => (
            <TextField {...params} label={label} helperText={helperText} />
          )}
          isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
        />
      )}
    />
  )
}

export default function TabFinanceStatus({ form, filterOptions, t }: TabFinanceStatusProps) {
  const { control } = form
  const { canEdit, shouldHide } = useEditPermissions()

  // Edit credentials
  const editState = canEdit('contract_modify_state')
  const editFinancialPartner = canEdit('contract_modify_financial_partner')
  const editAdminStatus = canEdit('contract_modify_admin_status_id')
  const editTimeState = canEdit('contract_modify_time_state')
  const editIsBillable = canEdit('contract_modify_is_billable')

  // Hide credentials
  const hideFinancialPartner = shouldHide('contract_modify_no_financial_partner_id')
  const hideTotalPriceHt = shouldHide('contract_turnover_ht_hidden') || shouldHide('contract_turnover_ht_remove')
  const hideTotalPriceTtc = shouldHide('contract_turnover_ttc_hidden') || shouldHide('contract_turnover_ttc_remove')
  const hideTaxId = shouldHide('contract_modify_no_tax_id')
  const hideMensuality = shouldHide('contract_modify_no_mensuality')
  const hideAdvancePayment = shouldHide('contract_modify_no_advance_payment')
  const hideState = shouldHide('contract_modify_no_state')

  return (
    <Box>
      {/* Finance section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.wizardFinanceSection}
      </Typography>
      <Grid container spacing={3}>
        {!hideFinancialPartner ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name='financial_partner_id'
              control={control}
              label={t.wizardFinancialPartner}
              options={filterOptions.financial_partners}
              disabled={!editFinancialPartner}
              helperText={!editFinancialPartner ? t.editFieldDisabled : undefined}
            />
          </Grid>
        ) : null}
        {!hideTaxId ? (
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
        {!hideTotalPriceHt ? (
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
        {!hideTotalPriceTtc ? (
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
        {!hideMensuality ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='mensuality'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  label={t.wizardMensuality}
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
        {!hideAdvancePayment ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='advance_payment'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  label={t.wizardAdvancePayment}
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

      {/* Status section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-settings-3-line' />
        {t.wizardStatusSection}
      </Typography>
      <Grid container spacing={3}>
        {!hideState ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name='state_id'
              control={control}
              label={t.wizardContractStatus}
              options={filterOptions.contract_statuses}
              disabled={!editState}
              helperText={!editState ? t.editFieldDisabled : undefined}
            />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='install_state_id'
            control={control}
            label={t.wizardInstallStatus}
            options={filterOptions.install_statuses}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='admin_status_id'
            control={control}
            label={t.wizardAdminStatus}
            options={filterOptions.admin_statuses}
            disabled={!editAdminStatus}
            helperText={!editAdminStatus ? t.editFieldDisabled : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='opc_status_id'
            control={control}
            label={t.wizardOpcStatus}
            options={filterOptions.opc_statuses}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='time_state_id'
            control={control}
            label={t.wizardTimeStatus}
            options={filterOptions.time_statuses}
            disabled={!editTimeState}
            helperText={!editTimeState ? t.editFieldDisabled : undefined}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='is_signed'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? 'NO'}
                select
                label={t.isSigned}
                fullWidth
              >
                <MenuItem value='YES'>{t.yes}</MenuItem>
                <MenuItem value='NO'>{t.no}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='is_billable'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? 'NO'}
                select
                label={t.wizardIsBillable}
                fullWidth
                disabled={!editIsBillable}
                helperText={!editIsBillable ? t.editFieldDisabled : undefined}
              >
                <MenuItem value='YES'>{t.yes}</MenuItem>
                <MenuItem value='NO'>{t.no}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='status'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? 'ACTIVE'}
                select
                label={t.statusLabel}
                fullWidth
              >
                <MenuItem value='ACTIVE'>{t.statusActive}</MenuItem>
                <MenuItem value='DELETE'>{t.statusDeleted}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
