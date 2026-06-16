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

interface EditSubTabInstallationProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  meeting: CustomerMeeting | null
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

export default function EditSubTabInstallation({ detailsForm, teamForm, meeting, filterOptions, t }: EditSubTabInstallationProps) {
  const { canEdit, canEditSuper } = useEditPermissions()

  const canEditStatusCallId = canEdit('meeting_modify_callstatus')
  const canEditCallcenter = canEdit('meeting_modify_callcenter')
  const canEditStatusLeadId = canEdit('meeting_modify_lead_status')
  const canEditOpcAt = canEdit('meeting_modify_opc_at')
  const canEditOpcRange = canEdit('meeting_modify_opc_range')
  const canEditInAtRange = canEditSuper('meeting_modify_in_at_range')

  // RAPPORT FICHE = meeting status name (readonly in Symfony)
  const reportFiche = meeting?.meeting_status?.name ?? '---'

  return (
    <Box>
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-settings-3-line' />
        {t.sectionInstallationStatus}
      </Typography>
      <Grid container spacing={3}>
        {/* RAPPORT COM. (status_call) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='status_call_id'
            control={detailsForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.status_calls}
                getOptionLabel={opt => opt.name}
                value={filterOptions.status_calls.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardReportCom} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditStatusCallId}
              />
            )}
          />
        </Grid>

        {/* CENTRE D'APPEL */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='callcenter_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.callcenters}
                getOptionLabel={opt => opt.name}
                value={filterOptions.callcenters.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardCallcenter} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditCallcenter}
              />
            )}
          />
        </Grid>

        {/* RAPPORT FICHE (readonly) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label={t.wizardReportFiche}
            value={reportFiche}
            fullWidth
            disabled
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        {/* RAPPORT CALL CENTER (status_lead) */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='status_lead_id'
            control={detailsForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.status_leads}
                getOptionLabel={opt => opt.name}
                value={filterOptions.status_leads.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardReportCallCenter} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditStatusLeadId}
              />
            )}
          />
        </Grid>

        {/* DATE D'INSTALLATION ITE ISO */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='opc_at'
            control={detailsForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.wizardInstallDate}
                type='datetime-local'
                fullWidth
                disabled={!canEditOpcAt}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        {/* PLAGE INSTALL. */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='opc_range_id'
            control={detailsForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.date_ranges}
                getOptionLabel={opt => opt.name}
                value={filterOptions.date_ranges.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardInstallRange} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditOpcRange}
              />
            )}
          />
        </Grid>

        {/* PLAGE RDV */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='in_at_range_id'
            control={detailsForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.date_ranges}
                getOptionLabel={opt => opt.name}
                value={filterOptions.date_ranges.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardInAtRange} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditInAtRange}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
