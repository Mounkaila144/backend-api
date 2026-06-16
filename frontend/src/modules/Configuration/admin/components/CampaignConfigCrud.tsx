'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface CampaignItem {
  id: number
  name: string
}

interface Props {
  baseUrl?: string
  title?: string
}

interface FormData {
  name: string
}

const emptyForm: FormData = { name: '' }

// ─── Component ───────────────────────────────────────────

export default function CampaignConfigCrud({ baseUrl: baseUrlProp, title: titleProp }: Props) {
  const t = useConfigTranslations()

  const [items, setItems] = useState<CampaignItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CampaignItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<CampaignItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const baseUrl = baseUrlProp ?? '/admin/customersmeetings/config/campaigns'
  const title = titleProp ?? t.meetingCampaignTitle

  // ─── Fetch ───────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: CampaignItem[] }>(baseUrl)

      if (res.data.success) {
        setItems(res.data.data)
      }
    } catch {
      setError(t.statusCrudLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.statusCrudLoadError])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ─── Dialog open/close ───────────────────────────────

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: CampaignItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
    })
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
  }

  // ─── Save (create or update) ─────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = { ...formData }

      if (editingItem) {
        const res = await apiClient.put<{ success: boolean; data: CampaignItem }>(
          `${baseUrl}/${editingItem.id}`,
          payload,
        )

        if (res.data.success) {
          setItems(prev => prev.map(item => (item.id === editingItem.id ? res.data.data : item)))
          setSuccessMsg(t.statusCrudSaved)
          handleCloseDialog()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: CampaignItem }>(baseUrl, payload)

        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.statusCrudSaved)
          handleCloseDialog()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudSaveError)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ──────────────────────────────────────────

  const handleOpenDelete = (item: CampaignItem) => {
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
      const res = await apiClient.delete<{ success: boolean }>(`${baseUrl}/${deletingItem.id}`)

      if (res.data.success) {
        setItems(prev => prev.filter(item => item.id !== deletingItem.id))
        setSuccessMsg(t.statusCrudDeleted)
        handleCloseDelete()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudDeleteError)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ──────────────────────────────────────────

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
        {title}
      </Typography>

      {/* Top actions */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.statusCrudAdd}
        </Button>
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.statusCrudBack}
        </Button>
      </Box>

      {/* Table */}
      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.statusCrudName}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                    {t.statusCrudActions}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      -
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align='right'>
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => handleOpenEdit(item)}
                          title={t.statusCrudEdit}
                        >
                          <i className='ri-edit-line' />
                        </IconButton>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleOpenDelete(item)}
                          title={t.statusCrudDelete}
                        >
                          <i className='ri-delete-bin-line' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* ─── Create / Edit Dialog ──────────────────────── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editingItem ? t.statusCrudEditTitle : t.statusCrudCreateTitle}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t.statusCrudName}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>
            {t.cancel}
          </Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !formData.name.trim()}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDelete} maxWidth='xs' fullWidth>
        <DialogTitle>{t.statusCrudConfirmDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.statusCrudConfirmDelete}</Typography>
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
          <Button variant='contained' color='error' onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.statusCrudDelete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
