'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

import { useEditPermissions } from '../useEditPermissions'
import type { TeamFinanceFormData } from '../editFormSchema'
import type { ContractFilterOptions, FilterOption } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabTeamAttributionProps {
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

export default function TabTeamAttribution({ form, filterOptions, filterOptionsLoading, t }: TabTeamAttributionProps) {
  const { control } = form
  const { canEdit } = useEditPermissions()

  // Edit credentials for team fields
  const editTelepro = canEdit('contract_attributions_modify_telepro')
  const editSale1 = canEdit('contract_attributions_modify_sale1')
  const editSale2 = canEdit('contract_attributions_modify_sale2')
  const editManager = canEdit('contract_attributions_modify_managers')
  const editAssistant = canEdit('contract_attributions_modify_assistant')
  const editInstaller = canEdit('contract_modify_installer_user_id')
  const editPolluter = canEdit('contract_modify_polluter_id')
  const editPartnerLayer = canEdit('contract_modify_partner_layer_id')
  const editCampaign = canEdit('contract_modify_campaign_id')
  const editOpcRange = canEdit('contract_modify_opc_range')
  const editSavRange = canEdit('contract_modify_sav_at_range')

  if (filterOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const teamFields: { name: keyof TeamFinanceFormData; label: string; options: FilterOption[]; editable: boolean }[] = [
    { name: 'telepro_id', label: t.wizardTelepro, options: filterOptions.users, editable: editTelepro },
    { name: 'sale_1_id', label: t.wizardSale1, options: filterOptions.users, editable: editSale1 },
    { name: 'sale_2_id', label: t.wizardSale2, options: filterOptions.users, editable: editSale2 },
    { name: 'manager_id', label: t.wizardManager, options: filterOptions.users, editable: editManager },
    { name: 'assistant_id', label: t.wizardAssistant, options: filterOptions.users, editable: editAssistant },
    { name: 'installer_user_id', label: t.wizardInstaller, options: filterOptions.users, editable: editInstaller },
    { name: 'team_id', label: t.wizardTeam, options: filterOptions.teams, editable: true },
    { name: 'company_id', label: t.wizardCompany, options: filterOptions.companies, editable: true },
  ]

  const referenceFields: { name: keyof TeamFinanceFormData; label: string; options: FilterOption[]; editable: boolean }[] = [
    { name: 'polluter_id', label: t.wizardPolluter, options: filterOptions.polluters, editable: editPolluter },
    { name: 'partner_layer_id', label: t.wizardPartnerLayer, options: filterOptions.partner_layers, editable: editPartnerLayer },
    { name: 'campaign_id', label: t.wizardCampaign, options: filterOptions.campaigns, editable: editCampaign },
  ]

  const rangeFields: { name: keyof TeamFinanceFormData; label: string; options: FilterOption[]; editable: boolean }[] = [
    { name: 'opc_range_id', label: t.wizardOpcRange, options: filterOptions.date_ranges, editable: editOpcRange },
    { name: 'sav_at_range_id', label: t.wizardSavRange, options: filterOptions.date_ranges, editable: editSavRange },
  ]

  return (
    <Box>
      {/* Team section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-team-line' />
        {t.wizardTeamSection}
      </Typography>
      <Grid container spacing={3}>
        {teamFields.map(({ name, label, options, editable }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name={name}
              control={control}
              label={label}
              options={options}
              disabled={!editable}
              helperText={!editable ? t.editFieldDisabled : undefined}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Additional references */}
      <Grid container spacing={3}>
        {referenceFields.map(({ name, label, options, editable }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name={name}
              control={control}
              label={label}
              options={options}
              disabled={!editable}
              helperText={!editable ? t.editFieldDisabled : undefined}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Ranges */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-calendar-schedule-line' />
        {t.wizardRangesSection}
      </Typography>
      <Grid container spacing={3}>
        {rangeFields.map(({ name, label, options, editable }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name={name}
              control={control}
              label={label}
              options={options}
              disabled={!editable}
              helperText={!editable ? t.editFieldDisabled : undefined}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
