'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useEditPermissions } from '../../useEditPermissions'
import type { MeetingDetailsEditFormData, TeamEditFormData } from '../../editFormSchema'
import type { CustomerMeeting, MeetingFilterOptions } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabLeadTrackingProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  meeting: CustomerMeeting | null
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

export default function EditSubTabLeadTracking({ detailsForm, teamForm, meeting, filterOptions, t }: EditSubTabLeadTrackingProps) {
  const { canEdit } = useEditPermissions()

  const canEditCreatedBy = canEdit('meeting_modify_createdby')
  const canEditCreatedAt = canEdit('meeting_modify_created_date')
  const canEditTreatedAt = canEdit('meeting_modify_treatment_date')

  // Format the system created_at as a readable string
  const systemCreatedAt = meeting?.created_at
    ? new Date(meeting.created_at).toLocaleString('fr-FR')
    : '---'

  return (
    <Box>
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-file-list-3-line' />
        {t.sectionLeadTracking}
      </Typography>
      <Grid container spacing={3}>
        {/* CREATEUR */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='created_by_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.users}
                getOptionLabel={opt => opt.name}
                value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.colCreator} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditCreatedBy}
              />
            )}
          />
        </Grid>

        {/* DATE DE CREATION (readonly system timestamp) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t.wizardDateCreatedReadonly}
            value={systemCreatedAt}
            fullWidth
            disabled
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        {/* DATE_TREATED */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='treated_at'
            control={detailsForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.wizardDateTreated}
                type='datetime-local'
                fullWidth
                disabled={!canEditTreatedAt}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* DATE FICHE (creation_at in form = DATE FICHE in Symfony) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='created_at'
            control={detailsForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.wizardDateFiche}
                type='datetime-local'
                fullWidth
                disabled={!canEditCreatedAt}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
