'use client'

import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'

import { useEditPermissions } from '../../useEditPermissions'
import type { CustomerEditFormData } from '../../editFormSchema'
import type { CustomerMeeting } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface EditSubTabCustomerDetailsProps {
  customerForm: UseFormReturn<CustomerEditFormData>
  meeting: CustomerMeeting | null
  t: MeetingTranslations
}

export default function EditSubTabCustomerDetails({ customerForm, meeting, t }: EditSubTabCustomerDetailsProps) {
  const { control } = customerForm
  const { canEditSuper } = useEditPermissions()

  const showCompany = canEditSuper('meeting_modify_company')
  const isHold = meeting?.is_hold === 'YES'

  if (isHold) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color='text.secondary'>
          {t.editCustomerHoldMessage}
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='subtitle1' sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-user-line' />
        {t.sectionCustomerDetails}
      </Typography>
      <Grid container spacing={3}>
        {/* TITRE */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.gender'
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} select label={t.wizardGender} fullWidth>
                <MenuItem value=''>&nbsp;</MenuItem>
                <MenuItem value='Mr'>{t.wizardGenderMr}</MenuItem>
                <MenuItem value='Ms'>{t.wizardGenderMs}</MenuItem>
                <MenuItem value='Mrs'>{t.wizardGenderMrs}</MenuItem>
              </TextField>
            )}
          />
        </Grid>
        {/* NOM */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.lastname'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.lastName} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        {/* PRENOM */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name='customer.firstname'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.firstName} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        {/* TELEPHONE */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.phone'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.phone} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        {/* PORTABLE 1 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.mobile'
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t.wizardMobile} fullWidth />
            )}
          />
        </Grid>
        {/* PORTABLE 2 */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.mobile2'
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t.wizardMobile2} fullWidth />
            )}
          />
        </Grid>
        {/* EMAIL */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.email'
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t.wizardEmail} type='email' fullWidth />
            )}
          />
        </Grid>

        {showCompany ? (
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name='customer.company'
              control={control}
              render={({ field }) => (
                <TextField {...field} value={field.value ?? ''} label={t.wizardCompany} fullWidth />
              )}
            />
          </Grid>
        ) : null}

        <Grid size={12}>
          <Divider sx={{ my: 1 }} />
        </Grid>

        {/* ADRESSE */}
        <Grid size={12}>
          <Controller
            name='customer.address.address1'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.address} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid size={12}>
          <Controller
            name='customer.address.address2'
            control={control}
            render={({ field }) => (
              <TextField {...field} value={field.value ?? ''} label={t.wizardAddress2} fullWidth />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.address.postcode'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.postcode} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name='customer.address.city'
            control={control}
            render={({ field, fieldState }) => (
              <TextField {...field} value={field.value ?? ''} label={t.city} fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
