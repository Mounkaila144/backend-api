'use client'

import { useState } from 'react'

import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'

import type { ContractTranslations } from '../../../../../hooks/useContractTranslations'

interface CreateBillingDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (options: { send_email: boolean; create_asset: boolean }) => void
  loading?: boolean
  t: ContractTranslations
}

export default function CreateBillingDialog({
  open,
  onClose,
  onConfirm,
  loading,
  t,
}: CreateBillingDialogProps) {
  const [sendEmail, setSendEmail] = useState(false)
  const [createAsset, setCreateAsset] = useState(false)

  const handleConfirm = () => {
    onConfirm({ send_email: sendEmail, create_asset: createAsset })
  }

  const handleClose = () => {
    setSendEmail(false)
    setCreateAsset(false)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>{t.docBillingDialogTitle}</DialogTitle>
      <DialogContent>
        <FormControlLabel
          control={
            <Checkbox
              checked={sendEmail}
              onChange={(_, checked) => setSendEmail(checked)}
            />
          }
          label={t.docBillingDialogSendEmail}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={createAsset}
              onChange={(_, checked) => setCreateAsset(checked)}
            />
          }
          label={t.docBillingDialogCreateAsset}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t.docBillingDialogCancel}
        </Button>
        <Button onClick={handleConfirm} variant='contained' disabled={loading}>
          {t.docBillingDialogConfirm}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
