'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface ClassOption {
  id: number
  name: string
}

interface PricingItem {
  id: number
  polluter_id: number
  class_id: number | null
  class_name: string | null
  coef: string
  multiple: string | null
  multiple_floor: string | null
  multiple_top: string | null
  multiple_wall: string | null
  prime: string | null
  pack_prime: string | null
  pack_coef: string | null
  boiler_coef: string | null
  ana_prime: string | null
  ana_limit: string | null
  ite_prime: string | null
  ite_coef: string | null
  max_limit: string | null
  bbc_prime: string | null
  strainer_prime: string | null
  bbc_article_prime: string | null
  strainer_article_prime: string | null
}

type FormData = {
  class_id: number | ''
  coef: string
  multiple: string
  multiple_floor: string
  multiple_top: string
  multiple_wall: string
  prime: string
  pack_prime: string
  pack_coef: string
  boiler_coef: string
  ana_prime: string
  ana_limit: string
  ite_prime: string
  ite_coef: string
  max_limit: string
  bbc_prime: string
  strainer_prime: string
}

const emptyForm: FormData = {
  class_id: '',
  coef: '0',
  multiple: '',
  multiple_floor: '',
  multiple_top: '',
  multiple_wall: '',
  prime: '0',
  pack_prime: '',
  pack_coef: '',
  boiler_coef: '',
  ana_prime: '',
  ana_limit: '',
  ite_prime: '',
  ite_coef: '',
  max_limit: '',
  bbc_prime: '',
  strainer_prime: '',
}

const fmt = (v: string | null) => (v === null || v === '' ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 6 }))

interface Props {
  polluterId: number
  polluterName: string
  polluterType: string | null
  onBack: () => void
}

