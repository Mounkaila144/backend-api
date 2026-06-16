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
import type { MeetingDetailsEditFormData, TeamEditFormData, DomoprimeEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabAdditionalProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  domoprimeForm: UseFormReturn<DomoprimeEditFormData>
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

export default function EditSubTabAdditional({ detailsForm, teamForm, domoprimeForm, filterOptions, t }: EditSubTabAdditionalProps) {
  const { canEdit, canEditSuper } = useEditPermissions()

  const showAssistant = canEdit('meeting_modify_assistant')
  const canEditCampaign = canEdit('meeting_modify_campaign')
  const canEditCompany = canEditSuper('meeting_modify_meeting_company')
  const canEditPolluter = canEdit('meeting_modify_polluter')
  const canEditPartnerLayer = canEditSuper('meeting_modify_partner_layer')
  const canEditTurnover = canEditSuper('meeting_modify_turnover')
  const canEditSaleComments = canEdit('meeting_modify_sale_comments')
  const canEditQualified = canEdit('meeting_modify_qualified')
  const canEditDomoprime = canEdit('meeting_modify_domoprime')
  const canEditStateId = canEdit('meeting_modify_state')

  return (
    <Box>
      {/* Entities */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-building-line' />
        {t.sectionEntities}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='campaign_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.campaigns}
                getOptionLabel={opt => opt.name}
                value={filterOptions.campaigns.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardCampaign} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditCampaign}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='company_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.companies}
                getOptionLabel={opt => opt.name}
                value={filterOptions.companies.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardCompanyMeeting} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditCompany}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='polluter_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.polluters}
                getOptionLabel={opt => opt.name}
                value={filterOptions.polluters.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardPolluter} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditPolluter}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='partner_layer_id'
            control={teamForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.partner_layers}
                getOptionLabel={opt => opt.name}
                value={filterOptions.partner_layers.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardPartnerLayer} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditPartnerLayer}
              />
            )}
          />
        </Grid>
        {showAssistant ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='assistant_id'
              control={teamForm.control}
              render={({ field }) => (
                <Autocomplete
                  options={filterOptions.users}
                  getOptionLabel={opt => opt.name}
                  value={filterOptions.users.find(o => Number(o.id) === Number(field.value)) ?? null}
                  onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                  renderInput={params => <TextField {...params} label={t.wizardAssistant} />}
                  isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                />
              )}
            />
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Finance & Statut */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.sectionFinance}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='turnover'
            control={teamForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.wizardTurnover}
                type='number'
                fullWidth
                disabled={!canEditTurnover}
                slotProps={{ input: { endAdornment: <InputAdornment position='end'>EUR</InputAdornment> } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='out_at'
            control={detailsForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.wizardDateEnd}
                type='datetime-local'
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='state_id'
            control={detailsForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.meeting_statuses}
                getOptionLabel={opt => opt.name}
                value={filterOptions.meeting_statuses.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.wizardMeetingStatus} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditStateId}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='status'
            control={teamForm.control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? 'ACTIVE'} select label={t.colStatus} fullWidth>
                <MenuItem value='ACTIVE'>{t.statusActive}</MenuItem>
                <MenuItem value='DELETE'>{t.statusDeleted}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Commentaires & Flags */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-chat-3-line' />
        {t.sectionComments}
      </Typography>
      <Grid container spacing={3}>
        {canEditSaleComments ? (
          <Grid size={12}>
            <Controller
              name='sale_comments'
              control={teamForm.control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t.wizardSaleComments} fullWidth multiline rows={3} />
              )}
            />
          </Grid>
        ) : null}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='see_with_mr'
            control={teamForm.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value === 'YES'} onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')} />}
                label={t.wizardSeeWithMr}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='see_with_mrs'
            control={teamForm.control}
            render={({ field }) => (
              <FormControlLabel
                control={<Checkbox checked={field.value === 'YES'} onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')} />}
                label={t.wizardSeeWithMrs}
              />
            )}
          />
        </Grid>
        {canEditQualified ? (
          <Grid size={{ xs: 12, sm: 4 }}>
            <Controller
              name='is_qualified'
              control={teamForm.control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value === 'YES'} onChange={e => field.onChange(e.target.checked ? 'YES' : 'NO')} />}
                  label={t.wizardIsQualified}
                />
              )}
            />
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Surfaces supplémentaires */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-ruler-line' />
        {t.editDomoprimeSurfaces}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_wall'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeSurfaceWall}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_top'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeSurfaceTop}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_floor'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeSurfaceFloor}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
