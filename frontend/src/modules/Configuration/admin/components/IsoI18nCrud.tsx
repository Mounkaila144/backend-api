'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'

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

export interface IsoI18nItem {
  id: number
  name: string
  value: string
  translation_id: number | null
  [key: string]: unknown
}

interface FormData {
  name: string
  value: string
}

interface FilterState {
  name: string
  value: string
  order_by: string
  order_dir: 'asc' | 'desc'
  lang: string
}

const emptyForm: FormData = { name: '', value: '' }

const ISO_BASE = '/admin/appdomoprime/iso'
const LANG_OPTIONS = ['fr', 'en', 'ar', 'es', 'de', 'it']

// ─── Component ────────────────────────────────────────────────────────────────

export interface ExtraColumn<T = IsoI18nItem> {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  render: (item: T) => ReactNode
}

export interface RowAction<T = IsoI18nItem> {
  key: string
  label: string
  iconClass: string
  color?: 'primary' | 'inherit' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  onClick: (item: T) => void
}

export interface HeaderAction {
  key: string
  label: string
  iconClass: string
  variant?: 'contained' | 'outlined' | 'text'
  onClick: () => void
}

interface Props<T extends IsoI18nItem = IsoI18nItem> {
  apiType: string
  title: string

  /** When true, show the ID column between the checkbox and Name (theme32a Models pattern). */
  showId?: boolean

  /** Optional extra columns (e.g. coef/multiple for Class) shown between Value and Actions. */
  extraColumns?: ExtraColumn<T>[]

  /** Optional extra row actions shown before the standard Edit/Delete pair. */
  extraRowActions?: RowAction<T>[]

  /** Optional extra header buttons shown after the New button. */
  extraHeaderActions?: HeaderAction[]

  /** Optional extra fields rendered in the Create/Edit dialog (e.g. coef inputs for Class). */
  renderExtraDialogFields?: (
    formExtra: Record<string, string>,
    setFormExtra: (key: string, value: string) => void,
  ) => ReactNode

  /** Initial values for extra dialog fields when editing. */
  buildExtraFormData?: (item: T | null) => Record<string, string>

  /** Build payload entries from extra form data. */
  buildExtraPayload?: (formExtra: Record<string, string>) => Record<string, unknown>
}