export default function PolluterPricingCrud({ polluterId, polluterName, polluterType, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/pricing`

  const [items, setItems] = useState<PricingItem[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PricingItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const isITEType = ['ITE', 'TYPE1', 'TYPE2'].includes((polluterType ?? '').toUpperCase())

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: { items: PricingItem[]; classes: ClassOption[] } }>(baseUrl, {
        params: { lang: 'fr' },
      })
      if (res.data.success) {
        setItems(res.data.data.items)
        setClasses(res.data.data.classes)
      }
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.settingsLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: keyof FormData, value: string | number) =>
    setFormData(prev => ({ ...prev, [key]: value as never }))

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: PricingItem) => {
    setEditing(item)
    setFormData({
      class_id: item.class_id ?? '',
      coef: item.coef ?? '0',
      multiple: item.multiple ?? '',
      multiple_floor: item.multiple_floor ?? '',
      multiple_top: item.multiple_top ?? '',
      multiple_wall: item.multiple_wall ?? '',
      prime: item.prime ?? '',
      pack_prime: item.pack_prime ?? '',
      pack_coef: item.pack_coef ?? '',
      boiler_coef: item.boiler_coef ?? '',
      ana_prime: item.ana_prime ?? '',
      ana_limit: item.ana_limit ?? '',
      ite_prime: item.ite_prime ?? '',
      ite_coef: item.ite_coef ?? '',
      max_limit: item.max_limit ?? '',
      bbc_prime: item.bbc_prime ?? '',
      strainer_prime: item.strainer_prime ?? '',
    })
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormData(emptyForm)
  }

  const buildPayload = (): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formData)) {
      if (v === '' || v === null || v === undefined) continue
      out[k] = k === 'class_id' ? Number(v) : v
    }
    return out
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = buildPayload()
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: PricingItem }>(`${baseUrl}/${editing.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: PricingItem }>(baseUrl, payload)
        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.settingsSaved)
          handleClose()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${baseUrl}/${deletingItem.id}`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== deletingItem.id))
        setSuccessMsg(t.settingsSaved)
        setDeleteOpen(false)
        setDeletingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleting(false)
    }
  }

  // Classes that aren't already used (when creating). When editing, allow current.
  const availableClasses = editing
    ? classes
    : classes.filter(c => !items.some(i => i.class_id === c.id))

  const isFormValid =
    (editing !== null || formData.class_id !== '') &&
    formData.coef !== '' &&
    !isNaN(Number(formData.coef))

  return (
    <Box>
      {error ? <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant='outlined' size='small' onClick={onBack}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.isoPolluterSubBack}
        </Button>
        <Typography variant='h5' sx={{ ml: 1 }}>
          {t.polluterPricingTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.polluterPricingNew}
        </Button>
      </Box>

      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card variant='outlined'>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            <TableContainer component={Paper} elevation={0}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterPricingClass}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingCoef}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingBoilerPrime}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingPackPrime}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingAnaPrime}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingItePrime}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {t.polluterPricingEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.class_name ?? '—'}</TableCell>
                        <TableCell align='right'>{fmt(item.coef)}</TableCell>
                        <TableCell align='right'>{fmt(item.boiler_coef)}</TableCell>
                        <TableCell align='right'>{fmt(item.pack_prime)}</TableCell>
                        <TableCell align='right'>{fmt(item.ana_prime)}</TableCell>
                        <TableCell align='right'>{fmt(item.ite_prime)}</TableCell>
                        <TableCell align='right'>
                          <Tooltip title={t.statusCrudEdit}>
                            <IconButton size='small' color='primary' onClick={() => handleOpenEdit(item)}>
                              <i className='ri-edit-line' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t.statusCrudDelete}>
                            <IconButton size='small' color='error' onClick={() => { setDeletingItem(item); setDeleteOpen(true) }}>
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth='lg' fullWidth>
        <DialogTitle>{editing ? t.polluterPricingEdit : t.polluterPricingCreate}</DialogTitle>
        <DialogContent>
          {/* Général */}
          <Typography variant='subtitle2' sx={{ mt: 2, mb: 1, color: 'text.secondary' }}>
            {t.polluterPricingSectionGeneral}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required
                label={t.polluterPricingClass}
                value={formData.class_id}
                onChange={e => set('class_id', Number(e.target.value))}
                disabled={!!editing}
              >
                {availableClasses.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth required type='number' label={t.polluterPricingCoef} value={formData.coef} onChange={e => set('coef', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type='number' label={t.polluterPricingPrime} value={formData.prime} onChange={e => set('prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
          </Grid>

          {/* Multiples */}
          <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
            {t.polluterPricingSectionMultiples}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type='number' label={t.polluterPricingMultipleFloor} value={formData.multiple_floor} onChange={e => set('multiple_floor', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type='number' label={t.polluterPricingMultipleTop} value={formData.multiple_top} onChange={e => set('multiple_top', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type='number' label={t.polluterPricingMultipleWall} value={formData.multiple_wall} onChange={e => set('multiple_wall', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
          </Grid>

          {/* Boiler / Pack */}
          <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
            {t.polluterPricingSectionBoilerPack}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type='number' label={t.polluterPricingBoilerCoef} value={formData.boiler_coef} onChange={e => set('boiler_coef', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type='number' label={t.polluterPricingPackCoef} value={formData.pack_coef} onChange={e => set('pack_coef', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type='number' label={t.polluterPricingPackPrime} value={formData.pack_prime} onChange={e => set('pack_prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type='number' label={t.polluterPricingBbcPrime} value={formData.bbc_prime} onChange={e => set('bbc_prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
          </Grid>

          {/* ITE — only if polluter type matches */}
          {isITEType ? (
            <>
              <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
                {t.polluterPricingSectionITE}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type='number' label={t.polluterPricingItePrime} value={formData.ite_prime} onChange={e => set('ite_prime', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type='number' label={t.polluterPricingIteCoef} value={formData.ite_coef} onChange={e => set('ite_coef', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type='number' label={t.polluterPricingAnaPrime} value={formData.ana_prime} onChange={e => set('ana_prime', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField fullWidth type='number' label={t.polluterPricingAnaLimit} value={formData.ana_limit} onChange={e => set('ana_limit', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
              </Grid>
            </>
          ) : null}

          {/* Avancé */}
          <Typography variant='subtitle2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
            {t.polluterPricingSectionAdvanced}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type='number' label={t.polluterPricingMaxLimit} value={formData.max_limit} onChange={e => set('max_limit', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type='number' label={t.polluterPricingStrainerPrime} value={formData.strainer_prime} onChange={e => set('strainer_prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.polluterPricingDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.polluterPricingDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.class_name}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.statusCrudDelete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
