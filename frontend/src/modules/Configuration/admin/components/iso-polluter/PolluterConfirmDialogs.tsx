'use client'

import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

import type { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import type { PolluterItem } from './types'

type ConfigTranslations = ReturnType<typeof useConfigTranslations>

interface PolluterConfirmDialogsProps {
  // Delete (soft)
  deletingItem: PolluterItem | null
  deleting: boolean
  onConfirmDelete: () => void
  onCloseDelete: () => void
  // Remove (hard)
  removingItem: PolluterItem | null
  removing: boolean
  onConfirmRemove: () => void
  onCloseRemove: () => void
  // Import
  importDialogOpen: boolean
  importFile: File | null
  importing: boolean
  onConfirmImport: () => void
  onCloseImport: () => void
  onSelectImportFile: (file: File | null) => void
  t: ConfigTranslations
}

export default function PolluterConfirmDialogs({
  deletingItem,
  deleting,
  onConfirmDelete,
  onCloseDelete,
  removingItem,
  removing,
  onConfirmRemove,
  onCloseRemove,
  importDialogOpen,
  importFile,
  importing,
  onConfirmImport,
  onCloseImport,
  onSelectImportFile,
  t,
}: PolluterConfirmDialogsProps) {
  return (
    <>
      {/* ─── Delete (soft) Dialog ────────────────────────────────────────── */}
      <Dialog open={!!deletingItem} onClose={onCloseDelete} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoPolluterDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoPolluterDeleteSoftConfirm}</Typography>
          {deletingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>{deletingItem.name}</Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDelete} disabled={deleting}>{t.cancel}</Button>
          <Button variant='contained' color='warning' onClick={onConfirmDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={20} /> : t.statusCrudDelete}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Remove (hard) Dialog ────────────────────────────────────────── */}
      <Dialog open={!!removingItem} onClose={onCloseRemove} maxWidth='xs' fullWidth>
        <DialogTitle>{t.isoPolluterRemove}</DialogTitle>
        <DialogContent>
          <Typography>{t.isoPolluterRemoveConfirm}</Typography>
          {removingItem ? (
            <Typography variant='body2' sx={{ mt: 1, fontWeight: 'bold' }}>{removingItem.name}</Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseRemove} disabled={removing}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={onConfirmRemove} disabled={removing}>
            {removing ? <CircularProgress size={20} /> : t.isoPolluterRemove}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Import Dialog ───────────────────────────────────────────────── */}
      <Dialog open={importDialogOpen} onClose={onCloseImport} maxWidth='sm' fullWidth>
        <DialogTitle>{t.isoPolluterImport}</DialogTitle>
        <DialogContent>
          <Typography variant='body2' sx={{ mb: 2 }}>{t.isoPolluterImportFile}</Typography>
          <input
            type='file'
            accept='.csv,text/csv'
            onChange={e => onSelectImportFile(e.target.files?.[0] ?? null)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseImport} disabled={importing}>
            {t.cancel}
          </Button>
          <Button variant='contained' onClick={onConfirmImport} disabled={importing || !importFile}>
            {importing ? <CircularProgress size={20} /> : t.isoPolluterImportRun}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
