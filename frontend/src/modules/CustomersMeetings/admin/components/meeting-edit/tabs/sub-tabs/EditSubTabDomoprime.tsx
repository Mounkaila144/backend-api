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
import type { DomoprimeEditFormData } from '../../editFormSchema'
import type { MeetingFilterOptions, FilterOption } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabDomoprimeProps {
  form: UseFormReturn<DomoprimeEditFormData>
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
  name: keyof DomoprimeEditFormData
  control: UseFormReturn<DomoprimeEditFormData>['control']
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

const MORE_2_YEARS_OPTIONS: FilterOption[] = [
  { id: 'YES', name: 'Oui' },
  { id: 'NO', name: 'Non' },
]

export default function EditSubTabDomoprime({ form, filterOptions, t }: EditSubTabDomoprimeProps) {
  const { control } = form
  const { canEdit } = useEditPermissions()

  const canEditDomoprime = canEdit('meeting_modify_domoprime')

  return (
    <Box>
      {/* Fiscal section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-circle-line' />
        {t.editDomoprimeFiscal}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='revenue'
            control={control}
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
            name='number_of_people'
            control={control}
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
            name='number_of_parts'
            control={control}
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
            control={control}
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
            control={control}
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

      {/* Habitat section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-home-line' />
        {t.editDomoprimeHabitat}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='energy_id'
            control={control}
            label={t.editDomoprimeEnergy}
            options={filterOptions.energies ?? []}
            disabled={!canEditDomoprime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='previous_energy_id'
            control={control}
            label={t.editDomoprimePreviousEnergy}
            options={filterOptions.previous_energies ?? []}
            disabled={!canEditDomoprime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='occupation_id'
            control={control}
            label={t.editDomoprimeOccupationType}
            options={filterOptions.occupations ?? []}
            disabled={!canEditDomoprime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='layer_type_id'
            control={control}
            label={t.editDomoprimeLayerType}
            options={filterOptions.layer_types ?? []}
            disabled={!canEditDomoprime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AutocompleteField
            name='pricing_id'
            control={control}
            label={t.editDomoprimeCeePeriod}
            options={filterOptions.pricings ?? []}
            disabled={!canEditDomoprime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='more_2_years'
            control={control}
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
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Surfaces section */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-ruler-line' />
        {t.editDomoprimeSurfaces}
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='surface_home'
            control={control}
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
            name='surface_ite'
            control={control}
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
            name='surface_wall'
            control={control}
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
            control={control}
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
            control={control}
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='parcel_surface'
            control={control}
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
