'use client'

import { useState, useCallback } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'

import { contractsService } from '../../services/contractsService'
import type { ContractTranslations } from '../../hooks/useContractTranslations'

interface SendSmsDialogProps {
  open: boolean
  contractId: number | null
  onClose: () => void
  onSuccess: () => void
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void
  t: ContractTranslations
}

export default function SendSmsDialog({ open, contractId, onClose, onSuccess, showNotification, t }: SendSmsDialogProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async () => {
    if (!contractId || !message.trim()) return

    setSending(true)

    try {
      await contractsService.sendSms(contractId, { message: message.trim() })
      setMessage('')
      onSuccess()
      onClose()
      showNotification(t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.actionError + errorMessage, 'error')
    } finally {
      setSending(false)
    }
  }, [contractId, message, onSuccess, onClose, showNotification, t.actionError, t.actionSuccess])

  const handleClose = useCallback(() => {
    if (sending) return

    setMessage('')
    onClose()
  }, [sending, onClose])

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{t.smsDialogTitle}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin='dense'
          label={t.smsMessageLabel}
          placeholder={t.smsMessagePlaceholder}
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={sending}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={sending}>{t.dialogClose}</Button>
        <Button
          onClick={handleSend}
          variant='contained'
          disabled={sending || !message.trim()}
        >
          {sending ? t.smsSending : t.smsSend}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
