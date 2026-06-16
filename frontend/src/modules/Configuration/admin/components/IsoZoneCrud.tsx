'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  id: number
  name: string
}

interface ZoneItem {
  id: number
  code: string
  dept: string
  sector: string | null
  region_id: number
  sector_id: number
  region_name: string | null
  sector_name: string | null
}

interface FormData {
  code: string
  dept: string
  region_id: number | ''
  sector_id: number | ''
}

interface FilterState {
  code: string
  dept: string
  order_by: string
  order_dir: 'asc' | 'desc'
}

const emptyForm: FormData = { code: '', dept: '', region_id: '', sector_id: '' }
const emptyFilter: FilterState = { code: '', dept: '', order_by: 'id', order_dir: 'asc' }

const BASE = '/admin/appdomoprime/iso/zones'

// ─── Component ────────────────────────────────────────────────────────────────

export default function IsoZoneCrud() {
  const t = useConfigTranslations()

  const [items, setItems] = useState<ZoneItem[]>([])
  const [regions, setRegions] = useState<SelectOption[]>([])
  const [sectors, setSectors] = useState<SelectOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterState>(emptyFilter)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ZoneItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Single delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<ZoneItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bulk delete
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {
        order_by: filter.order_by,
        order_dir: filter.order_dir,
      }
      if (filter.code) params.code = filter.code
      if (filter.dept) params.dept = filter.dept

      const [optRes, listRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: { regions: SelectOption[]; sectors: SelectOption[] } }>(
          `${BASE}/options`,
        ),
        apiClient.get<{ success: boolean; data: ZoneItem[] }>(BASE, { params }),
      ])

      if (optRes.data.success) {
        setRegions(optRes.data.data.regions)
        setSectors(optRes.data.data.sectors)
      }
      if (listRes.data.success) {
        setItems(listRes.data.data)
        // Drop selections that are no longer in the list
        setSelected(prev => new Set([...prev].filter(id => listRes.data.data.some(z => z.id === id))))
      }
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [filter, t.settingsLoadError])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── Sort ─────────────────────────────────────────────────────────────────

  const handleSort = (col: string) => {
    setFilter(prev => ({
      ...prev,
      order_by: col,
      order_dir: prev.order_by === col && prev.order_dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortIcon = (col: string) => {
    if (filter.order_by !== col) return 'ri-arrow-up-down-line'
    return filter.order_dir === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'
  }

  // ─── Selection ───────────────────────────────────────────────────────────

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === items.length && items.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(items.map(i => i.id)))
    }
  }

  // ─── Dialog open / close ──────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: ZoneItem) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      dept: item.dept,
      region_id: item.region_id,
      sector_id: item.sector_id,
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
        code: formData.code,
        dept: formData.dept,
        region_id: formData.region_id,
        sector_id: formData.sector_id,
      }

      if (editingItem) {
        const res = await apiClient.put<{ success: boolean; data: ZoneItem }>(
          `${BASE}/${editingItem.id}`,
          payload,
        )
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editingItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleCloseDialog()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: ZoneItem }>(BASE, payload)
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

  // ─── Single Delete ───────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${deletingItem.id}`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== deletingItem.id))
        setSelected(prev => {
          const next = new Set(prev)
          next.delete(deletingItem.id)
          return next
        })
        setSuccessMsg(t.settingsSaved)
        setDeleteDialogOpen(false)
        setDeletingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Bulk Delete ─────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    setError(null)
    try {
      const ids = Array.from(selected)
      const res = await apiClient.post<{ success: boolean }>(`${BASE}/bulk-delete`, { ids })
      if (res.data.success) {
        setItems(prev => prev.filter(i => !selected.has(i.id)))
        setSelected(new Set())
        setSuccessMsg(t.isoZoneBulkDeleted)
        setBulkDeleteOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setBulkDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const isFormValid =
    formData.code.trim() !== '' &&
    formData.dept.trim() !== '' &&
    formData.region_id !== '' &&
    formData.sector_id !== ''

  const allSelected = items.length > 0 && selected.size === items.length
  const someSelected = selected.size > 0 && selected.size < items.length

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

      <Typography variant='h5' sx={{ mb: 3 }}>
        {t.isoZoneTitle}
      </Typography>

      {/* Header buttons (theme32a: New sector only) */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.isoZoneAdd}
        </Button>
        {selected.size > 0 ? (
          <Button variant='outlined' color='error' onClick={() => setBulkDeleteOpen(true)}>
            <i className='ri-delete-bin-line' style={{ marginRight: 6 }} />
            {t.isoZoneDeleteBtn} ({selected.size})
          </Button>
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
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
                {/* Column headers with sort */}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell padding='checkbox'>
                    <Tooltip title={t.isoZoneSelectAll}>
                      <Checkbox
                        size='small'
                        indeterminate={someSelected}
                        checked={allSelected}
                        onChange={toggleSelectAll}
                      />
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                    {t.isoZoneId} <i className={sortIcon('id')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('code')}>
                    {t.isoZoneCode} <i className={sortIcon('code')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('dept')}>
                    {t.isoZoneDept} <i className={sortIcon('dept')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoZoneZoneCol}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.isoZoneActions}</TableCell>
                </TableRow>
                {/* Per-column search row (theme32a pattern) */}
                <TableRow>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.code}
                      onChange={e => setFilter(prev => ({ ...prev, code: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.dept}
                      onChange={e => setFilter(prev => ({ ...prev, dept: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      {t.isoZoneEmpty}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} hover selected={selected.has(item.id)}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          size='small'
                          checked={selected.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </TableCell>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.code}</TableCell>
                      <TableCell>{item.dept}</TableCell>
                      <TableCell>{item.sector_name || t.isoZoneNoSector}</TableCell>
                      <TableCell align='right'>
                        <Tooltip title={t.statusCrudEdit}>
                          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(item)}>
                            <i className='ri-edit-line' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t.statusCrudDelete}>
                          <IconButton size='small' color='error' onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true) }}>
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
        <DialogTitle>{editingItem ? t.isoZoneEdit : t.isoZoneCreate}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth required
                type='number'
                label={t.isoZoneCode}
                value={formData.code}
                onChange={e => setFormData(prev => ({ ...prev, code: e.target.value }))}
                inputProps={{ maxLength: 16 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth required
                label={t.isoZoneDept}
                value={formData.dept}
                onChange={e => setFormData(prev => ({ ...prev, dept: e.target.value }))}
                inputProps={{ maxLength: 8 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                select fullWidth required
                label={t.isoZoneSectorModel}
                value={formData.sector_id}
                onChange={e => setFormData(prev => ({ ...prev, sector_id: Number(e.target.value) }))}
              >
                {sectors.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select fullWidth required
                label={t.isoZoneRegion}
                value={formData.region_id}
                onChange={e => setFormData(prev => ({ ...prev, region_id: Number(e.target.value) }))}
              >
                {regions.map(r => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Single Delete Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoZoneDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoZoneDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.code} — {deletingItem.dept}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.isoZoneDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Bulk Delete Dialog ──────────────────────────────────────────── */}
      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoZoneBulkDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoZoneBulkDeleteConfirm.replace('%d', String(selected.size))}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting ? <CircularProgress size={20} /> : t.isoZoneDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
