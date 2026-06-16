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

interface ModelItem {
  id: number
  polluter_id: number
  name: string
  extension: string
  has_i18n: boolean
  value: string | null
  file: string | null
  content: string | null
  comments: string | null
  variables: string | null
  is_pdf: boolean
  is_docx: boolean
}

type FormData = {
  name: string
  extension: string
  value: string
  content: string
  comments: string
  variables: string
}

const emptyForm: FormData = {
  name: '',
  extension: '',
  value: '',
  content: '',
  comments: '',
  variables: '',
}

const LANG_OPTIONS = ['fr', 'en', 'ar', 'es', 'de', 'it']

interface Props {
  polluterId: number
  polluterName: string
  onBack: () => void
}

export default function PolluterModelsCrud({ polluterId, polluterName, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/models`

  const [items, setItems] = useState<ModelItem[]>([])
  const [lang, setLang] = useState('fr')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ModelItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ModelItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: { items: ModelItem[]; lang: string } }>(baseUrl, {
        params: { lang },
      })
      if (res.data.success) setItems(res.data.data.items)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, lang, t.settingsLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: keyof FormData, value: string) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: ModelItem) => {
    setEditing(item)
    setFormData({
      name: item.name,
      extension: item.extension ?? '',
      value: item.value ?? '',
      content: item.content ?? '',
      comments: item.comments ?? '',
      variables: item.variables ?? '',
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
      const payload = { ...formData, lang }
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: ModelItem }>(`${baseUrl}/${editing.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: ModelItem }>(baseUrl, payload)
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
          {t.polluterModelTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />

        <TextField
          select size='small'
          label={t.polluterModelLang}
          value={lang}
          onChange={e => setLang(e.target.value)}
          sx={{ minWidth: 100 }}
        >
          {LANG_OPTIONS.map(l => (
            <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>
          ))}
        </TextField>

        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.polluterModelNew}
        </Button>
        <Tooltip title={t.polluterModelPdfNotice}>
          <span>
            <Button variant='outlined' disabled>
              <i className='ri-file-pdf-line' style={{ marginRight: 6 }} />
              {t.polluterModelNewPDF}
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={t.polluterModelPdfNotice}>
          <span>
            <Button variant='outlined' disabled>
              <i className='ri-file-word-line' style={{ marginRight: 6 }} />
              {t.polluterModelNewDoc}
            </Button>
          </span>
        </Tooltip>
      </Box>

      <Alert severity='info' sx={{ mb: 2 }}>
        {t.polluterModelPdfNotice}
      </Alert>

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
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterModelId}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterModelName}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterModelValue}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterModelExtension}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterModelActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {t.polluterModelEmpty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.value || '—'}</TableCell>
                        <TableCell>{item.extension || '—'}</TableCell>
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
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth='md' fullWidth>
        <DialogTitle>{editing ? t.polluterModelEditTitle : t.polluterModelCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth required label={t.polluterModelName} value={formData.name} onChange={e => set('name', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label={t.polluterModelExtension} value={formData.extension} onChange={e => set('extension', e.target.value)} inputProps={{ maxLength: 4 }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth required label={t.polluterModelValue} value={formData.value} onChange={e => set('value', e.target.value)} helperText={`Lang: ${lang.toUpperCase()}`} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label={t.polluterModelContent} value={formData.content} onChange={e => set('content', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={3} label={t.polluterModelVariables} value={formData.variables} onChange={e => set('variables', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={3} label={t.polluterModelComments} value={formData.comments} onChange={e => set('comments', e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.value.trim()}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.polluterModelDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.polluterModelDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.value || deletingItem.name}
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
