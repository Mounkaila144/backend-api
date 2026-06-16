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
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface ZoneItem {
  id: number
  name: string
  postcodes: string
  max_contracts: number
  is_active: string
}

interface ZoneFormData {
  name: string
  postcodes: string
  max_contracts: number
  is_active: string
}

const emptyForm: ZoneFormData = {
  name: '',
  postcodes: '',
  max_contracts: 0,
  is_active: 'YES',
}

// ─── Helpers ─────────────────────────────────────────────

const isYes = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  
return false
}

// ─── Component ───────────────────────────────────────────

export default function ZoneConfigCrud() {
  const t = useConfigTranslations()

  const [items, setItems] = useState<ZoneItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<ZoneItem | null>(null)
  const [formData, setFormData] = useState<ZoneFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ZoneItem | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const res = await apiClient.get<{ success: boolean; data: ZoneItem[] }>(
        '/admin/customerscontracts/config/zones',
      )

      if (res.data.success) setItems(res.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [t.settingsLoadError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Dialog handlers ────────────────────────────────────

  const openCreateDialog = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: ZoneItem) => {
    setEditItem(item)
    setFormData({
      name: item.name,
      postcodes: item.postcodes,
      max_contracts: item.max_contracts,
      is_active: item.is_active,
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
      if (editItem) {
        const res = await apiClient.put<{ success: boolean; data: ZoneItem }>(
          `/admin/customerscontracts/config/zones/${editItem.id}`,
          formData,
        )

        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: ZoneItem }>(
          '/admin/customerscontracts/config/zones',
          formData,
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

  // ─── Toggle active ─────────────────────────────────────

  const handleToggleActive = async (item: ZoneItem) => {
    try {
      const res = await apiClient.patch<{ success: boolean; data: ZoneItem }>(
        `/admin/customerscontracts/config/zones/${item.id}/toggle-active`,
      )

      if (res.data.success) {
        setItems(prev => prev.map(i => (i.id === item.id ? res.data.data : i)))
        setSuccessMsg(t.settingsSaved)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    }
  }

  // ─── Delete handlers ───────────────────────────────────

  const openDeleteDialog = (item: ZoneItem) => {
    setDeleteTarget(item)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await apiClient.delete(`/admin/customerscontracts/config/zones/${deleteTarget.id}`)
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
        {t.zoneTitle}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant='contained' onClick={openCreateDialog}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.zoneAdd}
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
              <TableCell>{t.zoneName}</TableCell>
              <TableCell>{t.zonePostcodes}</TableCell>
              <TableCell>{t.zoneMaxContracts}</TableCell>
              <TableCell>{t.zoneActive}</TableCell>
              <TableCell align='right'>{t.zoneActions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center'>
                  {t.zoneEmpty}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Typography variant='body2' sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.postcodes}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.max_contracts}</TableCell>
                  <TableCell>
                    <Switch
                      size='small'
                      checked={isYes(item.is_active)}
                      onChange={() => handleToggleActive(item)}
                    />
                  </TableCell>
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
        <DialogTitle>{editItem ? t.zoneEdit : t.zoneCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t.zoneName}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t.zonePostcodes}
                value={formData.postcodes}
                onChange={e => setFormData(prev => ({ ...prev, postcodes: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type='number'
                label={t.zoneMaxContracts}
                value={formData.max_contracts}
                onChange={e => setFormData(prev => ({ ...prev, max_contracts: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isYes(formData.is_active)}
                    onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked ? 'YES' : 'NO' }))}
                  />
                }
                label={t.zoneActive}
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
        <DialogTitle>{t.zoneDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.zoneDeleteConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleDelete}>
            {t.zoneDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
