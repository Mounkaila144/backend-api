'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

import { yousignEvidenceService } from '../services/yousignEvidenceService'
import type { YousignEvidenceSignatureStatus } from '../../types'

import SignatureStatusBadge from './SignatureStatusBadge'

interface Props {
  billingId: number | null
  reference?: string | null
}

export default function BillingSignatureSection({ billingId, reference }: Props) {
  const { hasCredential } = usePermissions()
  const [status, setStatus] = useState<YousignEvidenceSignatureStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)

  const canView = hasCredential([
    ['superadmin', 'app_domoprime_contract_view_document_yousign_evidence_signature'],
  ])

  useEffect(() => {
    if (!billingId || !canView) {
      setStatus(null)

      return
    }

    let cancelled = false

    setLoading(true)

    yousignEvidenceService
      .getBillingSignatureStatus(billingId)
      .then(res => {
        if (!cancelled) setStatus(res.data)
      })
      .catch(() => {
        if (!cancelled) setStatus(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [billingId, canView])

  if (!canView || !billingId) {
    return null
  }

  const handleDownload = async () => {
    if (!billingId) return
    setDownloading(true)

    try {
      const blob = await yousignEvidenceService.downloadSignedBillingPdf(billingId)
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore
    } finally {
      setDownloading(false)
    }
  }

  const handleSend = async () => {
    if (!billingId) return
    setSending(true)

    try {
      await yousignEvidenceService.sendBillingForSignature(billingId)
    } catch {
      // 501 expected until Phase C wired
    } finally {
      setSending(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.5,
        px: 1,
        borderRadius: 1,
        flexWrap: 'wrap',
      }}
      data-testid='billing-signature-section'
    >
      <Tooltip title='Yousign Evidence'>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
          <i
            className='ri-quill-pen-line'
            style={{ fontSize: 16, color: status?.is_signed ? '#2e7d32' : '#1976d2' }}
          />
          <Typography variant='caption' color='text.secondary'>
            Yousign
          </Typography>
        </Box>
      </Tooltip>

      {loading ? (
        <CircularProgress size={14} />
      ) : (
        <SignatureStatusBadge status={status} />
      )}

      {reference ? (
        <Typography variant='caption' color='text.secondary'>
          {reference}
        </Typography>
      ) : null}

      {status?.is_signed ? (
        <Tooltip title='Télécharger la facture signée'>
          <span>
            <IconButton
              size='small'
              color='success'
              disabled={downloading}
              onClick={handleDownload}
            >
              {downloading
                ? <CircularProgress size={14} />
                : <i className='ri-download-2-line' style={{ fontSize: 16 }} />}
            </IconButton>
          </span>
        </Tooltip>
      ) : (
        <Tooltip title="Envoyer pour signature (Phase C — pas encore actif)">
          <span>
            <IconButton size='small' color='primary' disabled={sending} onClick={handleSend}>
              {sending
                ? <CircularProgress size={14} />
                : <i className='ri-send-plane-line' style={{ fontSize: 16 }} />}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Box>
  )
}
