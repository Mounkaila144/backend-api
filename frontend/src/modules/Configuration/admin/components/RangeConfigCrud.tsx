'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface RangeItem {
  id: number
  name: string
  from: string
  to: string
  color: string
  value: string
}

type RangeFormData = Omit<RangeItem, 'id'>

const emptyForm: RangeFormData = {
  name: '',
  from: '',
  to: '',
  color: '#000000',
  value: '',
}

// ─── Component ───────────────────────────────────────────

interface Props {
  baseUrl?: string
  title?: string
}

export default function RangeConfigCrud({ baseUrl: baseUrlProp, title: titleProp }: Props = {}) {
  const t = useConfigTranslations()

  const [items, setItems] = useState<RangeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<RangeItem | null>(null)
  const [formData, setFormData] = useState<RangeFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<RangeItem | null>(null)

  const apiUrl = baseUrlProp ?? '/admin/customerscontracts/config/ranges'
  const displayTitle = titleProp ?? t.rangeTitle

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const res = await apiClient.get<{ success: boolean; data: RangeItem[] }>(
        `${apiUrl}`,
      )

      if (res.data.success) setItems(res.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [apiUrl, t.settingsLoadError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Dialog handlers ────────────────────────────────────

  const openCreateDialog = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: RangeItem) => {
    setEditItem(item)
    setFormData({
      name: item.name,
      from: item.from,
      to: item.to,
      color: item.color,
      value: item.value,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditItem(null)
    setFormData(emptyForm)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const payload = { ...formData, lang: 'fr' }

      if (editItem) {
        const res = await apiClient.put<{ success: boolean; data: RangeItem }>(
          `${apiUrl}/${editItem.id}`,
          payload,
        )

        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: RangeItem }>(
          `${apiUrl}`,
          payload,
        )

        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.settingsSaved)
        }
      }

      closeDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete handlers ───────────────────────────────────

  const openDeleteDialog = (item: RangeItem) => {
    setDeleteTarget(item)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await apiClient.delete(`${apiUrl}/${deleteTarget.id}`)
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      setSuccessMsg(t.settingsSaved)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────

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
        {displayTitle}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant='contained' onClick={openCreateDialog}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.rangeAdd}
        </Button>
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.cancel}
        </Button>
      </Box>

      {/* ─── Table ──────────────────────────────────────────── */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t.rangeName}</TableCell>
              <TableCell>{t.rangeFrom}</TableCell>
              <TableCell>{t.rangeTo}</TableCell>
              <TableCell>{t.rangeColor}</TableCell>
              <TableCell>{t.rangeValue}</TableCell>
              <TableCell align='right'>{t.rangeActions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  {t.rangeEmpty}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.from}</TableCell>
                  <TableCell>{item.to}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: item.color,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  </TableCell>
                  <TableCell>{item.value}</TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' onClick={() => openEditDialog(item)}>
                      <i className='ri-pencil-line' />
                    </IconButton>
                    <IconButton size='small' color='error' onClick={() => openDeleteDialog(item)}>
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Create / Edit Dialog ───────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth='sm' fullWidth>
        <DialogTitle>{editItem ? t.rangeEdit : t.rangeCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t.rangeName}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t.rangeFrom}
                type='time'
                value={formData.from}
                onChange={e => setFormData(prev => ({ ...prev, from: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t.rangeTo}
                type='time'
                value={formData.to}
                onChange={e => setFormData(prev => ({ ...prev, to: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t.rangeColor}
                type='color'
                value={formData.color}
                onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label={t.rangeValue}
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.rangeDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.rangeDeleteConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleDelete}>
            {t.rangeDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
