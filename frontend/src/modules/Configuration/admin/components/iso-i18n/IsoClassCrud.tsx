'use client'

import { useState, type ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'

import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import IsoI18nCrud, { type IsoI18nItem, type ExtraColumn, type RowAction, type HeaderAction } from '../IsoI18nCrud'

import ClassRegionPriceCrud from './ClassRegionPriceCrud'

// Class items have these extra numeric fields from t_domoprime_class
interface ClassItem extends IsoI18nItem {
  coef: number | string | null
  multiple: number | string | null
  multiple_floor: number | string | null
  multiple_top: number | string | null
  multiple_wall: number | string | null
  prime: number | string | null
  pack_prime: number | string | null
}

const fmt = (v: number | string | null | undefined) =>
  v === null || v === undefined || v === '' ? '—' : Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 6 })

interface Props {
  title: string
}

export default function IsoClassCrud({ title }: Props) {
  const t = useConfigTranslations()

  const [revenueFor, setRevenueFor] = useState<ClassItem | null>(null)
  const [cumacOpen, setCumacOpen] = useState(false)

  // ─── Sub-page: Revenue (region price for class) ──
  if (revenueFor) {
    return (
      <ClassRegionPriceCrud
        classId={revenueFor.id}
        className={revenueFor.value || revenueFor.name}
        onBack={() => setRevenueFor(null)}
      />
    )
  }

  // ─── Extra columns for the list ──
  const extraColumns: ExtraColumn<ClassItem>[] = [
    { key: 'coef',           label: t.isoClassCoef,          align: 'right', render: i => fmt(i.coef) },
    { key: 'multiple',       label: t.isoClassMultiple,      align: 'right', render: i => fmt(i.multiple) },
    { key: 'multiple_floor', label: t.isoClassMultipleFloor, align: 'right', render: i => fmt(i.multiple_floor) },
    { key: 'multiple_top',   label: t.isoClassMultipleTop,   align: 'right', render: i => fmt(i.multiple_top) },
    { key: 'multiple_wall',  label: t.isoClassMultipleWall,  align: 'right', render: i => fmt(i.multiple_wall) },
  ]

  // ─── Extra row action: Revenue (€) ──
  const rowActions: RowAction<ClassItem>[] = [
    {
      key: 'revenue',
      label: t.isoClassRevenue,
      iconClass: 'ri-money-euro-circle-line',
      onClick: item => setRevenueFor(item),
    },
  ]

  // ─── Extra header action: Cumac pricing (stub) ──
  const headerActions: HeaderAction[] = [
    {
      key: 'cumac',
      label: t.isoClassCumacPricing,
      iconClass: 'ri-money-euro-circle-line',
      variant: 'outlined',
      onClick: () => setCumacOpen(true),
    },
  ]

  // ─── Extra dialog fields ──
  const renderExtraFields = (
    formExtra: Record<string, string>,
    setFormExtra: (k: string, v: string) => void,
  ): ReactNode => {
    const numericField = (key: string, label: string) => (
      <Grid item xs={6} sm={4} key={key}>
        <TextField
          fullWidth type='number'
          label={label}
          value={formExtra[key] ?? ''}
          onChange={e => setFormExtra(key, e.target.value)}
          inputProps={{ step: 'any' }}
        />
      </Grid>
    )

    return (
      <>
        {numericField('coef', t.isoClassCoef)}
        {numericField('multiple', t.isoClassMultiple)}
        {numericField('multiple_floor', t.isoClassMultipleFloor)}
        {numericField('multiple_top', t.isoClassMultipleTop)}
        {numericField('multiple_wall', t.isoClassMultipleWall)}
        {numericField('prime', t.isoClassPrime)}
        {numericField('pack_prime', t.isoClassPackPrime)}
      </>
    )
  }

  const buildExtraFormData = (item: ClassItem | null): Record<string, string> => {
    const fields = ['coef', 'multiple', 'multiple_floor', 'multiple_top', 'multiple_wall', 'prime', 'pack_prime']
    const out: Record<string, string> = {}
    for (const f of fields) {
      const v = item ? (item as unknown as Record<string, number | string | null>)[f] : null
      out[f] = v === null || v === undefined ? '' : String(v)
    }
    return out
  }

  const buildExtraPayload = (formExtra: Record<string, string>): Record<string, unknown> => {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formExtra)) {
      if (v === '' || v === null || v === undefined) continue
      out[k] = Number(v)
    }
    return out
  }

  return (
    <>
      <IsoI18nCrud<ClassItem>
        apiType='classes'
        title={title}
        extraColumns={extraColumns}
        extraRowActions={rowActions}
        extraHeaderActions={headerActions}
        renderExtraDialogFields={renderExtraFields}
        buildExtraFormData={buildExtraFormData}
        buildExtraPayload={buildExtraPayload}
      />

      {/* CUMAC pricing — stub, theme32a wires this to /app_domoprime_iso2_ajax/ListPartialPrice */}
      <Dialog open={cumacOpen} onClose={() => setCumacOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{t.isoClassCumacPricing}</DialogTitle>
        <DialogContent>
          <Alert severity='info'>{t.isoClassCumacStub}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCumacOpen(false)}>{t.cancel}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
