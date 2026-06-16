'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { iso3QuotationService } from '@/modules/AppDomoprimeISO3'
import type {
  CreateQuotationMode,
  Iso3CreatedQuotation,
  Iso3NewQuotationFormData,
  Iso3NewQuotationItem,
  Iso3SimulationResult,
} from '@/modules/AppDomoprimeISO3/types'

interface CreateQuotationDialogProps {
  contractId?: number | null
  // Story M0: when set, the dialog targets a meeting instead of a contract.
  // Exactly one of contractId / meetingId must be provided.
  meetingId?: number | null
  mode: CreateQuotationMode
  open: boolean
  onClose: () => void
  onCreated?: (quotation: Iso3CreatedQuotation) => void
}

interface ItemLookup {
  item: Iso3NewQuotationItem
  productId: number
}

const formatCurrency = (value: number) =>
  value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const formatNumber = (value: number) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 3 })

export default function CreateQuotationDialog({
  contractId,
  meetingId,
  mode,
  open,
  onClose,
  onCreated,
}: CreateQuotationDialogProps) {
  // Resolve the parent type once. We do not support both being set — the
  // button that opens the dialog passes exactly one.
  const isMeeting = meetingId != null
  const parentId = isMeeting ? meetingId : contractId ?? null
  const [form, setForm] = useState<Iso3NewQuotationFormData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [datedAt, setDatedAt] = useState<string>('')
  const [subventionTypeId, setSubventionTypeId] = useState<number | null>(null)
  const [selectedSelectorId, setSelectedSelectorId] = useState<number | null>(null)
  const [visibleCategories, setVisibleCategories] = useState<Set<number>>(new Set())
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set())
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({})
  const [itemPrices, setItemPrices] = useState<Record<number, number>>({})

  const [simulation, setSimulation] = useState<Iso3SimulationResult | null>(null)
  const [simulating, setSimulating] = useState(false)
  const [simulationError, setSimulationError] = useState<string | null>(null)

  // Manuel subvention overrides — Symfony has 3 checkboxes + 3 inputs that
  // override the auto-computed CEE prime, ANAH prime and discount.
  const [anaPrimeCheck, setAnaPrimeCheck] = useState(false)
  const [ceePrimeCheck, setCeePrimeCheck] = useState(false)
  const [discountCheck, setDiscountCheck] = useState(false)
  const [anaPrimeManual, setAnaPrimeManual] = useState<number>(0)
  const [ceePrimeManual, setCeePrimeManual] = useState<number>(0)
  const [discountManual, setDiscountManual] = useState<number>(0)

  const itemLookup = useMemo<Record<number, ItemLookup>>(() => {
    if (!form) return {}

    const lookup: Record<number, ItemLookup> = {}
    form.product_categories.forEach(category => {
      category.items.forEach(item => {
        lookup[item.id] = { item, productId: category.id }
      })
    })

    return lookup
  }, [form])

  const resetState = () => {
    setForm(null)
    setError(null)
    setDatedAt('')
    setSubventionTypeId(null)
    setSelectedSelectorId(null)
    setVisibleCategories(new Set())
    setCheckedItems(new Set())
    setItemQuantities({})
    setItemPrices({})
    setSimulation(null)
    setSimulating(false)
    setSimulationError(null)
    setAnaPrimeCheck(false)
    setCeePrimeCheck(false)
    setDiscountCheck(false)
    setAnaPrimeManual(0)
    setCeePrimeManual(0)
    setDiscountManual(0)
  }

  useEffect(() => {
    if (!open || parentId == null) return

    let active = true

    setLoading(true)
    setError(null)
    setSimulation(null)

    const formPromise = isMeeting
      ? iso3QuotationService.getNewFormForMeeting(parentId, mode)
      : iso3QuotationService.getNewForm(parentId, mode)

    formPromise
      .then(response => {
        if (!active) return

        const data = response.data

        setForm(data)
        setDatedAt(data.defaults.dated_at ?? '')
        setSubventionTypeId(data.defaults.subvention_type_id ?? null)

        const initialQuantities: Record<number, number> = {}
        const initialPrices: Record<number, number> = {}
        const initialChecked = new Set<number>()
        const initialVisible = new Set<number>()

        data.product_categories.forEach(category => {
          category.items.forEach(item => {
            initialQuantities[item.id] = item.default_quantity || 1
            initialPrices[item.id] = item.default_price || 0
            if (item.is_default_checked) {
              initialChecked.add(item.id)
              initialVisible.add(category.id)
            }
          })
        })

        setItemQuantities(initialQuantities)
        setItemPrices(initialPrices)
        setCheckedItems(initialChecked)
        setVisibleCategories(initialVisible)
      })
      .catch(() => {
        if (active) setError('Impossible de charger le formulaire de devis')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [parentId, isMeeting, mode, open])

  useEffect(() => {
    if (!open) resetState()
  }, [open])

  const handleSelectorChange = (rawValue: number | null) => {
    setSelectedSelectorId(rawValue)

    if (rawValue === null || !form) {
      setVisibleCategories(new Set())
      setCheckedItems(new Set())
      return
    }

    const option = form.product_selector_options.find(opt => opt.id === rawValue)
    if (!option) {
      setVisibleCategories(new Set())
      setCheckedItems(new Set())
      return
    }

    const newVisible = new Set<number>([option.product_id])
    const newChecked = new Set<number>([option.id])

    option.sub_items.forEach(sub => {
      if (!sub.is_default) return

      newChecked.add(sub.id)
      const subItem = itemLookup[sub.id]
      if (subItem) newVisible.add(subItem.productId)
    })

    setVisibleCategories(newVisible)
    setCheckedItems(newChecked)
  }

  const toggleItem = (itemId: number, checked: boolean) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (checked) next.add(itemId)
      else next.delete(itemId)
      return next
    })
  }

  const updateQuantity = (itemId: number, value: number) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: value }))
  }

  const updatePrice = (itemId: number, value: number) => {
    setItemPrices(prev => ({ ...prev, [itemId]: value }))
  }

  const itemsPayload = useMemo(() => {
    return Array.from(checkedItems).map(itemId => ({
      item_id: itemId,
      quantity: itemQuantities[itemId] ?? 1,
      price: itemPrices[itemId] ?? 0,
      name: itemLookup[itemId]?.item.name,
    }))
  }, [checkedItems, itemQuantities, itemPrices, itemLookup])

  const manualOverridesPayload = useMemo(() => ({
    ana_prime_check: anaPrimeCheck,
    cee_prime_check: ceePrimeCheck,
    discount_check: discountCheck,
    ana_prime: anaPrimeManual,
    cee_prime: ceePrimeManual,
    discount_amount: discountManual,
  }), [anaPrimeCheck, ceePrimeCheck, discountCheck, anaPrimeManual, ceePrimeManual, discountManual])

  const simulationKey = useMemo(
    () => JSON.stringify({ items: itemsPayload, datedAt, subventionTypeId, ...manualOverridesPayload }),
    [itemsPayload, datedAt, subventionTypeId, manualOverridesPayload]
  )

  const lastSimulationRef = useRef<string>('')

  useEffect(() => {
    if (parentId == null || !open || itemsPayload.length === 0) {
      setSimulation(null)
      return
    }

    if (lastSimulationRef.current === simulationKey) return

    const handle = setTimeout(async () => {
      lastSimulationRef.current = simulationKey
      setSimulating(true)
      setSimulationError(null)

      try {
        const payload = {
          dated_at: datedAt || undefined,
          subvention_type_id: subventionTypeId ?? undefined,
          items: itemsPayload,
          ...manualOverridesPayload,
        }
        const response = isMeeting
          ? await iso3QuotationService.simulateForMeeting(parentId, payload)
          : await iso3QuotationService.simulateForContract(parentId, payload)
        setSimulation(response.data)
      } catch {
        setSimulationError('Impossible de simuler le devis')
        setSimulation(null)
      } finally {
        setSimulating(false)
      }
    }, 400)

    return () => clearTimeout(handle)
  }, [parentId, isMeeting, open, simulationKey, itemsPayload, datedAt, subventionTypeId, manualOverridesPayload])

  const subventionRequired = form?.permissions?.can_set_subvention_type ?? true
  const canSave = checkedItems.size > 0
    && (!subventionRequired || subventionTypeId !== null)
    && !saving

  const handleSave = async () => {
    if (parentId == null || !canSave) return

    setSaving(true)
    setError(null)

    try {
      const payload = {
        dated_at: datedAt || undefined,
        subvention_type_id: subventionTypeId ?? undefined,
        items: itemsPayload,
        ...manualOverridesPayload,
      }
      const response = isMeeting
        ? await iso3QuotationService.createQuotationForMeeting(parentId, payload)
        : await iso3QuotationService.createQuotationForContract(parentId, payload)

      onCreated?.(response.data)
      onClose()
    } catch {
      setError('Impossible de créer le devis')
    } finally {
      setSaving(false)
    }
  }

  const polluterLabel = useMemo(() => {
    if (!form) return ''
    const commercial = form.polluter.commercial ?? form.polluter.name ?? ''
    const type = form.polluter.type ? ` ${form.polluter.type}` : ''
    return commercial ? `${commercial}${type}` : type.trim()
  }, [form])

  const visibleCategoriesList = useMemo(() => {
    if (!form) return []
    return form.product_categories.filter(cat => visibleCategories.has(cat.id))
  }, [form, visibleCategories])

  // Symfony hides every item by default and shows only the selected master + its
  // sub_items (data-json) when the dropdown changes. Reproduce the same filter so
  // the table doesn't render the entire catalog of the visible category.
  const visibleItemIds = useMemo(() => {
    const ids = new Set<number>()
    if (selectedSelectorId === null || !form) return ids

    const option = form.product_selector_options.find(opt => opt.id === selectedSelectorId)
    if (!option) return ids

    ids.add(option.id)
    option.sub_items.forEach(sub => ids.add(sub.id))
    return ids
  }, [selectedSelectorId, form])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='lg'>
      <DialogTitle>
        {form ? `Nouveau devis ${form.polluter.type} — ${polluterLabel}` : 'Nouveau devis'}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : null}

        {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}

        {!loading && form ? (
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap='wrap'>
              {form.permissions.can_set_dated_at ? (
                <TextField
                  label='Date *'
                  size='small'
                  type='date'
                  value={datedAt}
                  onChange={e => setDatedAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ minWidth: 160 }}
                />
              ) : null}
              {form.permissions.can_set_subvention_type ? (
                <FormControl size='small' sx={{ minWidth: 220 }}>
                  <InputLabel id='subvention-type-label'>Type de subvention *</InputLabel>
                  <Select
                    labelId='subvention-type-label'
                    label='Type de subvention *'
                    value={subventionTypeId ?? ''}
                    onChange={e => setSubventionTypeId(e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <MenuItem value=''>—</MenuItem>
                    {form.subvention_types.map(type => (
                      <MenuItem key={type.id} value={type.id}>{type.value}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : null}
              <FormControl size='small' sx={{ minWidth: 320 }}>
                <InputLabel id='product-selector-label'>Choisissez le produit</InputLabel>
                <Select
                  labelId='product-selector-label'
                  label='Choisissez le produit'
                  value={selectedSelectorId ?? ''}
                  onChange={e => handleSelectorChange(e.target.value === '' ? null : Number(e.target.value))}
                >
                  <MenuItem value=''>—</MenuItem>
                  {form.product_selector_options.map(option => (
                    <MenuItem key={option.id} value={option.id}>{option.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Divider />

            {form.product_categories.length === 0 ? (
              <Alert severity='warning'>
                Aucun produit n&apos;est configuré pour ce polluter. Configurez-les depuis l&apos;administration polluter.
              </Alert>
            ) : visibleCategoriesList.length === 0 ? (
              <Alert severity='info'>
                Choisissez un produit dans le menu déroulant ci-dessus pour afficher les articles.
              </Alert>
            ) : null}

            {visibleCategoriesList.map(category => (
              <Paper
                key={category.id}
                variant='outlined'
                sx={{ p: 2 }}
              >
                <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }}>
                  {category.reference ? `${category.reference} — ` : ''}{category.title}
                </Typography>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell padding='checkbox' />
                      <TableCell>Article</TableCell>
                      <TableCell align='right'>Quantité</TableCell>
                      <TableCell align='right'>Prix unitaire</TableCell>
                      <TableCell align='right'>Total HT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {category.items.filter(item => visibleItemIds.has(item.id)).map(item => {
                      const checked = checkedItems.has(item.id)
                      const qty = itemQuantities[item.id] ?? 1
                      const price = itemPrices[item.id] ?? item.default_price
                      const total = checked ? qty * price : 0

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell padding='checkbox'>
                            <Checkbox
                              checked={checked}
                              onChange={(_, c) => toggleItem(item.id, c)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant='body2'>
                              {item.name}{item.is_parent ? ' ⭐' : ''}
                            </Typography>
                            {item.description ? (
                              <Typography variant='caption' color='text.secondary'>
                                {item.description}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell align='right'>
                            <TextField
                              size='small'
                              type='number'
                              value={qty}
                              onChange={e => updateQuantity(item.id, Number(e.target.value))}
                              inputProps={{ min: 0, step: '0.01' }}
                              sx={{ width: 100 }}
                              disabled={!checked}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <TextField
                              size='small'
                              type='number'
                              value={price}
                              onChange={e => updatePrice(item.id, Number(e.target.value))}
                              inputProps={{ min: 0, step: '0.01' }}
                              sx={{ width: 110 }}
                              disabled={!checked}
                            />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2'>
                              {checked ? formatCurrency(total) : '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </Paper>
            ))}

            <Divider />

            {/* Calcul Subvention — Symfony 4-bloc layout (Total / Manuel / Automatic / Reste à charge) */}
            <Stack spacing={1.5}>
              <Stack direction='row' spacing={2} alignItems='center'>
                <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>Calcul Subvention</Typography>
                {simulating ? <CircularProgress size={16} /> : null}
                {simulationError ? (
                  <Typography variant='caption' color='error'>{simulationError}</Typography>
                ) : null}
              </Stack>

              {!simulation ? (
                <Typography variant='body2' color='text.secondary'>
                  Sélectionnez au moins un article pour voir les calculs.
                </Typography>
              ) : (
                <>
                  {/* Bloc 1 — Total */}
                  <Paper variant='outlined' sx={{ p: 1.5 }}>
                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>Total</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Total HT</Typography>
                        <Typography variant='body1'>{formatCurrency(simulation.total_without_tax)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Total TTC</Typography>
                        <Typography variant='body1' sx={{ fontWeight: 600 }}>
                          {formatCurrency(simulation.total_with_tax)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Bloc 2 — Manuel subvention (overrides) */}
                  <Paper variant='outlined' sx={{ p: 1.5 }}>
                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>Manuel subvention</Typography>
                    <Stack spacing={1}>
                      <Stack direction='row' spacing={1.5} alignItems='center'>
                        <Checkbox
                          checked={anaPrimeCheck}
                          onChange={(_, c) => setAnaPrimeCheck(c)}
                          size='small'
                          sx={{ p: 0 }}
                        />
                        <Typography variant='body2' sx={{ minWidth: 110 }}>ANAH Prime</Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={anaPrimeManual}
                          onChange={e => setAnaPrimeManual(Number(e.target.value))}
                          disabled={!anaPrimeCheck}
                          inputProps={{ min: 0, step: '0.01' }}
                          sx={{ width: 140 }}
                        />
                      </Stack>
                      <Stack direction='row' spacing={1.5} alignItems='center'>
                        <Checkbox
                          checked={ceePrimeCheck}
                          onChange={(_, c) => setCeePrimeCheck(c)}
                          size='small'
                          sx={{ p: 0 }}
                        />
                        <Typography variant='body2' sx={{ minWidth: 110 }}>Prime CEE</Typography>
                        <TextField
                          size='small'
                          type='number'
                          value={ceePrimeManual}
                          onChange={e => setCeePrimeManual(Number(e.target.value))}
                          disabled={!ceePrimeCheck}
                          inputProps={{ min: 0, step: '0.01' }}
                          sx={{ width: 140 }}
                        />
                      </Stack>
                      {form.permissions.can_set_discount_amount ? (
                        <Stack direction='row' spacing={1.5} alignItems='center'>
                          <Checkbox
                            checked={discountCheck}
                            onChange={(_, c) => setDiscountCheck(c)}
                            size='small'
                            sx={{ p: 0 }}
                          />
                          <Typography variant='body2' sx={{ minWidth: 110 }}>Remise</Typography>
                          <TextField
                            size='small'
                            type='number'
                            value={discountManual}
                            onChange={e => setDiscountManual(Number(e.target.value))}
                            disabled={!discountCheck}
                            inputProps={{ min: 0, step: '0.01' }}
                            sx={{ width: 140 }}
                          />
                        </Stack>
                      ) : null}
                    </Stack>
                  </Paper>

                  {/* Bloc 3 — Automatic subvention (info, lecture seule) */}
                  <Paper variant='outlined' sx={{ p: 1.5 }}>
                    <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>Automatic subvention</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Prime CEE TTC</Typography>
                        <Typography variant='body1'>{formatCurrency(simulation.cee_prime_auto)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Prime ANA TTC</Typography>
                        <Typography variant='body1'>{formatCurrency(simulation.ana_prime_auto)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant='caption' color='text.secondary'>Remise</Typography>
                        <Typography variant='body1'>{formatCurrency(simulation.discount_auto)}</Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Bloc 4 — Reste à charge (mis en avant en vert comme la TableGreenResult Symfony) */}
                  <Paper variant='outlined' sx={{ p: 1.5, bgcolor: 'success.50', borderColor: 'success.main' }}>
                    <Stack direction='row' spacing={2} alignItems='center' justifyContent='space-between'>
                      <Typography variant='subtitle1' sx={{ fontWeight: 700 }}>Reste à charge</Typography>
                      <Typography variant='h6' sx={{ fontWeight: 700, color: 'success.dark' }}>
                        {formatCurrency(simulation.rest_in_charge)}
                      </Typography>
                    </Stack>
                  </Paper>
                </>
              )}
            </Stack>
          </Stack>
        ) : null}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Annuler</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={!canSave}
          startIcon={saving ? <CircularProgress size={14} /> : null}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
