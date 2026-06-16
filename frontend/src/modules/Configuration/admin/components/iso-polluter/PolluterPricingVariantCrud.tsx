'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

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
import { usePermissions } from '@/shared/contexts/PermissionsContext'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PricingVariant = 'boilerpack' | 'ite'

interface ClassOption {
  id: number
  name: string
}

interface PricingItem {
  id: number
  polluter_id: number
  class_id: number | null
  class_name: string | null
  coef: string
  prime: string | null
  pack_prime: string | null
  pack_coef: string | null
  boiler_coef: string | null
  ana_prime: string | null
  ana_limit: string | null
  ite_prime: string | null
  ite_coef: string | null
  max_limit: string | null
}

type FormData = Record<string, string | number | ''>

interface Props {
  polluterId: number
  polluterName: string
  variant: PricingVariant
  onBack: () => void
}

// ─── Variant config ───────────────────────────────────────────────────────────

interface VariantConfig {
  title: string
  newLabel: string
  editLabel: string
  help: string
  empty: string
  fields: Array<{
    key: string
    labelKey: keyof ReturnType<typeof useConfigTranslations>
    superadminOnly?: boolean
    type?: 'number'
  }>
  // Columns shown in the table
  cols: Array<{ key: string; labelKey: keyof ReturnType<typeof useConfigTranslations> }>
}

const fmt = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 6 })

// ─── Component ────────────────────────────────────────────────────────────────

