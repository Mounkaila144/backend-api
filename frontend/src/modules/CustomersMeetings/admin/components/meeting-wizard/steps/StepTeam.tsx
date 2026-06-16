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
import CircularProgress from '@mui/material/CircularProgress'

import { useWizardPermissions } from '../useWizardPermissions'
import type { TeamFormData } from '../meetingFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../types'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface StepTeamProps {
  form: UseFormReturn<TeamFormData>
  filterOptions: MeetingFilterOptions
  filterOptionsLoading: boolean
  t: MeetingTranslations
}

function AutocompleteField({
  name,
  control,
  label,
  options,
}: {
  name: keyof TeamFormData
  control: UseFormReturn<TeamFormData>['control']
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

export default function StepTeam({ form, filterOptions, filterOptionsLoading, t }: StepTeamProps) {
  const { control } = form
  const { canShow, canShowForAdmin, shouldRemove } = useWizardPermissions()

  // Team
  const showTelepro = !shouldRemove('meeting_new_no_telepro')
  const showSales = !shouldRemove('meeting_new_sale1_remove')
  const showSale2 = !shouldRemove('meeting_new_sale2_remove')
  const showAssistant = canShowForAdmin('meeting_new_assistant')

  // Entities
  const showCampaign = canShowForAdmin('meeting_new_campaign')
  const showCallcenter = canShowForAdmin('meeting_new_callcenter')
  const showCompany = canShow('meeting_new_meeting_company')
  const showPolluter = canShow('meeting_new_polluter')
  const showPartnerLayer = canShow('meeting_new_partner_layer')

  // Finance
  const showTurnover = canShow('meeting_new_turnover')

  // Comments
  const showSaleComments = canShowForAdmin('meeting_modify_sale_comments')

  // Flags
  const showIsQualified = canShowForAdmin('meeting_new_qualified')

  if (filterOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const teamFields: { name: keyof TeamFormData; label: string; options: FilterOption[]; visible: boolean }[] = [
    { name: 'telepro_id', label: t.wizardTelepro, options: filterOptions.users, visible: showTelepro },
    { name: 'sales_id', label: t.wizardSales, options: filterOptions.users, visible: showSales },
    { name: 'sale2_id', label: t.wizardSale2, options: filterOptions.users, visible: showSale2 },
    { name: 'assistant_id', label: t.wizardAssistant, options: filterOptions.users, visible: showAssistant },
  ]

  const visibleTeamFields = teamFields.filter(f => f.visible)

  const entityFields: { name: keyof TeamFormData; label: string; options: FilterOption[]; visible: boolean }[] = [
    { name: 'campaign_id', label: t.wizardCampaign, options: filterOptions.campaigns, visible: showCampaign },
    { name: 'callcenter_id', label: t.wizardCallcenter, options: filterOptions.callcenters, visible: showCallcenter },
    { name: 'company_id', label: t.wizardCompanyMeeting, options: filterOptions.companies, visible: showCompany },
    { name: 'polluter_id', label: t.wizardPolluter, options: filterOptions.polluters, visible: showPolluter },
    { name: 'partner_layer_id', label: t.wizardPartnerLayer, options: filterOptions.partner_layers, visible: showPartnerLayer },
  ]

  const visibleEntityFields = entityFields.filter(f => f.visible)

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
            {visibleTeamFields.map(({ name, label, options }) => (
              <Grid key={name} size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name={name} control={control} label={label} options={options} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Entities section */}
      {visibleEntityFields.length > 0 ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-building-line' />
            {t.sectionEntities}
          </Typography>
          <Grid container spacing={3}>
            {visibleEntityFields.map(({ name, label, options }) => (
              <Grid key={name} size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name={name} control={control} label={label} options={options} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Finance section */}
      {showTurnover ? (
        <>
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
        </>
      ) : null}

      {/* Comments section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-chat-3-line' />
        {t.sectionComments}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={12}>
          <Controller
            name='remarks'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardRemarks}
                fullWidth
                multiline
                rows={3}
              />
            )}
          />
        </Grid>
        {showSaleComments ? (
          <Grid size={12}>
            <Controller
              name='sale_comments'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
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
        {showIsQualified ? (
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
