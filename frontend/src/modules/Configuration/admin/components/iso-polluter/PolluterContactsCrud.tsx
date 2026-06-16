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

interface ContactItem {
  id: number
  company_id: number
  sex: string | null
  firstname: string | null
  lastname: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  fax: string | null
  function: string | null
  status: string
  created_at: string | null
}

interface FormData {
  sex: string
  firstname: string
  lastname: string
  email: string
  phone: string
  mobile: string
  fax: string
  function: string
}

const emptyForm: FormData = {
  sex: 'Mr',
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  mobile: '',
  fax: '',
  function: '',
}

interface Props {
  polluterId: number
  polluterName: string
  onBack: () => void
}

export default function PolluterContactsCrud({ polluterId, polluterName, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/contacts`

  const [items, setItems] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ContactItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ContactItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: ContactItem[] }>(baseUrl)
      if (res.data.success) setItems(res.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.settingsLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: keyof FormData, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  // ─── Open / close ──────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: ContactItem) => {
    setEditing(item)
    setFormData({
      sex: item.sex ?? 'Mr',
      firstname: item.firstname ?? '',
      lastname: item.lastname ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      mobile: item.mobile ?? '',
      fax: item.fax ?? '',
      function: item.function ?? '',
    })
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormData(emptyForm)
  }

  // ─── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: ContactItem }>(`${baseUrl}/${editing.id}`, formData)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: ContactItem }>(baseUrl, formData)
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

  // ─── Delete ─────────────────────────────────────────────────────────────

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

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box>
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      ) : null}

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
          {t.polluterContactTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.polluterContactNew}
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
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactSex}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactFirstname}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactLastname}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactEmail}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactPhone}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactMobile}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterContactFax}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterContactActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {t.polluterContactEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.sex || '—'}</TableCell>
                        <TableCell>{item.firstname || '—'}</TableCell>
                        <TableCell>{item.lastname || '—'}</TableCell>
                        <TableCell>{item.email || '—'}</TableCell>
                        <TableCell>{item.phone || '—'}</TableCell>
                        <TableCell>{item.mobile || '—'}</TableCell>
                        <TableCell>{item.fax || '—'}</TableCell>
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
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth='sm' fullWidth>
        <DialogTitle>{editing ? t.polluterContactEdit : t.polluterContactCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label={t.polluterContactSex} value={formData.sex} onChange={e => set('sex', e.target.value)}>
                <MenuItem value='Mr'>Mr</MenuItem>
                <MenuItem value='Ms'>Ms</MenuItem>
                <MenuItem value='Mrs'>Mrs</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label={t.polluterContactFirstname} value={formData.firstname} onChange={e => set('firstname', e.target.value)} required inputProps={{ maxLength: 16 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label={t.polluterContactLastname} value={formData.lastname} onChange={e => set('lastname', e.target.value)} required inputProps={{ maxLength: 32 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label={t.polluterContactEmail} value={formData.email} onChange={e => set('email', e.target.value)} type='email' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t.polluterContactPhone} value={formData.phone} onChange={e => set('phone', e.target.value)} inputProps={{ maxLength: 20 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t.polluterContactMobile} value={formData.mobile} onChange={e => set('mobile', e.target.value)} inputProps={{ maxLength: 20 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t.polluterContactFax} value={formData.fax} onChange={e => set('fax', e.target.value)} inputProps={{ maxLength: 20 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={t.polluterContactFunction} value={formData.function} onChange={e => set('function', e.target.value)} inputProps={{ maxLength: 64 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>{t.cancel}</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || !formData.firstname.trim() || !formData.lastname.trim()}
          >
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.polluterContactDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.polluterContactDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.lastname} {deletingItem.firstname}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.polluterContactDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