export default function IsoI18nCrud<T extends IsoI18nItem = IsoI18nItem>({
  apiType,
  title,
  showId = false,
  extraColumns = [],
  extraRowActions = [],
  extraHeaderActions = [],
  renderExtraDialogFields,
  buildExtraFormData,
  buildExtraPayload,
}: Props<T>) {
  const t = useConfigTranslations()

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterState>({
    name: '',
    value: '',
    order_by: 'id',
    order_dir: 'asc',
    lang: 'fr',
  })

  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [formExtra, setFormExtra] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Single delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<T | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Bulk delete
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const baseUrl = `${ISO_BASE}/${apiType}`

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {
        lang: filter.lang,
        order_by: filter.order_by,
        order_dir: filter.order_dir,
      }
      if (filter.name) params.name = filter.name
      if (filter.value) params.value = filter.value

      const res = await apiClient.get<{ success: boolean; data: T[] }>(baseUrl, { params })
      if (res.data.success) {
        setItems(res.data.data)
        setSelected(prev => new Set([...prev].filter(id => res.data.data.some(i => i.id === id))))
      }
    } catch {
      setError(t.statusCrudLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, filter, t.statusCrudLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  // ─── Sort & filter ────────────────────────────────────────────────────────

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

  // ─── Selection ────────────────────────────────────────────────────────────

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

  const setExtraField = (key: string, value: string) =>
    setFormExtra(prev => ({ ...prev, [key]: value }))

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData(emptyForm)
    setFormExtra(buildExtraFormData ? buildExtraFormData(null) : {})
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: T) => {
    setEditingItem(item)
    setFormData({ name: item.name, value: item.value || '' })
    setFormExtra(buildExtraFormData ? buildExtraFormData(item) : {})
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
    setFormExtra({})
  }

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const extraPayload = buildExtraPayload ? buildExtraPayload(formExtra) : {}
      const payload = { ...formData, lang: filter.lang, ...extraPayload }

      if (editingItem) {
        const res = await apiClient.put<{ success: boolean; data: T }>(`${baseUrl}/${editingItem.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editingItem.id ? res.data.data : i)))
          setSuccessMsg(t.statusCrudSaved)
          handleCloseDialog()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: T }>(baseUrl, payload)
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

  // ─── Single Delete ────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    if (!deletingItem) return
    setDeleting(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${baseUrl}/${deletingItem.id}`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== deletingItem.id))
        setSelected(prev => {
          const next = new Set(prev)
          next.delete(deletingItem.id)
          return next
        })
        setSuccessMsg(t.statusCrudDeleted)
        setDeleteDialogOpen(false)
        setDeletingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudDeleteError)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Bulk Delete ──────────────────────────────────────────────────────────

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    setBulkDeleting(true)
    setError(null)
    try {
      const ids = Array.from(selected)
      const res = await apiClient.post<{ success: boolean }>(`${baseUrl}/bulk-delete`, { ids })
      if (res.data.success) {
        setItems(prev => prev.filter(i => !selected.has(i.id)))
        setSelected(new Set())
        setSuccessMsg(t.isoI18nBulkDeleted)
        setBulkDeleteOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.statusCrudDeleteError)
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

  const allSelected = items.length > 0 && selected.size === items.length
  const someSelected = selected.size > 0 && selected.size < items.length
  const colSpan = (showId ? 7 : 6) + extraColumns.length

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
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>
          {successMsg}
        </Alert>
      </Snackbar>

      <Typography variant='h5' sx={{ mb: 3 }}>
        {title}
      </Typography>

      {/* Header buttons + lang switcher */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.statusCrudAdd}
        </Button>
        {extraHeaderActions.map(a => (
          <Button key={a.key} variant={a.variant ?? 'outlined'} onClick={a.onClick}>
            <i className={a.iconClass} style={{ marginRight: 6 }} />
            {a.label}
          </Button>
        ))}
        {selected.size > 0 ? (
          <Button variant='outlined' color='error' onClick={() => setBulkDeleteOpen(true)}>
            <i className='ri-delete-bin-line' style={{ marginRight: 6 }} />
            {t.isoI18nBulkDelete} ({selected.size})
          </Button>
        ) : null}

        <Box sx={{ flexGrow: 1 }} />

        <TextField
          select size='small'
          label={t.isoI18nLangLabel}
          value={filter.lang}
          onChange={e => setFilter(prev => ({ ...prev, lang: e.target.value }))}
          sx={{ minWidth: 100 }}
        >
          {LANG_OPTIONS.map(l => (
            <MenuItem key={l} value={l}>{l.toUpperCase()}</MenuItem>
          ))}
        </TextField>

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
                  {showId ? (
                    <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                      {t.isoZoneId} <i className={sortIcon('id')} />
                    </TableCell>
                  ) : null}
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    {t.statusCrudName} <i className={sortIcon('name')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('value')}>
                    {t.statusCrudValue} <i className={sortIcon('value')} />
                  </TableCell>
                  {extraColumns.map(c => (
                    <TableCell key={c.key} sx={{ fontWeight: 'bold' }} align={c.align ?? 'left'}>
                      {c.label}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                    {t.statusCrudActions}
                  </TableCell>
                </TableRow>
                {/* Per-column search row */}
                <TableRow>
                  <TableCell />
                  <TableCell />
                  {showId ? <TableCell /> : null}
                  <TableCell>
                    <TextField
                      size='small' variant='standard' placeholder='…'
                      value={filter.name}
                      onChange={e => setFilter(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small' variant='standard' placeholder='…'
                      value={filter.value}
                      onChange={e => setFilter(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </TableCell>
                  {extraColumns.map(c => <TableCell key={c.key} />)}
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      —
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
                      {showId ? <TableCell>{item.id}</TableCell> : null}
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.value || t.isoI18nNoTranslation}</TableCell>
                      {extraColumns.map(c => (
                        <TableCell key={c.key} align={c.align ?? 'left'}>
                          {c.render(item)}
                        </TableCell>
                      ))}
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title={t.statusCrudEdit}>
                          <IconButton size='small' color='primary' onClick={() => handleOpenEdit(item)}>
                            <i className='ri-edit-line' />
                          </IconButton>
                        </Tooltip>
                        {extraRowActions.map(a => (
                          <Tooltip key={a.key} title={a.label}>
                            <IconButton size='small' color={a.color ?? 'inherit'} onClick={() => a.onClick(item)}>
                              <i className={a.iconClass} />
                            </IconButton>
                          </Tooltip>
                        ))}
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
        <DialogTitle>{editingItem ? t.statusCrudEditTitle : t.statusCrudCreateTitle}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth required
                label={t.statusCrudName}
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t.statusCrudValue}
                value={formData.value}
                onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                helperText={`Lang: ${filter.lang.toUpperCase()}`}
              />
            </Grid>
            {renderExtraDialogFields ? renderExtraDialogFields(formExtra, setExtraField) : null}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !formData.name.trim()}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Single Delete Dialog ────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
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
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.statusCrudDelete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Bulk Delete Dialog ──────────────────────────────────────────── */}
      <Dialog open={bulkDeleteOpen} onClose={() => setBulkDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.statusCrudConfirmDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoI18nBulkConfirm.replace('%d', String(selected.size))}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting ? <CircularProgress size={20} /> : t.statusCrudDelete}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
