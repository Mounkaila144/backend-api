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
  quotationId: number | null
  reference?: string | null
}

/**
 * Inline signature status row for a quotation. Replaces the old disabled
 * Yousign Evidence placeholder icon. Reads the latest signature record from
 * the backend (Symfony-populated tables) and surfaces:
 *   - badge with state (signed / pending / —)
 *   - download button when signed
 *   - "send for signature" button (Phase C — currently 501 from backend)
 */
export default function QuotationSignatureSection({ quotationId, reference }: Props) {
  const { hasCredential } = usePermissions()
  const [status, setStatus] = useState<YousignEvidenceSignatureStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)

  const canView = hasCredential([
    ['superadmin', 'app_domoprime_contract_view_document_yousign_evidence_signature'],
  ])

  useEffect(() => {
    if (!quotationId || !canView) {
      setStatus(null)

      return
    }

    let cancelled = false

    setLoading(true)

    yousignEvidenceService
      .getQuotationSignatureStatus(quotationId)
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
  }, [quotationId, canView])

  if (!canView || !quotationId) {
    return null
  }

  const handleDownload = async () => {
    if (!quotationId) return
    setDownloading(true)

    try {
      const blob = await yousignEvidenceService.downloadSignedQuotationPdf(quotationId)
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      // ignore — backend returns 404/409 when not yet available
    } finally {
      setDownloading(false)
    }
  }

  const handleSend = async () => {
    if (!quotationId) return
    setSending(true)

    try {
      await yousignEvidenceService.sendQuotationForSignature(quotationId)
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
      data-testid='quotation-signature-section'
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
        <Tooltip title='Télécharger le PDF signé'>
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
