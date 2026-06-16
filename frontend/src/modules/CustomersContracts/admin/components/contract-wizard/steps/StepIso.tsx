'use client'

import { Controller, useFieldArray } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Autocomplete from '@mui/material/Autocomplete'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'

import { useWizardPermissions } from '../useWizardPermissions'
import type { IsoFormData, VerifFormData } from '../contractFormSchema'
import type { DomoprimeFilterOptions, FilterOption } from '@/modules/AppDomoprime/types'
import type { ContractFilterOptions } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface StepIsoProps {
  form: UseFormReturn<IsoFormData>
  verifForm: UseFormReturn<VerifFormData>
  domoprimeOptions: DomoprimeFilterOptions
  domoprimeOptionsLoading: boolean
  filterOptions: ContractFilterOptions
  t: ContractTranslations
}

function IsoAutocompleteField({
  name,
  control,
  label,
  options,
}: {
  name: keyof IsoFormData
  control: UseFormReturn<IsoFormData>['control']
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

function NumberField({
  name,
  control,
  label,
  unit,
}: {
  name: keyof IsoFormData
  control: UseFormReturn<IsoFormData>['control']
  label: string
  unit?: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
          label={label}
          type='number'
          fullWidth
          slotProps={
            unit
              ? { input: { endAdornment: <InputAdornment position='end'>{unit}</InputAdornment> } }
              : undefined
          }
        />
      )}
    />
  )
}

