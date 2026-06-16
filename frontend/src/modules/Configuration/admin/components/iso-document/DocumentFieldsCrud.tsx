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

interface FieldItem {
  id: number
  document_id: number
  form_id: number
  formfield_id: number
  formfield_i18n_id: number
  type: number
  operation: string
  value: string
}

type FormData = {
  form_id: string
  formfield_id: string
  formfield_i18n_id: string
  type: string
  operation: string
  value: string
}

const emptyForm: FormData = {
  form_id: '',
  formfield_id: '',
  formfield_i18n_id: '',
  type: '0',
  operation: '=',
  value: '',
}

const OPERATIONS = ['=', '!=', '<', '<=', '>', '>=', 'IN', 'NOT IN']

interface Props {
  documentId: number
  documentName: string
  onBack: () => void
}

export default function DocumentFieldsCrud({ documentId, documentName, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/documents/${documentId}/fields`

  const [items, setItems] = useState<FieldItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FieldItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<FieldItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: { items: FieldItem[] } }>(baseUrl)
      if (res.data.success) setItems(res.data.data.items)
    } catch {
      setError(t.statusCrudLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.statusCrudLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: keyof FormData, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: FieldItem) => {
    setEditing(item)
    setFormData({
      form_id: String(item.form_id),
      formfield_id: String(item.formfield_id),
      formfield_i18n_id: String(item.formfield_i18n_id),
      type: String(item.type),
      operation: item.operation,
      value: item.value,
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
        form_id: Number(formData.form_id),
        formfield_id: Number(formData.formfield_id),
        formfield_i18n_id: Number(formData.formfield_i18n_id),
        type: Number(formData.type),
        operation: formData.operation,
        value: formData.value,
      }
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: FieldItem }>(`${baseUrl}/${editing.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.statusCrudSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: FieldItem }>(baseUrl, payload)
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

  const isFormValid =
    formData.form_id !== '' &&
    formData.formfield_id !== '' &&
    formData.formfield_i18n_id !== '' &&
    formData.operation !== '' &&
    formData.value !== ''

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
          {t.isoDocFieldsBack}
        </Button>
        <Typography variant='h5' sx={{ ml: 1 }}>
          {t.isoDocFieldsTitle} — <span style={{ fontWeight: 400 }}>{documentName}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.isoDocFieldsNew}
        </Button>
      </Box>

      <Alert severity='info' sx={{ mb: 2 }}>{t.isoDocFieldsHelp}</Alert>

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
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocFieldsField}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocFieldsOperation}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocFieldsValue}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocFieldsTypeCol}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.isoDocFieldsActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {t.isoDocFieldsEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <span style={{ fontFamily: 'monospace' }}>
                            {item.form_id}/{item.formfield_id}/{item.formfield_i18n_id}
                          </span>
                        </TableCell>
                        <TableCell>{item.operation}</TableCell>
                        <TableCell>{item.value}</TableCell>
                        <TableCell>{item.type}</TableCell>
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
        <DialogTitle>{editing ? t.isoDocFieldsEdit : t.isoDocFieldsCreate}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t.isoDocFieldsHelp}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={4}>
              <TextField fullWidth required type='number' label={t.isoDocFieldsFormId} value={formData.form_id} onChange={e => set('form_id', e.target.value)} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth required type='number' label={t.isoDocFieldsFormFieldId} value={formData.formfield_id} onChange={e => set('formfield_id', e.target.value)} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth required type='number' label={t.isoDocFieldsFormFieldI18nId} value={formData.formfield_i18n_id} onChange={e => set('formfield_i18n_id', e.target.value)} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={4}>
              <TextField select fullWidth required label={t.isoDocFieldsOperation} value={formData.operation} onChange={e => set('operation', e.target.value)}>
                {OPERATIONS.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth required label={t.isoDocFieldsValue} value={formData.value} onChange={e => set('value', e.target.value)} inputProps={{ maxLength: 64 }} />
            </Grid>
            <Grid item xs={4}>
              <TextField fullWidth type='number' label={t.isoDocFieldsTypeCol} value={formData.type} onChange={e => set('type', e.target.value)} inputProps={{ min: 0 }} />
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

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoDocFieldsDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoDocFieldsDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.operation} {deletingItem.value}
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
