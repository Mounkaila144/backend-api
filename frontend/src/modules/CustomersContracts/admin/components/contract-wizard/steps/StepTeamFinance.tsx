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
import CircularProgress from '@mui/material/CircularProgress'

import { useWizardPermissions } from '../useWizardPermissions'
import type { TeamFinanceFormData } from '../contractFormSchema'
import type { ContractFilterOptions, FilterOption } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface StepTeamFinanceProps {
  form: UseFormReturn<TeamFinanceFormData>
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
  name: keyof TeamFinanceFormData
  control: UseFormReturn<TeamFinanceFormData>['control']
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

export default function StepTeamFinance({ form, filterOptions, filterOptionsLoading, t }: StepTeamFinanceProps) {
  const { control } = form
  const { canShow, canShowForAdmin, shouldRemove } = useWizardPermissions()

  // Team attribution credentials
  const showTelepro = canShowForAdmin('contract_attributions_modify_telepro')
  const showSale1 = canShowForAdmin('contract_attributions_modify_sale1')
  const showSale2 = canShowForAdmin('contract_attributions_modify_sale2')
  const showManager = canShowForAdmin('contract_attributions_modify_managers')
  const showAssistant = canShowForAdmin('contract_attributions_modify_assistant')
  const showInstaller = canShow('contract_new_installer_user')
  const showPolluter = canShowForAdmin('contract_new_polluter')
  const hideTeam = shouldRemove('contract_attributions_modify_no_team')
  const showCampaign = canShow('contract_new_contract_campaign')
  const showAdminStatus = canShowForAdmin('contract_new_admin_status')
  const showTimeStatus = canShow('contract_new_time_state')
  const showIsBillable = canShow('contract_new_is_billable')

  if (filterOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const teamFields: { name: keyof TeamFinanceFormData; label: string; options: FilterOption[]; visible: boolean }[] = [
    { name: 'telepro_id', label: t.wizardTelepro, options: filterOptions.users, visible: showTelepro },
    { name: 'sale_1_id', label: t.wizardSale1, options: filterOptions.users, visible: showSale1 },
    { name: 'sale_2_id', label: t.wizardSale2, options: filterOptions.users, visible: showSale2 },
    { name: 'manager_id', label: t.wizardManager, options: filterOptions.users, visible: showManager },
    { name: 'assistant_id', label: t.wizardAssistant, options: filterOptions.users, visible: showAssistant },
    { name: 'installer_user_id', label: t.wizardInstaller, options: filterOptions.users, visible: showInstaller },
    { name: 'team_id', label: t.wizardTeam, options: filterOptions.teams, visible: !hideTeam },
    { name: 'sous_traitant_id', label: t.wizardSousTraitant, options: filterOptions.users, visible: true },
  ]

  const visibleTeamFields = teamFields.filter(f => f.visible)

  return (
    <Box>
      {/* Works type section (polluter_id) */}
      {showPolluter ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-hammer-line' />
            {t.wizardWorksType}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField name='polluter_id' control={control} label={t.wizardWorksType} options={filterOptions.polluters} />
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Team section */}
      {visibleTeamFields.length > 0 ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-team-line' />
            {t.wizardTeamSection}
          </Typography>
          <Grid container spacing={3}>
            {visibleTeamFields.map(({ name, label, options }) => (
              <Grid key={name} size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name={name} control={control} label={label} options={options} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Campaign (permission-gated) */}
      {showCampaign ? (
        <>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField name='campaign_id' control={control} label={t.wizardCampaign} options={filterOptions.campaigns} />
            </Grid>
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Reports section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-file-text-line' />
        {t.sectionReports}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='rapport_installation'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardRapport}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='rapport_temps'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardRapportSuivie}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Other section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-information-line' />
        {t.wizardOtherSection}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='periode_cee'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardPeriodeCee}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_parcelle'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardSurfaceParcelle}
                fullWidth
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Finance section (remaining: mensuality, advance_payment) */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.wizardFinanceSection}
      </Typography>
      <Grid container spacing={3}>
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
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Status section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-settings-3-line' />
        {t.wizardStatusSection}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='install_state_id' control={control} label={t.wizardInstallStatus} options={filterOptions.install_statuses} />
        </Grid>
        {showAdminStatus ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField name='admin_status_id' control={control} label={t.wizardAdminStatus} options={filterOptions.admin_statuses} />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField name='opc_status_id' control={control} label={t.wizardOpcStatus} options={filterOptions.opc_statuses} />
        </Grid>
        {showTimeStatus ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField name='time_state_id' control={control} label={t.wizardTimeStatus} options={filterOptions.time_statuses} />
          </Grid>
        ) : null}
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
        {showIsBillable ? (
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
                >
                  <MenuItem value='YES'>{t.yes}</MenuItem>
                  <MenuItem value='NO'>{t.no}</MenuItem>
                </TextField>
              )}
            />
          </Grid>
        ) : null}
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
