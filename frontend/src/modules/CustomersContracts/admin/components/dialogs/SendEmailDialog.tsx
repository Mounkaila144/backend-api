'use client'

import { useState, useCallback } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Stack from '@mui/material/Stack'

import { contractsService } from '../../services/contractsService'
import type { ContractTranslations } from '../../hooks/useContractTranslations'

interface SendEmailDialogProps {
  open: boolean
  contractId: number | null
  onClose: () => void
  onSuccess: () => void
  showNotification: (message: string, severity: 'success' | 'error' | 'warning' | 'info') => void
  t: ContractTranslations
}

export default function SendEmailDialog({ open, contractId, onClose, onSuccess, showNotification, t }: SendEmailDialogProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = useCallback(async () => {
    if (!contractId || !subject.trim() || !body.trim()) return

    setSending(true)

    try {
      await contractsService.sendEmail(contractId, { subject: subject.trim(), body: body.trim() })
      setSubject('')
      setBody('')
      onSuccess()
      onClose()
      showNotification(t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.actionError + errorMessage, 'error')
    } finally {
      setSending(false)
    }
  }, [contractId, subject, body, onSuccess, onClose, showNotification, t.actionError, t.actionSuccess])

  const handleClose = useCallback(() => {
    if (sending) return

    setSubject('')
    setBody('')
    onClose()
  }, [sending, onClose])

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{t.emailDialogTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            label={t.emailSubjectLabel}
            placeholder={t.emailSubjectPlaceholder}
            fullWidth
            value={subject}
            onChange={e => setSubject(e.target.value)}
            disabled={sending}
          />
          <TextField
            label={t.emailBodyLabel}
            placeholder={t.emailBodyPlaceholder}
            fullWidth
            multiline
            rows={5}
            value={body}
            onChange={e => setBody(e.target.value)}
            disabled={sending}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={sending}>{t.dialogClose}</Button>
        <Button
          onClick={handleSend}
          variant='contained'
          disabled={sending || !subject.trim() || !body.trim()}
        >
          {sending ? t.emailSending : t.emailSend}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
