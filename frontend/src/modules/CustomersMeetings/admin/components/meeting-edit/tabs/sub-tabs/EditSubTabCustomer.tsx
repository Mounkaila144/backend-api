'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

import { useEditPermissions } from '../../useEditPermissions'
import type { CustomerEditFormData } from '../../editFormSchema'
import type { CustomerMeeting } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabCustomerProps {
  form: UseFormReturn<CustomerEditFormData>
  meeting: CustomerMeeting | null
  t: MeetingTranslations
}

export default function EditSubTabCustomer({ form, meeting, t }: EditSubTabCustomerProps) {
  const { control } = form
  const { canEditSuper } = useEditPermissions()

  const showCompany = canEditSuper('meeting_modify_company')

  // Customer is only editable when the meeting is NOT on hold
  const isHold = meeting?.is_hold === 'YES'

  if (isHold) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color='text.secondary'>
          {t.editCustomerHoldMessage ?? 'Customer info is read-only while the meeting is on hold.'}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Grid container spacing={3}>
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
                label={t.wizardMobile2}
                fullWidth
              />
            )}
          />
        </Grid>

        {showCompany ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='customer.company'
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t.wizardCompany}
                  fullWidth
                />
              )}
            />
          </Grid>
        ) : null}

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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
                value={field.value ?? ''}
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
