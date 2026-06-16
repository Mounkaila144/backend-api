'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'

import { iso3QuotationService } from '@/modules/AppDomoprimeISO3'
import type { DomoprimeQuotation, DomoprimeSubventionType } from '@/modules/AppDomoprime/types'

import type { EditQuotationViewTranslations } from './translations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ItemFormState {
  id: number
  itemId: number
  title: string
  quantity: string
  price: string
  checked: boolean
  productId: number
  productTitle: string
}

interface ManualSubventionState {
  anaPrimeCheck: boolean
  ceePrimeCheck: boolean
  discountCheck: boolean
  anaPrime: string
  ceePrime: string
  discount: string
}

interface EditQuotationViewProps {
  quotationId: number
  onSave: () => void
  onCancel: () => void
  t: EditQuotationViewTranslations
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '0.00'

  return Number(value).toFixed(2)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EditQuotationView({
  quotationId,
  onSave,
  onCancel,
  t,
}: EditQuotationViewProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [quotation, setQuotation] = useState<DomoprimeQuotation | null>(null)
  const [subventionTypes, setSubventionTypes] = useState<DomoprimeSubventionType[]>([])

  // Form fields
  const [datedAt, setDatedAt] = useState('')
  const [subventionTypeId, setSubventionTypeId] = useState<number | string>('')
  const [items, setItems] = useState<ItemFormState[]>([])

  const [manual, setManual] = useState<ManualSubventionState>({
    anaPrimeCheck: false,
    ceePrimeCheck: false,
    discountCheck: false,
    anaPrime: '0.00',
    ceePrime: '0.00',
    discount: '0.00',
  })

  // Group items by product for display
  const itemsByProduct = useMemo(() => {
    const map = new Map<number, { title: string; items: ItemFormState[] }>()

    for (const item of items) {
      if (!map.has(item.productId)) {
        map.set(item.productId, { title: item.productTitle, items: [] })
      }

      map.get(item.productId)!.items.push(item)
    }

    return Array.from(map.entries())
  }, [items])

  // Has at least one item checked (enable save button)
  const hasCheckedItems = items.some(i => i.checked)

  // ----------- Data fetching -----------

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [quotRes, typesRes] = await Promise.all([
        iso3QuotationService.show(quotationId),
        iso3QuotationService.listSubventionTypes(),
      ])

      const q = quotRes.data

      setQuotation(q)
      setSubventionTypes(typesRes.data)

      // Initialize form fields
      setDatedAt(q.dated_at ? q.dated_at.split('T')[0] : '')
      setSubventionTypeId(q.subvention_type_id ?? '')

      // Initialize manual subvention fields
      setManual({
        anaPrimeCheck: (q.ana_prime ?? 0) > 0,
        ceePrimeCheck: (q.prime ?? 0) > 0,
        discountCheck: (q.discount_amount ?? 0) > 0,
        anaPrime: formatCurrency(q.ana_prime),
        ceePrime: formatCurrency(q.prime),
        discount: formatCurrency(q.discount_amount),
      })

      // Build flat items list from products.items
      const flatItems: ItemFormState[] = []

      for (const product of q.products ?? []) {
        for (const item of product.items ?? []) {
          flatItems.push({
            id: item.id,
            itemId: item.item_id,
            title: item.title || item.entitled || '-',
            quantity: String(item.quantity ?? 1),
            price: formatCurrency(item.sale_price_without_tax),
            checked: true,
            productId: product.id,
            productTitle: product.title || product.entitled || '-',
          })
        }
      }

      setItems(flatItems)
    } catch {
      setError(t.docEditLoadError)
    } finally {
      setLoading(false)
    }
  }, [quotationId, t.docEditLoadError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ----------- Item handlers -----------

  const toggleItem = (itemId: number) => {
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, checked: !i.checked } : i)))
  }

  const updateItemField = (itemId: number, field: 'quantity' | 'price', value: string) => {
    setItems(prev => prev.map(i => (i.id === itemId ? { ...i, [field]: value } : i)))
  }

  // ----------- Save handler -----------

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const checkedItems = items
        .filter(i => i.checked)
        .map(i => ({
          id: i.id,
          quantity: parseFloat(i.quantity) || 1,
          sale_price_without_tax: parseFloat(i.price) || 0,
        }))

      await iso3QuotationService.updateQuotation(quotationId, {
        dated_at: datedAt || null,
        subvention_type_id: subventionTypeId || null,
        ana_prime: manual.anaPrimeCheck ? parseFloat(manual.anaPrime) || 0 : undefined,
        prime: manual.ceePrimeCheck ? parseFloat(manual.ceePrime) || 0 : undefined,
        discount_amount: manual.discountCheck ? parseFloat(manual.discount) || 0 : undefined,
        items: checkedItems,
      })

      onSave()
    } catch {
      setError(t.docEditSaveError)
    } finally {
      setSaving(false)
    }
  }

  // ----------- Render -----------

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={32} />
        <Typography variant='body2' sx={{ ml: 2 }}>
          {t.docEditLoading}
        </Typography>
      </Box>
    )
  }

  if (error && !quotation) {
    return <Alert severity='error' sx={{ mt: 2 }}>{error}</Alert>
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant='h6' sx={{ mb: 2 }}>
        {t.docEditTitle.replace('%s', quotation?.reference ?? '')}
      </Typography>

      {/* Save / Cancel buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant='contained'
          size='small'
          startIcon={saving ? <CircularProgress size={14} /> : <i className='ri-save-line' />}
          disabled={saving || !hasCheckedItems}
          onClick={handleSave}
        >
          {t.docEditSave}
        </Button>
        <Button
          variant='outlined'
          size='small'
          startIcon={<i className='ri-close-line' />}
          disabled={saving}
          onClick={onCancel}
        >
          {t.docEditCancel}
        </Button>
      </Box>

      {error ? <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert> : null}

      {/* Date + Subvention type fields */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          label={t.docEditDate}
          type='date'
          size='small'
          value={datedAt}
          onChange={e => setDatedAt(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ minWidth: 180 }}
        />
        <TextField
          label={t.docEditSubventionType}
          select
          size='small'
          value={subventionTypeId}
          onChange={e => setSubventionTypeId(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value=''>-</MenuItem>
          {subventionTypes.map(st => (
            <MenuItem key={st.id} value={st.id}>{st.name}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Product items tables */}
      {itemsByProduct.map(([productId, { title, items: productItems }]) => (
        <Box key={productId} sx={{ mb: 2 }}>
          <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 1, borderBottom: '1px solid', borderColor: 'divider', pb: 0.5 }}>
            {title}
          </Typography>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox' />
                  <TableCell>{t.docEditArticle}</TableCell>
                  <TableCell sx={{ width: 120 }}>{t.docEditQuantity}</TableCell>
                  <TableCell sx={{ width: 120 }}>{t.docEditPrice}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell padding='checkbox'>
                      <Checkbox
                        size='small'
                        checked={item.checked}
                        onChange={() => toggleItem(item.id)}
                      />
                    </TableCell>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        value={item.quantity}
                        onChange={e => updateItemField(item.id, 'quantity', e.target.value)}
                        slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                        sx={{ width: '100%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size='small'
                        type='number'
                        value={item.price}
                        onChange={e => updateItemField(item.id, 'price', e.target.value)}
                        slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                        sx={{ width: '100%' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      {items.length === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
          {t.docEditNoPolluter}
        </Typography>
      ) : null}

      <Divider sx={{ my: 2 }} />

      {/* Results section (read-only from quotation data) */}
      {quotation ? (
        <Box>
          <Typography variant='subtitle2' sx={{ fontWeight: 'bold', mb: 1 }}>
            {t.docEditResults}
          </Typography>

          {/* Totals */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5 }}>{t.docEditTotal}</Typography>
            <Box sx={{ display: 'flex', gap: 3, pl: 2 }}>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t.docEditTotalHT}</Typography>
                <TextField size='small' value={formatCurrency(quotation.total_sale_without_tax)} disabled sx={{ width: 140 }} />
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t.docEditTotalTTC}</Typography>
                <TextField size='small' value={formatCurrency(quotation.total_sale_with_tax)} disabled sx={{ width: 140 }} />
              </Box>
            </Box>
          </Box>

          {/* Automatic subventions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5 }}>{t.docEditAutoSubvention}</Typography>
            <Box sx={{ display: 'flex', gap: 3, pl: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t.docEditPrimeAnaTTC}</Typography>
                <TextField size='small' value={formatCurrency(quotation.ana_prime)} disabled sx={{ width: 140 }} />
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t.docEditPrimeCEETTC}</Typography>
                <TextField size='small' value={formatCurrency(quotation.ite_prime ?? quotation.prime)} disabled sx={{ width: 140 }} />
              </Box>
              <Box>
                <Typography variant='caption' color='text.secondary'>{t.docEditRemise}</Typography>
                <TextField size='small' value={formatCurrency(quotation.discount_amount)} disabled sx={{ width: 140 }} />
              </Box>
            </Box>
          </Box>

          {/* Manual subventions */}
          <Box sx={{ mb: 2 }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold', mb: 0.5 }}>{t.docEditManualSubvention}</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pl: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  size='small'
                  checked={manual.anaPrimeCheck}
                  onChange={e => setManual(prev => ({ ...prev, anaPrimeCheck: e.target.checked }))}
                />
                <Typography variant='body2' sx={{ width: 120 }}>{t.docEditPrimeANAH}</Typography>
                <TextField
                  size='small'
                  type='number'
                  value={manual.anaPrime}
                  onChange={e => setManual(prev => ({ ...prev, anaPrime: e.target.value }))}
                  disabled={!manual.anaPrimeCheck}
                  slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  sx={{ width: 140 }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  size='small'
                  checked={manual.ceePrimeCheck}
                  onChange={e => setManual(prev => ({ ...prev, ceePrimeCheck: e.target.checked }))}
                />
                <Typography variant='body2' sx={{ width: 120 }}>{t.docEditPrimeCEE}</Typography>
                <TextField
                  size='small'
                  type='number'
                  value={manual.ceePrime}
                  onChange={e => setManual(prev => ({ ...prev, ceePrime: e.target.value }))}
                  disabled={!manual.ceePrimeCheck}
                  slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  sx={{ width: 140 }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Checkbox
                  size='small'
                  checked={manual.discountCheck}
                  onChange={e => setManual(prev => ({ ...prev, discountCheck: e.target.checked }))}
                />
                <Typography variant='body2' sx={{ width: 120 }}>{t.docEditDiscount}</Typography>
                <TextField
                  size='small'
                  type='number'
                  value={manual.discount}
                  onChange={e => setManual(prev => ({ ...prev, discount: e.target.value }))}
                  disabled={!manual.discountCheck}
                  slotProps={{ htmlInput: { step: '0.01', min: '0' } }}
                  sx={{ width: 140 }}
                />
              </Box>
            </Box>
          </Box>

          {/* Rest in charge */}
          <Box sx={{ bgcolor: 'success.main', color: 'white', p: 1.5, borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='body2' sx={{ fontWeight: 'bold' }}>{t.docEditRestInCharge}</Typography>
            <Typography variant='body1' sx={{ fontWeight: 'bold' }}>
              {formatCurrency(quotation.rest_in_charge)} €
            </Typography>
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}
