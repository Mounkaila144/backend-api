'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useWizardPermissions } from '../../../contract-wizard/useWizardPermissions'
import type { CustomerEditFormData } from '../../editFormSchema'
import type { CustomerContract } from '../../../../../types'
import type { ContractTranslations } from '../../../../hooks/useContractTranslations'

interface EditSubTabCustomerProps {
  form: UseFormReturn<CustomerEditFormData>
  contract: CustomerContract | null
  t: ContractTranslations
}

export default function EditSubTabCustomer({ form, contract, t }: EditSubTabCustomerProps) {
  const { control } = form
  const { canShow } = useWizardPermissions()

  const showCompany = canShow('contract_new_company')
  const firstAddress = (contract?.customer as unknown as { addresses?: Array<Record<string, string>> } | undefined)?.addresses?.[0]
  const fallbackAddress1 = contract?.customer?.address?.address1 ?? firstAddress?.address1 ?? ''
  const fallbackAddress2 = contract?.customer?.address?.address2 ?? firstAddress?.address2 ?? ''
  const fallbackPostcode = contract?.customer?.address?.postcode ?? firstAddress?.postcode ?? ''
  const fallbackCity = contract?.customer?.address?.city ?? firstAddress?.city ?? ''

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Gender */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.gender'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                select
                label={t.wizardGender}
                fullWidth
              >
                <MenuItem value=''>&nbsp;</MenuItem>
                <MenuItem value='Mr'>{t.wizardGenderMr}</MenuItem>
                <MenuItem value='Ms'>{t.wizardGenderMs}</MenuItem>
                <MenuItem value='Mrs'>{t.wizardGenderMrs}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.lastname'
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t.lastName}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.firstname'
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t.firstName}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.phone'
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label={t.phone}
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.email'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardEmail}
                type='email'
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.mobile'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardMobile}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.mobile2'
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label={t.wizardMobile2}
                fullWidth
              />
            )}
          />
        </Grid>

        {/* Company - permission gated */}
        {showCompany ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='customer.company'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t.wizardCustomerCompany}
                  fullWidth
                />
              )}
            />
          </Grid>
        ) : null}

        {/* Address section */}
        <Grid size={12}>
          <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <i className='ri-home-line' />
            {t.addressSection}
          </Typography>
        </Grid>
        <Grid size={12}>
          <Controller
            name='customer.address.address1'
            control={control}
            render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? fallbackAddress1}
                  label={t.address}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name='customer.address.address2'
            control={control}
            render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? fallbackAddress2}
                  label={t.wizardAddress2}
                  fullWidth
                />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.address.postcode'
            control={control}
            render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? fallbackPostcode}
                  label={t.postcode}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.address.city'
            control={control}
            render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? fallbackCity}
                  label={t.city}
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
