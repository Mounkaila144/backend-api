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
import Typography from '@mui/material/Typography'

import Tooltip from '@mui/material/Tooltip'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import DocumentFieldsCrud from './iso-document/DocumentFieldsCrud'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductModel {
  id: number
  name: string
  extension: string | null
}

interface ClassOption {
  id: number
  name: string
}

interface DocItem {
  id: number
  name: string
  type: number
  model_id: number
  model_name: string | null
  class_id: number | null
  class_name: string | null
}

interface FormData {
  name: string
  model_id: number | ''
  class_id: number | ''
}

const emptyForm: FormData = { name: '', model_id: '', class_id: '' }

const BASE = '/admin/appdomoprime/iso/documents'

// ─── Component ────────────────────────────────────────────────────────────────

export default function IsoDocumentCrud() {
  const t = useConfigTranslations()

  const [items, setItems] = useState<DocItem[]>([])
  const [productModels, setProductModels] = useState<ProductModel[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DocItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<DocItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Sub-page: Fields for document
  const [fieldsFor, setFieldsFor] = useState<DocItem | null>(null)

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [optRes, listRes] = await Promise.all([
        apiClient.get<{
          success: boolean
          data: { product_models: ProductModel[]; classes: ClassOption[] }
        }>(`${BASE}/options`, { params: { lang: 'fr' } }),
        apiClient.get<{ success: boolean; data: DocItem[] }>(BASE, { params: { lang: 'fr' } }),
      ])

      if (optRes.data.success) {
        setProductModels(optRes.data.data.product_models)
        setClasses(optRes.data.data.classes)
      }
      if (listRes.data.success) setItems(listRes.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [t.settingsLoadError])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Dialog open / close ──────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: DocItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      model_id: item.model_id,
      class_id: item.class_id ?? '',
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
  }

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: formData.name,
        model_id: formData.model_id,
        class_id: formData.class_id !== '' ? formData.class_id : null,
      }

      if (editingItem) {
        const res = await apiClient.put<{ success: boolean; data: DocItem }>(
          `${BASE}/${editingItem.id}`,
          payload,
        )
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editingItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleCloseDialog()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: DocItem }>(BASE, payload)
        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.settingsSaved)
          handleCloseDialog()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleOpenDelete = (item: DocItem) => {
    setDeletingItem(item)
    setDeleteDialogOpen(true)
  }

  const handleCloseDelete = () => {
    setDeleteDialogOpen(false)
    setDeletingItem(null)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${deletingItem.id}`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== deletingItem.id))
        setSuccessMsg(t.settingsSaved)
        handleCloseDelete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Sub-page: Fields ──────────────────────────────────────────────────

  if (fieldsFor) {
    return (
      <DocumentFieldsCrud
        documentId={fieldsFor.id}
        documentName={fieldsFor.name}
        onBack={() => setFieldsFor(null)}
      />
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>
          {successMsg}
        </Alert>
      </Snackbar>

      <Typography variant='h5' sx={{ mb: 3 }}>
        {t.isoDocTitle}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.isoDocAdd}
        </Button>
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.statusCrudBack}
        </Button>
      </Box>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocName}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocType}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocClass}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoDocModel}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                    {t.isoDocActions}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      {t.isoDocEmpty}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.class_name || '—'}</TableCell>
                      <TableCell>{item.model_name || '—'}</TableCell>
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title={t.statusCrudEdit}>
                          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(item)}>
                            <i className='ri-edit-line' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.isoDocFields}>
                          <IconButton size='small' onClick={() => setFieldsFor(item)}>
                            <i className='ri-list-check-2' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.statusCrudDelete}>
                          <IconButton size='small' color='error' onClick={() => handleOpenDelete(item)}>
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

      {/* ─── Create / Edit Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? t.isoDocEdit : t.isoDocCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t.isoDocName}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                inputProps={{ maxLength: 64 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select fullWidth required
                label={t.isoDocModel}
                value={formData.model_id}
                onChange={e =>
                  setFormData(prev => ({ ...prev, model_id: Number(e.target.value) }))
                }
              >
                {productModels.map(m => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.name}{m.extension ? ` (${m.extension})` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select fullWidth
                label={t.isoDocClass}
                value={formData.class_id}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    class_id: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
              >
                <MenuItem value=''>{t.isoDocNoClass}</MenuItem>
                {classes.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            {t.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || formData.model_id === ''}
          >
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ───────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoDocDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoDocDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.name}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDelete} disabled={deleting}>
            {t.cancel}
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleConfirmDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : t.isoDocDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
