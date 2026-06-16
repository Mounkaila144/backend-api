'use client'

import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import IsoI18nCrud, { type IsoI18nItem, type RowAction } from '../IsoI18nCrud'

interface Props {
  title: string
}

export default function IsoEnergyCrud({ title }: Props) {
  const t = useConfigTranslations()
  const [affecting, setAffecting] = useState<IsoI18nItem | null>(null)

  const rowActions: RowAction[] = [
    {
      key: 'affect',
      label: t.isoI18nAffectToContract,
      iconClass: 'ri-refresh-line',
      onClick: item => setAffecting(item),
    },
  ]

  return (
    <>
      <IsoI18nCrud
        apiType='energies'
        title={title}
        extraRowActions={rowActions}
      />

      {/* AffectToContract — stub, theme32a wires this to /app_domoprime_iso_ajax/AffectToContract */}
      <Dialog open={!!affecting} onClose={() => setAffecting(null)} maxWidth='sm' fullWidth>
        <DialogTitle>{t.isoI18nAffectToContract}</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>{t.isoI18nAffectStub}</Alert>
          {affecting ? (
            <Typography variant='body2'>
              <strong>{affecting.name}</strong> ({affecting.value || '—'})
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAffecting(null)}>{t.cancel}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
