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

interface RegionOption {
  id: number
  name: string
}

interface PriceItem {
  id: number
  class_id: number
  region_id: number
  region_name: string | null
  number_of_people: number
  price: string
}

type FormData = {
  region_id: number | ''
  number_of_people: string
  price: string
}

const emptyForm: FormData = { region_id: '', number_of_people: '0', price: '0' }

interface Props {
  classId: number
  className: string
  onBack: () => void
}

export default function ClassRegionPriceCrud({ classId, className, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/classes/${classId}/region-prices`

  const [items, setItems] = useState<PriceItem[]>([])
  const [regions, setRegions] = useState<RegionOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PriceItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PriceItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: { items: PriceItem[]; regions: RegionOption[] } }>(baseUrl)
      if (res.data.success) {
        setItems(res.data.data.items)
        setRegions(res.data.data.regions)
      }
    } catch {
      setError(t.statusCrudLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.statusCrudLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: keyof FormData, value: string | number) =>
    setFormData(prev => ({ ...prev, [key]: value as never }))

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: PriceItem) => {
    setEditing(item)
    setFormData({
      region_id: item.region_id,
      number_of_people: String(item.number_of_people),
      price: item.price,
    })
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormData(emptyForm)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        region_id: formData.region_id,
        number_of_people: Number(formData.number_of_people),
        price: Number(formData.price),
      }
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: PriceItem }>(`${baseUrl}/${editing.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.statusCrudSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: PriceItem }>(baseUrl, payload)
        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.statusCrudSaved)
          handleClose()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudSaveError)
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
        setSuccessMsg(t.statusCrudDeleted)
        setDeleteOpen(false)
        setDeletingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudDeleteError)
    } finally {
      setDeleting(false)
    }
  }

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
          {t.classRegionPriceBack}
        </Button>
        <Typography variant='h5' sx={{ ml: 1 }}>
          {t.classRegionPriceTitle} — <span style={{ fontWeight: 400 }}>{className}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.classRegionPriceNew}
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
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.classRegionPriceRegion}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.classRegionPriceNumberOfPeople}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.classRegionPricePrice}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.classRegionPriceActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {t.classRegionPriceEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.region_name ?? '—'}</TableCell>
                        <TableCell align='right'>{item.number_of_people}</TableCell>
                        <TableCell align='right'>{Number(item.price).toLocaleString('fr-FR', { maximumFractionDigits: 6 })}</TableCell>
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

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>{editing ? t.classRegionPriceEdit : t.classRegionPriceCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select fullWidth required
                label={t.classRegionPriceRegion}
                value={formData.region_id}
                onChange={e => set('region_id', Number(e.target.value))}
              >
                {regions.map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth required type='number'
                label={t.classRegionPriceNumberOfPeople}
                value={formData.number_of_people}
                onChange={e => set('number_of_people', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth required type='number'
                label={t.classRegionPricePrice}
                value={formData.price}
                onChange={e => set('price', e.target.value)}
                inputProps={{ step: 'any', min: 0 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || formData.region_id === ''}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.classRegionPriceDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.classRegionPriceDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.region_name} — {deletingItem.number_of_people}p — {deletingItem.price}
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