export default function PolluterPricingVariantCrud({ polluterId, polluterName, variant, onBack }: Props) {
  const t = useConfigTranslations()
  const { hasCredential } = usePermissions()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/pricing`

  const [items, setItems] = useState<PricingItem[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PricingItem | null>(null)
  const [formData, setFormData] = useState<FormData>({})
  const [saving, setSaving] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<PricingItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ─── Variant config ────────────────────────────────────────────────────────

  const config: VariantConfig = useMemo(() => {
    if (variant === 'boilerpack') {
      // From DomoprimePolluterBoilerPackClassPricingViewForm
      return {
        title: t.polluterBoilerPackTitle,
        newLabel: t.polluterBoilerPackNew,
        editLabel: t.polluterBoilerPackEdit,
        help: t.polluterBoilerPackHelp,
        empty: t.polluterBoilerPackEmpty,
        fields: [
          { key: 'prime',       labelKey: 'polluterPricingPrime',       type: 'number' },
          { key: 'pack_prime',  labelKey: 'polluterPricingPackPrime',   type: 'number' },
          { key: 'ana_limit',   labelKey: 'polluterPricingAnaLimit',    type: 'number' },
          { key: 'boiler_coef', labelKey: 'polluterPricingBoilerCoef',  type: 'number', superadminOnly: true },
          { key: 'pack_coef',   labelKey: 'polluterPricingPackCoef',    type: 'number', superadminOnly: true },
        ],
        cols: [
          { key: 'prime',       labelKey: 'polluterPricingPrime' },
          { key: 'pack_prime',  labelKey: 'polluterPricingPackPrime' },
          { key: 'boiler_coef', labelKey: 'polluterPricingBoilerCoef' },
          { key: 'pack_coef',   labelKey: 'polluterPricingPackCoef' },
          { key: 'ana_limit',   labelKey: 'polluterPricingAnaLimit' },
        ],
      }
    }

    // ITE — from DomoprimePolluterITEClassPricingViewForm
    return {
      title: t.polluterITEPricingTitle,
      newLabel: t.polluterITEPricingNew,
      editLabel: t.polluterITEPricingEdit,
      help: t.polluterITEPricingHelp,
      empty: t.polluterITEPricingEmpty,
      fields: [
        { key: 'ite_prime', labelKey: 'polluterPricingItePrime', type: 'number' },
        { key: 'ana_prime', labelKey: 'polluterPricingAnaPrime', type: 'number' },
        { key: 'ite_coef',  labelKey: 'polluterPricingIteCoef',  type: 'number' },
        { key: 'ana_limit', labelKey: 'polluterPricingAnaLimit', type: 'number' },
        { key: 'max_limit', labelKey: 'polluterPricingMaxLimit', type: 'number', superadminOnly: true },
      ],
      cols: [
        { key: 'ite_prime', labelKey: 'polluterPricingItePrime' },
        { key: 'ana_prime', labelKey: 'polluterPricingAnaPrime' },
        { key: 'ite_coef',  labelKey: 'polluterPricingIteCoef' },
        { key: 'ana_limit', labelKey: 'polluterPricingAnaLimit' },
      ],
    }
  }, [variant, t])

  const isSuperadmin = hasCredential([['superadmin']])

  const visibleFields = config.fields.filter(f => !f.superadminOnly || isSuperadmin)

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: { items: PricingItem[]; classes: ClassOption[] } }>(baseUrl, {
        params: { lang: 'fr' },
      })
      if (res.data.success) {
        setItems(res.data.data.items)
        setClasses(res.data.data.classes)
      }
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.settingsLoadError])

  useEffect(() => { fetchItems() }, [fetchItems])

  const set = (key: string, value: string | number) =>
    setFormData(prev => ({ ...prev, [key]: value }))

  // ─── Open / close ──────────────────────────────────────────────────────────

  const initialFormData = (item: PricingItem | null): FormData => {
    const out: FormData = { class_id: item?.class_id ?? '', coef: item?.coef ?? '0' }
    for (const f of visibleFields) {
      out[f.key] = (item ? (item as Record<string, unknown>)[f.key] : '') as string | number | ''
      if (out[f.key] === null || out[f.key] === undefined) out[f.key] = ''
    }
    return out
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setFormData(initialFormData(null))
    setDialogOpen(true)
  }

  const handleOpenEdit = (item: PricingItem) => {
    setEditing(item)
    setFormData(initialFormData(item))
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setEditing(null)
    setFormData({})
  }

  const buildPayload = () => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formData)) {
      if (v === '' || v === null || v === undefined) continue
      out[k] = k === 'class_id' ? Number(v) : v
    }
    // For new ITE/BoilerPack pricing, ensure coef is set (NOT NULL constraint)
    if (!editing && !out.coef) out.coef = 0
    return out
  }

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = buildPayload()
      if (editing) {
        const res = await apiClient.put<{ success: boolean; data: PricingItem }>(`${baseUrl}/${editing.id}`, payload)
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editing.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleClose()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: PricingItem }>(baseUrl, payload)
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

  const availableClasses = editing
    ? classes
    : classes.filter(c => !items.some(i => i.class_id === c.id))

  const isFormValid = (editing !== null || formData.class_id !== '')

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
          {config.title} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='contained' onClick={handleOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {config.newLabel}
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
                    <TableCell sx={{ fontWeight: 'bold' }}>{t.polluterPricingClass}</TableCell>
                    {config.cols.map(c => (
                      <TableCell key={c.key} sx={{ fontWeight: 'bold' }} align='right'>
                        {(t as Record<string, string>)[c.labelKey as string]}
                      </TableCell>
                    ))}
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>{t.polluterPricingActions}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={config.cols.length + 3} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                        {config.empty}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, idx) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{item.class_name ?? '—'}</TableCell>
                        {config.cols.map(c => (
                          <TableCell key={c.key} align='right'>
                            {fmt((item as Record<string, string | null>)[c.key])}
                          </TableCell>
                        ))}
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
        <DialogTitle>{editing ? config.editLabel : config.newLabel}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {config.help}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth required
                label={t.polluterPricingClass}
                value={formData.class_id ?? ''}
                onChange={e => set('class_id', Number(e.target.value))}
                disabled={!!editing}
              >
                {availableClasses.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {visibleFields.map(f => (
              <Grid item xs={12} sm={6} md={4} key={f.key}>
                <TextField
                  fullWidth
                  type={f.type ?? 'text'}
                  label={(t as Record<string, string>)[f.labelKey as string]}
                  value={formData[f.key] ?? ''}
                  onChange={e => set(f.key, e.target.value)}
                  inputProps={f.type === 'number' ? { step: 'any' } : undefined}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !isFormValid}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.polluterPricingDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.polluterPricingDeleteConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>
              {deletingItem.class_name}
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
