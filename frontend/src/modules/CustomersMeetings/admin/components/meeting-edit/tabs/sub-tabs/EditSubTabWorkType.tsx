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
import type { MeetingDetailsEditFormData, DomoprimeEditFormData , TeamEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'


interface EditSubTabWorkTypeProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  domoprimeForm: UseFormReturn<DomoprimeEditFormData>
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

const MORE_2_YEARS_OPTIONS: FilterOption[] = [
  { id: 'YES', name: 'Oui' },
  { id: 'NO', name: 'Non' },
]

export default function EditSubTabWorkType({ detailsForm, teamForm, domoprimeForm, filterOptions, t }: EditSubTabWorkTypeProps) {
  const { canEdit, canEditSuper } = useEditPermissions()

  const canEditPolluter = canEdit('meeting_modify_polluter')
  const canEditTypeId = canEditSuper('meeting_modify_type')
  const canEditDomoprime = canEdit('meeting_modify_domoprime')

  return (
    <Box>
      {/* TYPE DE TRAVAUX = polluter_id (comme Symfony) */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-tools-line' />
        {t.sectionWorkType}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
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
        {filterOptions.meeting_types.length > 0 ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='type_id'
              control={detailsForm.control}
              render={({ field }) => (
                <Autocomplete
                  options={filterOptions.meeting_types}
                  getOptionLabel={opt => opt.name}
                  value={filterOptions.meeting_types.find(o => Number(o.id) === Number(field.value)) ?? null}
                  onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                  renderInput={params => <TextField {...params} label={t.colMeetingType} />}
                  isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                  disabled={!canEditTypeId}
                />
              )}
            />
          </Grid>
        ) : null}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* FISCAL */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.editDomoprimeFiscal}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='number_of_people'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeNumberOfPeople}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='revenue'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeRevenue}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='number_of_parts'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeNumberOfParts}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='declarants'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t.editDomoprimeDeclarants}
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='number_of_fiscal'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeNumberOfFiscal}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* HABITAT */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-home-line' />
        {t.editDomoprimeHabitat}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='pricing_id'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.pricings ?? []}
                getOptionLabel={opt => opt.name}
                value={(filterOptions.pricings ?? []).find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimeCeePeriod} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_ite'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeSurfaceIte}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='previous_energy_id'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.previous_energies ?? []}
                getOptionLabel={opt => opt.name}
                value={(filterOptions.previous_energies ?? []).find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimePreviousEnergy} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='energy_id'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.energies ?? []}
                getOptionLabel={opt => opt.name}
                value={(filterOptions.energies ?? []).find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimeEnergy} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='occupation_id'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.occupations ?? []}
                getOptionLabel={opt => opt.name}
                value={(filterOptions.occupations ?? []).find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimeOccupationType} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='more_2_years'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={MORE_2_YEARS_OPTIONS}
                getOptionLabel={opt => opt.name}
                value={MORE_2_YEARS_OPTIONS.find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? (opt.id as 'YES' | 'NO') : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimeMore2Years} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='layer_type_id'
            control={domoprimeForm.control}
            render={({ field }) => (
              <Autocomplete
                options={filterOptions.layer_types ?? []}
                getOptionLabel={opt => opt.name}
                value={(filterOptions.layer_types ?? []).find(o => Number(o.id) === Number(field.value)) ?? null}
                onChange={(_, opt) => field.onChange(opt ? Number(opt.id) : undefined)}
                renderInput={params => <TextField {...params} label={t.editDomoprimeLayerType} />}
                isOptionEqualToValue={(opt, val) => Number(opt.id) === Number(val.id)}
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_home'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeSurfaceHome}
                type='number'
                fullWidth
                disabled={!canEditDomoprime}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='parcel_surface'
            control={domoprimeForm.control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                label={t.editDomoprimeParcelSurface}
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