export default function StepIso({ form, verifForm, domoprimeOptions, domoprimeOptionsLoading, filterOptions, t }: StepIsoProps) {
  const { control } = form
  const { canShow, shouldRemove } = useWizardPermissions()

  const { fields, append, remove } = useFieldArray({
    control: verifForm.control,
    name: 'verif',
  })

  // Permission flags
  const showFiscalSupplement = canShow('contract_new_fiscal_supplement')
  const hideRemovableFields = shouldRemove('contract_new_request_remove_fields')

  // canShow-gated fields
  const showNumberOfParts = canShow('contract_new_request_number_of_parts')
  const showParcelReference = canShow('contract_new_request_parcel_reference')
  const showParcelSurface = canShow('contract_new_request_parcel_surface')
  const showPricing = canShow('app_domoprime_iso2_contract_new_pricing')
  const showSurfaceIte = canShow('contract_new_request_surface_ite')
  const showBoilerQuantity = canShow('contract_new_request_boiler_quantity')
  const showPackQuantity = canShow('contract_new_request_pack_quantity')
  const showInstallSurfaceTop = canShow('contract_new_request_install_surface_top')
  const showInstallSurfaceWall = canShow('contract_new_request_install_surface_wall')
  const showInstallSurfaceFloor = canShow('contract_new_request_install_surface_floor')

  // Section visibility: show section only if at least one field is visible
  const showHabitatSection = !hideRemovableFields
    || showSurfaceIte || showBoilerQuantity || showPackQuantity
    || showParcelReference || showPricing || showParcelSurface

  const showInstallerSection = showInstallSurfaceTop || showInstallSurfaceWall || showInstallSurfaceFloor

  // Use contract filter options energies as fallback
  const energies = domoprimeOptions.energies.length > 0
    ? domoprimeOptions.energies
    : (filterOptions.energies as FilterOption[])

  if (domoprimeOptionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* ================================================================
          Section 1: Informations fiscales (from services_impot_verif_newForContract.tpl)
          Always visible — no credential gate
          ================================================================ */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-file-text-line' />
        {t.isoFiscalInfoSection}
      </Typography>
      {fields.map((field, index) => (
        <Grid container spacing={2} key={field.id} sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller
              name={`verif.${index}.number`}
              control={verifForm.control}
              render={({ field: f }) => (
                <TextField {...f} label={`${t.isoFiscalNumber} ${index + 1}`} fullWidth />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <Controller
              name={`verif.${index}.reference`}
              control={verifForm.control}
              render={({ field: f }) => (
                <TextField {...f} label={`${t.isoFiscalReference} ${index + 1}`} fullWidth />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size='small' onClick={() => append({ reference: '', number: '' })} title={t.isoAddEntry}>
              <i className='ri-add-line' />
            </IconButton>
            {index > 0 && (
              <IconButton size='small' color='error' onClick={() => remove(index)} title={t.isoRemoveEntry}>
                <i className='ri-delete-bin-line' />
              </IconButton>
            )}
          </Grid>
        </Grid>
      ))}

      <Divider sx={{ my: 4 }} />

      {/* ================================================================
          Section 2: Fiscal (from app_domoprime_iso template)
          declarants: always visible
          number_of_people, revenue, number_of_fiscal: hidden if shouldRemove
          number_of_parts: canShow gate
          ================================================================ */}
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-money-euro-box-line' />
        {t.isoFiscalSection}
      </Typography>
      <Grid container spacing={3}>
        {!hideRemovableFields && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumberField name='ana_prime' control={control} label={t.isoAnaPrime} unit='EUR' />
          </Grid>
        )}
        {!hideRemovableFields && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumberField name='number_of_people' control={control} label={t.isoNumberOfPeople} />
          </Grid>
        )}
        {!hideRemovableFields && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumberField name='revenue' control={control} label={t.isoRevenue} unit='EUR' />
          </Grid>
        )}
        {!hideRemovableFields && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumberField name='number_of_fiscal' control={control} label={t.isoNumberOfFiscal} />
          </Grid>
        )}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='declarants'
            control={control}
            render={({ field }) => (
              <TextField {...field} label={t.isoDeclarants} fullWidth />
            )}
          />
        </Grid>
        {showNumberOfParts && (
          <Grid size={{ xs: 12, sm: 6 }}>
            <NumberField name='number_of_parts' control={control} label={t.isoNumberOfParts} />
          </Grid>
        )}
      </Grid>

      {/* ================================================================
          Section 2b: Fiscal supplement (permission-gated)
          Symfony: hasCredential([['superadminxx','adminxx','contract_new_fiscal_supplement']])
          Fields: number_of_children, tax_credit_used
          ================================================================ */}
      {showFiscalSupplement ? (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-add-box-line' />
            {t.isoFiscalSupplement}
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <NumberField name='number_of_children' control={control} label={t.isoNumberOfChildren} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <NumberField name='tax_credit_used' control={control} label={t.isoTaxCreditUsed} unit='EUR' />
            </Grid>
          </Grid>
        </>
      ) : null}

      {/* ================================================================
          Section 3: Habitat
          surface_top/wall/floor, energy_id, occupation_id, more_2_years: hidden if shouldRemove
          surface_ite, boiler_quantity, pack_quantity, parcel_reference,
          pricing_id, parcel_surface, layer_type_id: canShow gates
          ================================================================ */}
      {showHabitatSection ? (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-home-4-line' />
            {t.isoHabitatSection}
          </Typography>
          <Grid container spacing={3}>
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='surface_home' control={control} label={t.isoSurfaceHome} unit='m²' />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='surface_top' control={control} label={t.isoSurfaceTop} unit='m²' />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='surface_wall' control={control} label={t.isoSurfaceWall} unit='m²' />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='surface_floor' control={control} label={t.isoSurfaceFloor} unit='m²' />
              </Grid>
            )}
            {showSurfaceIte && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='surface_ite' control={control} label={t.isoSurfaceIte} unit='m²' />
              </Grid>
            )}
            {showBoilerQuantity && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='boiler_quantity' control={control} label={t.isoBoilerQuantity} />
              </Grid>
            )}
            {showPackQuantity && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='pack_quantity' control={control} label={t.isoPackQuantity} />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <IsoAutocompleteField
                  name='previous_energy_id'
                  control={control}
                  label={t.isoPreviousEnergy}
                  options={domoprimeOptions.previous_energies}
                />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <IsoAutocompleteField
                  name='energy_id'
                  control={control}
                  label={t.isoEnergy}
                  options={energies}
                />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <IsoAutocompleteField
                  name='occupation_id'
                  control={control}
                  label={t.isoOccupationType}
                  options={domoprimeOptions.occupations}
                />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='more_2_years'
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      select
                      label={t.isoMore2Years}
                      fullWidth
                    >
                      <MenuItem value=''>-</MenuItem>
                      <MenuItem value='YES'>{t.yes}</MenuItem>
                      <MenuItem value='NO'>{t.no}</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
            )}
            {showParcelReference && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name='parcel_reference'
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label={t.isoParcelReference} fullWidth />
                  )}
                />
              </Grid>
            )}
            {showPricing && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <IsoAutocompleteField
                  name='pricing_id'
                  control={control}
                  label={t.isoPricing}
                  options={domoprimeOptions.pricings}
                />
              </Grid>
            )}
            {showParcelSurface && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <NumberField name='parcel_surface' control={control} label={t.isoParcelSurface} unit='m²' />
              </Grid>
            )}
            {!hideRemovableFields && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <IsoAutocompleteField
                  name='layer_type_id'
                  control={control}
                  label={t.isoLayerType}
                  options={domoprimeOptions.layer_types}
                />
              </Grid>
            )}
          </Grid>
        </>
      ) : null}

      {/* ================================================================
          Section 4: Surfaces Installateur (each field has own canShow gate)
          ================================================================ */}
      {showInstallerSection ? (
        <>
          <Divider sx={{ my: 4 }} />
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-tools-line' />
            {t.isoSurfacesInstallerSection}
          </Typography>
          <Grid container spacing={3}>
            {showInstallSurfaceTop && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <NumberField name='install_surface_top' control={control} label={t.isoInstallSurfaceTop} unit='m²' />
              </Grid>
            )}
            {showInstallSurfaceWall && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <NumberField name='install_surface_wall' control={control} label={t.isoInstallSurfaceWall} unit='m²' />
              </Grid>
            )}
            {showInstallSurfaceFloor && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <NumberField name='install_surface_floor' control={control} label={t.isoInstallSurfaceFloor} unit='m²' />
              </Grid>
            )}
          </Grid>
        </>
      ) : null}
    </Box>
  )
}
