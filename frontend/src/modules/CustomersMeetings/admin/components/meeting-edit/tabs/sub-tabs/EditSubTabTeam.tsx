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
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

import { useEditPermissions } from '../../useEditPermissions'
import type { TeamEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabTeamProps {
  form: UseFormReturn<TeamEditFormData>
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

function AutocompleteField({
  name,
  control,
  label,
  options,
  disabled,
}: {
  name: keyof TeamEditFormData
  control: UseFormReturn<TeamEditFormData>['control']
  label: string
  options: FilterOption[]
  disabled?: boolean
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
          renderInput={params => <TextField {...params} label={label} />}
          isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
          disabled={disabled}
        />
      )}
    />
  )
}

export default function EditSubTabTeam({ form, filterOptions, t }: EditSubTabTeamProps) {
  const { control } = form
  const { canEdit, canEditSuper, shouldHide } = useEditPermissions()

  // Team visibility (from Symfony CustomerMeetingViewForm unset logic)
  const showTelepro = !shouldHide('meeting_view_no_telepro') && !shouldHide('meeting_view_telepro_as_user')
  const showSales = !shouldHide('meeting_view_no_sale1')
  const showSale2 = !shouldHide('meeting_view_no_sale2')
  const showAssistant = canEdit('meeting_modify_assistant')

  // Team edit permissions
  const canEditTelepro = canEdit('meeting_modify_telepro') || canEditSuper('meeting_view_telepro_select')
  const canEditSales = canEdit('meeting_modify_sales') || canEditSuper('meeting_view_sale1_select')
  const canEditSale2 = canEdit('meeting_modify_sale2') || canEditSuper('meeting_view_sale2_select')
  const canEditCreatedBy = canEdit('meeting_modify_createdby')

  // Entity permissions
  const canEditCampaign = canEdit('meeting_modify_campaign')
  const canEditCallcenter = canEdit('meeting_modify_callcenter')
  const canEditCompany = canEditSuper('meeting_modify_meeting_company')
  const canEditPolluter = canEdit('meeting_modify_polluter')
  const canEditPartnerLayer = canEditSuper('meeting_modify_partner_layer')

  // Finance
  const canEditTurnover = canEditSuper('meeting_modify_turnover')

  // Comments
  const canEditSaleComments = canEdit('meeting_modify_sale_comments')
  const showRemarks = !shouldHide('meeting_view_no_remarks')

  // Flags
  const canEditQualified = canEdit('meeting_modify_qualified')

  const teamFields: { name: keyof TeamEditFormData; label: string; options: FilterOption[]; visible: boolean; disabled: boolean }[] = [
    { name: 'telepro_id', label: t.wizardTelepro, options: filterOptions.users, visible: showTelepro, disabled: !canEditTelepro },
    { name: 'sales_id', label: t.wizardSales, options: filterOptions.users, visible: showSales, disabled: !canEditSales },
    { name: 'sale2_id', label: t.wizardSale2, options: filterOptions.users, visible: showSale2, disabled: !canEditSale2 },
    { name: 'assistant_id', label: t.wizardAssistant, options: filterOptions.users, visible: showAssistant, disabled: !showAssistant },
    { name: 'created_by_id', label: t.colCreator, options: filterOptions.users, visible: canEditCreatedBy, disabled: !canEditCreatedBy },
  ]

  const visibleTeamFields = teamFields.filter(f => f.visible)

  const entityFields: { name: keyof TeamEditFormData; label: string; options: FilterOption[]; visible: boolean; disabled: boolean }[] = [
    { name: 'campaign_id', label: t.wizardCampaign, options: filterOptions.campaigns, visible: true, disabled: !canEditCampaign },
    { name: 'callcenter_id', label: t.wizardCallcenter, options: filterOptions.callcenters, visible: true, disabled: !canEditCallcenter },
    { name: 'company_id', label: t.wizardCompanyMeeting, options: filterOptions.companies, visible: true, disabled: !canEditCompany },
    { name: 'polluter_id', label: t.wizardPolluter, options: filterOptions.polluters, visible: true, disabled: !canEditPolluter },
    { name: 'partner_layer_id', label: t.wizardPartnerLayer, options: filterOptions.partner_layers, visible: true, disabled: !canEditPartnerLayer },
  ]

  return (
    <Box>
      {/* Team section */}
      {visibleTeamFields.length > 0 ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-team-line' />
            {t.sectionTeam}
          </Typography>
          <Grid container spacing={3}>
            {visibleTeamFields.map(({ name, label, options, disabled }) => (
              <Grid key={name} size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name={name} control={control} label={label} options={options} disabled={disabled} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Entities section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-building-line' />
        {t.sectionEntities}
      </Typography>
      <Grid container spacing={3}>
        {entityFields.map(({ name, label, options, disabled }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <AutocompleteField name={name} control={control} label={label} options={options} disabled={disabled} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Finance section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.sectionFinance}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='turnover'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.wizardTurnover}
                type='number'
                fullWidth
                disabled={!canEditTurnover}
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

      {/* Comments section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-chat-3-line' />
        {t.sectionComments}
      </Typography>
      <Grid container spacing={3}>
        {showRemarks ? (
          <Grid size={12}>
            <Controller
              name='remarks'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t.wizardRemarks}
                  fullWidth
                  multiline
                  rows={3}
                />
              )}
            />
          </Grid>
        ) : null}
        {canEditSaleComments ? (
          <Grid size={12}>
            <Controller
              name='sale_comments'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t.wizardSaleComments}
                  fullWidth
                  multiline
                  rows={3}
                />
              )}
            />
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Meeting info section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-information-line' />
        {t.sectionMeetingInfo}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='see_with_mr'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value === 'YES'}
                    onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')}
                  />
                }
                label={t.wizardSeeWithMr}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='see_with_mrs'
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value === 'YES'}
                    onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')}
                  />
                }
                label={t.wizardSeeWithMrs}
              />
            )}
          />
        </Grid>
        {canEditQualified ? (
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name='is_qualified'
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value === 'YES'}
                      onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')}
                    />
                  }
                  label={t.wizardIsQualified}
                />
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
                label={t.colStatus}
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
