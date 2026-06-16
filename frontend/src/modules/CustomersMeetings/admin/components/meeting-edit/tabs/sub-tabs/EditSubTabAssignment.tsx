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
import type { MeetingDetailsEditFormData, TeamEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabAssignmentProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

export default function EditSubTabAssignment({ detailsForm, teamForm, filterOptions, t }: EditSubTabAssignmentProps) {
  const { canEdit, canEditSuper, shouldHide } = useEditPermissions()

  // Team permissions
  const showTelepro = !shouldHide('meeting_view_no_telepro') && !shouldHide('meeting_view_telepro_as_user')
  const canEditTelepro = canEdit('meeting_modify_telepro') || canEditSuper('meeting_view_telepro_select')
  const showSales = !shouldHide('meeting_view_no_sale1')
  const canEditSales = canEdit('meeting_modify_sales') || canEditSuper('meeting_view_sale1_select')
  const showSale2 = !shouldHide('meeting_view_no_sale2')
  const canEditSale2 = canEdit('meeting_modify_sale2') || canEditSuper('meeting_view_sale2_select')

  // Date permissions
  const canEditInAt = canEdit('meeting_modify_in_at')
  const showInAt = !shouldHide('meeting_view_remove_in_at')
  const canEditCallbackAt = canEdit('meeting_modify_callback')

  // Comments
  const showRemarks = !shouldHide('meeting_view_no_remarks')

  return (
    <Box>
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-team-line' />
        {t.sectionAssignment}
      </Typography>
      <Grid container spacing={3}>
        {/* SOURCE (telepro) */}
        {showTelepro ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='telepro_id'
              control={teamForm.control}
              render={({ field }) => (
                <Autocomplete
                  options={filterOptions.users}
                  getOptionLabel={opt => opt.name}
                  value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                  onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                  renderInput={params => <TextField {...params} label={t.wizardTelepro} />}
                  isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                  disabled={!canEditTelepro}
                />
              )}
            />
          </Grid>
        ) : null}

        {/* CONFIRMATEUR */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='confirmator_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.users}
                getOptionLabel={opt => opt.name}
                value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardConfirmator} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
              />
            )}
          />
        </Grid>

        {/* ACCES 1 (Commercial 1) */}
        {showSales ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='sales_id'
              control={teamForm.control}
              render={({ field }) => (
                <Autocomplete
                  options={filterOptions.users}
                  getOptionLabel={opt => opt.name}
                  value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                  onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                  renderInput={params => <TextField {...params} label={t.wizardSales} />}
                  isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                  disabled={!canEditSales}
                />
              )}
            />
          </Grid>
        ) : null}

        {/* ACCES 2 (Commercial 2) */}
        {showSale2 ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='sale2_id'
              control={teamForm.control}
              render={({ field }) => (
                <Autocomplete
                  options={filterOptions.users}
                  getOptionLabel={opt => opt.name}
                  value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                  onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                  renderInput={params => <TextField {...params} label={t.wizardSale2} />}
                  isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                  disabled={!canEditSale2}
                />
              )}
            />
          </Grid>
        ) : null}

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* DATE DE RDV */}
        {showInAt ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='in_at'
              control={detailsForm.control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t.wizardDateMeeting}
                  type='datetime-local'
                  fullWidth
                  disabled={!canEditInAt}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              )}
            />
          </Grid>
        ) : null}

        {/* DATE DE RAPPEL */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='callback_at'
            control={detailsForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.wizardDateCallback}
                type='datetime-local'
                fullWidth
                disabled={!canEditCallbackAt}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* REMARQUES */}
        {showRemarks ? (
          <Grid size={12}>
            <Controller
              name='remarks'
              control={teamForm.control}
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
      </Grid>
    </Box>
  )
}
