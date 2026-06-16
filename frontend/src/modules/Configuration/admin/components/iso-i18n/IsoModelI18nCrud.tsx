'use client'

import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import IsoI18nCrud, { type IsoI18nItem, type ExtraColumn, type RowAction } from '../IsoI18nCrud'

// All model types share the same i18n base + an optional polluters[] populated by the controller.
interface ModelItem extends IsoI18nItem {
  polluters?: string[]
}

interface Props {
  apiType: 'quotation-models' | 'billing-models' | 'asset-models' | 'premeeting-models' | 'afterwork-models'
  title: string
  /** When true, show the Polluter(s) column populated by polluter_link_table on the backend. */
  withPolluterColumn?: boolean
  /** When true, show an Export CSV variables row action (Quotation only in theme32a). */
  withExportVariables?: boolean
}

export default function IsoModelI18nCrud({
  apiType,
  title,
  withPolluterColumn = false,
  withExportVariables = false,
}: Props) {
  const t = useConfigTranslations()
  const [exportingFor, setExportingFor] = useState<ModelItem | null>(null)

  const extraColumns: ExtraColumn<ModelItem>[] = []
  if (withPolluterColumn) {
    extraColumns.push({
      key: 'polluters',
      label: t.isoModelPolluterCol,
      render: item => {
        const list = item.polluters ?? []
        if (list.length === 0) return <span>{t.isoModelNoPolluter}</span>
        return (
          <Stack direction='row' flexWrap='wrap' useFlexGap spacing={0.5} sx={{ maxWidth: 280 }}>
            {list.map(name => (
              <Chip key={name} label={name} size='small' variant='outlined' />
            ))}
          </Stack>
        )
      },
    })
  }

  const rowActions: RowAction<ModelItem>[] = []
  if (withExportVariables) {
    rowActions.push({
      key: 'exportVariables',
      label: t.isoModelExportVariables,
      iconClass: 'ri-download-2-line',
      onClick: item => setExportingFor(item),
    })
  }

  return (
    <>
      <IsoI18nCrud<ModelItem>
        apiType={apiType}
        title={title}
        showId
        extraColumns={extraColumns}
        extraRowActions={rowActions}
      />

      {/* Export CSV variables — stub for Quotation theme32a action */}
      <Dialog open={!!exportingFor} onClose={() => setExportingFor(null)} maxWidth='sm' fullWidth>
        <DialogTitle>{t.isoModelExportVariables}</DialogTitle>
        <DialogContent>
          <Alert severity='info' sx={{ mb: 2 }}>{t.isoModelExportStub}</Alert>
          {exportingFor ? (
            <Typography variant='body2'>
              <strong>{exportingFor.name}</strong> ({exportingFor.value || '—'})
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportingFor(null)}>{t.cancel}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
