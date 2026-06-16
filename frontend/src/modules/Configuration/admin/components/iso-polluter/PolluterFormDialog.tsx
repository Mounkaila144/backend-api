'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import type { FormData, PolluterItem } from './types'
import { isYes } from './types'

type ConfigTranslations = ReturnType<typeof useConfigTranslations>

interface PolluterFormDialogProps {
  open: boolean
  editing: PolluterItem | null
  formData: FormData
  saving: boolean
  onSet: (key: keyof FormData, value: string) => void
  onSave: () => void
  onClose: () => void
  t: ConfigTranslations
}

export default function PolluterFormDialog({
  open,
  editing,
  formData,
  saving,
  onSet,
  onSave,
  onClose,
  t,
}: PolluterFormDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle>{editing ? t.isoPolluterEdit : t.isoPolluterCreate}</DialogTitle>
      <DialogContent>
        {/* Général */}
        <Typography variant='subtitle2' sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
          {t.isoPolluterSectionGeneral}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label={t.isoPolluterName} value={formData.name} onChange={e => onSet('name', e.target.value)} required />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label={t.isoPolluterCommercial} value={formData.commercial} onChange={e => onSet('commercial', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label={t.isoPolluterType} value={formData.type} onChange={e => onSet('type', e.target.value)} inputProps={{ maxLength: 32 }} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControlLabel
              control={<Switch checked={isYes(formData.is_active)} onChange={e => onSet('is_active', e.target.checked ? 'YES' : 'NO')} />}
              label={t.isoPolluterIsActive}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <FormControlLabel
              control={<Switch checked={isYes(formData.is_default)} onChange={e => onSet('is_default', e.target.checked ? 'YES' : 'NO')} />}
              label={t.isoPolluterIsDefault}
            />
          </Grid>
        </Grid>

        {/* Contact */}
        <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>{t.isoPolluterSectionContact}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t.isoPolluterEmail} value={formData.email} onChange={e => onSet('email', e.target.value)} type='email' /></Grid>
          <Grid item xs={12} sm={6}><TextField fullWidth label={t.isoPolluterWeb} value={formData.web} onChange={e => onSet('web', e.target.value)} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterPhone} value={formData.phone} onChange={e => onSet('phone', e.target.value)} inputProps={{ maxLength: 20 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterMobile} value={formData.mobile} onChange={e => onSet('mobile', e.target.value)} inputProps={{ maxLength: 20 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterFax} value={formData.fax} onChange={e => onSet('fax', e.target.value)} inputProps={{ maxLength: 20 }} /></Grid>
        </Grid>

        {/* Adresse */}
        <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>{t.isoPolluterSectionAddress}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label={t.isoPolluterAddress1} value={formData.address1} onChange={e => onSet('address1', e.target.value)} inputProps={{ maxLength: 128 }} /></Grid>
          <Grid item xs={12}><TextField fullWidth label={t.isoPolluterAddress2} value={formData.address2} onChange={e => onSet('address2', e.target.value)} inputProps={{ maxLength: 128 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterPostcode} value={formData.postcode} onChange={e => onSet('postcode', e.target.value)} inputProps={{ maxLength: 10 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterCity} value={formData.city} onChange={e => onSet('city', e.target.value)} inputProps={{ maxLength: 64 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterCountry} value={formData.country} onChange={e => onSet('country', e.target.value)} inputProps={{ maxLength: 2 }} helperText='ISO 3166-1 alpha-2' /></Grid>
        </Grid>

        {/* Business */}
        <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>{t.isoPolluterSectionBusiness}</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterApe} value={formData.ape} onChange={e => onSet('ape', e.target.value)} inputProps={{ maxLength: 10 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterSiret} value={formData.siret} onChange={e => onSet('siret', e.target.value)} inputProps={{ maxLength: 20 }} /></Grid>
          <Grid item xs={12} sm={4}><TextField fullWidth label={t.isoPolluterTva} value={formData.tva} onChange={e => onSet('tva', e.target.value)} inputProps={{ maxLength: 30 }} /></Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>{t.cancel}</Button>
        <Button variant='contained' onClick={onSave} disabled={saving || !formData.name.trim()}>
          {saving ? t.saving : t.save}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
