'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

import { useEditPermissions } from '../../useEditPermissions'
import type { MeetingDetailsEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabDatesStatusesProps {
  form: UseFormReturn<MeetingDetailsEditFormData>
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
  name: keyof MeetingDetailsEditFormData
  control: UseFormReturn<MeetingDetailsEditFormData>['control']
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

export default function EditSubTabDatesStatuses({ form, filterOptions, t }: EditSubTabDatesStatusesProps) {
  const { control } = form
  const { canEdit, canEditSuper, shouldHide } = useEditPermissions()

  // Date permissions (from Symfony CustomerMeetingViewForm)
  const canEditInAt = canEdit('meeting_modify_in_at')
  const showInAt = !shouldHide('meeting_view_remove_in_at')
  const canEditCallbackAt = canEdit('meeting_modify_callback')
  const canEditOpcAt = canEdit('meeting_modify_opc_at')
  const canEditCreatedAt = canEdit('meeting_modify_created_date')
  const canEditTreatedAt = canEdit('meeting_modify_treatment_date')

  // Status permissions
  const canEditStateId = canEdit('meeting_modify_state')
  const canEditStatusCallId = canEdit('meeting_modify_callstatus')
  const canEditStatusLeadId = canEdit('meeting_modify_lead_status')
  const canEditTypeId = canEditSuper('meeting_modify_type')

  // Range permissions
  const canEditOpcRange = canEdit('meeting_modify_opc_range')
  const canEditInAtRange = canEditSuper('meeting_modify_in_at_range')

  const dateFields: { name: keyof MeetingDetailsEditFormData; label: string; visible: boolean; editable: boolean }[] = [
    { name: 'in_at', label: t.wizardDateMeeting, visible: showInAt, editable: canEditInAt },
    { name: 'out_at', label: t.wizardDateEnd, visible: true, editable: true },
    { name: 'callback_at', label: t.wizardDateCallback, visible: true, editable: canEditCallbackAt },
    { name: 'opc_at', label: t.wizardDateOpc, visible: true, editable: canEditOpcAt },
    { name: 'created_at', label: t.wizardDateCreated, visible: true, editable: canEditCreatedAt },
    { name: 'treated_at', label: t.wizardDateTreated, visible: true, editable: canEditTreatedAt },
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
        {visibleDates.map(({ name, label, editable }) => (
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
                  disabled={!editable}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Statuses section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-list-settings-line' />
        {t.sectionStatuses}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='state_id'
            control={control}
            label={t.wizardMeetingStatus}
            options={filterOptions.meeting_statuses}
            disabled={!canEditStateId}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='status_call_id'
            control={control}
            label={t.wizardStatusCall}
            options={filterOptions.status_calls}
            disabled={!canEditStatusCallId}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='status_lead_id'
            control={control}
            label={t.wizardStatusLead}
            options={filterOptions.status_leads}
            disabled={!canEditStatusLeadId}
          />
        </Grid>
        {filterOptions.meeting_types.length > 0 ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <AutocompleteField
              name='type_id'
              control={control}
              label={t.colMeetingType}
              options={filterOptions.meeting_types}
              disabled={!canEditTypeId}
            />
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Ranges section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-time-line' />
        {t.sectionRanges}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='opc_range_id'
            control={control}
            label={t.wizardOpcRange}
            options={filterOptions.date_ranges}
            disabled={!canEditOpcRange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='in_at_range_id'
            control={control}
            label={t.wizardInAtRange}
            options={filterOptions.date_ranges}
            disabled={!canEditInAtRange}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
