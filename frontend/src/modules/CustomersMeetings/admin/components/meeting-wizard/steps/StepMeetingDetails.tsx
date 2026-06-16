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

import { useWizardPermissions } from '../useWizardPermissions'
import type { MeetingDetailsFormData } from '../meetingFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../types'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface StepMeetingDetailsProps {
  form: UseFormReturn<MeetingDetailsFormData>
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
  name: keyof MeetingDetailsFormData
  control: UseFormReturn<MeetingDetailsFormData>['control']
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

export default function StepMeetingDetails({ form, filterOptions, filterOptionsLoading, t }: StepMeetingDetailsProps) {
  const { control } = form
  const { canShow, canShowForAdmin, shouldRemove } = useWizardPermissions()

  const showInAt = !shouldRemove('meeting_new_remove_in_at')
  const showCallbackAt = canShowForAdmin('meeting_new_callback')
  const showOpcAt = canShow('meeting_new_opc_at')
  const showCreatedAt = canShowForAdmin('meeting_new_created_date')
  const showTreatedAt = canShowForAdmin('meeting_new_treated_at')

  const showStateId = canShowForAdmin('meeting_new_state')
  const showStatusCallId = canShowForAdmin('meeting_new_callstatus')
  const showStatusLeadId = canShowForAdmin('meeting_new_lead_status')

  const showOpcRangeId = canShow('meeting_new_opc_range')

  if (filterOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const dateFields: { name: keyof MeetingDetailsFormData; label: string; visible: boolean; required?: boolean }[] = [
    { name: 'in_at', label: t.wizardDateMeeting, visible: showInAt, required: true },
    { name: 'out_at', label: t.wizardDateEnd, visible: true },
    { name: 'callback_at', label: t.wizardDateCallback, visible: showCallbackAt },
    { name: 'opc_at', label: t.wizardDateOpc, visible: showOpcAt },
    { name: 'created_at', label: t.wizardDateCreated, visible: showCreatedAt },
    { name: 'treated_at', label: t.wizardDateTreated, visible: showTreatedAt },
  ]

  const visibleDates = dateFields.filter(d => d.visible)

  return (
    <Box>
      {/* Dates section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-calendar-check-line' />
        {t.sectionDates}
      </Typography>
      <Grid container spacing={3}>
        {visibleDates.map(({ name, label, required }) => (
          <Grid key={name} size={{ xs: 12, sm: 6 }}>
            <Controller
              name={name}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={label}
                  type='datetime-local'
                  fullWidth
                  required={required}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Statuses section */}
      {(showStateId || showStatusCallId || showStatusLeadId) ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-list-settings-line' />
            {t.sectionStatuses}
          </Typography>
          <Grid container spacing={3}>
            {showStateId ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name='state_id' control={control} label={t.wizardMeetingStatus} options={filterOptions.meeting_statuses} />
              </Grid>
            ) : null}
            {showStatusCallId ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name='status_call_id' control={control} label={t.wizardStatusCall} options={filterOptions.status_calls} />
              </Grid>
            ) : null}
            {showStatusLeadId ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name='status_lead_id' control={control} label={t.wizardStatusLead} options={filterOptions.status_leads} />
              </Grid>
            ) : null}
          </Grid>
          <Divider sx={{ my: 4 }} />
        </>
      ) : null}

      {/* Ranges section */}
      {(showOpcRangeId || filterOptions.date_ranges.length > 0) ? (
        <>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-time-line' />
            {t.sectionRanges}
          </Typography>
          <Grid container spacing={3}>
            {showOpcRangeId ? (
              <Grid size={{ xs: 12, sm: 6 }}>
                <AutocompleteField name='opc_range_id' control={control} label={t.wizardOpcRange} options={filterOptions.date_ranges} />
              </Grid>
            ) : null}
            <Grid size={{ xs: 12, sm: 6 }}>
              <AutocompleteField name='in_at_range_id' control={control} label={t.wizardInAtRange} options={filterOptions.date_ranges} />
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  )
}
