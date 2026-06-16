'use client'

import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import type { YousignEvidenceSignatureStatus } from '../../types'

interface Props {
  status: YousignEvidenceSignatureStatus | null
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null

  const d = new Date(iso)

  if (isNaN(d.getTime())) return iso

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

export default function SignatureStatusBadge({ status }: Props) {
  if (!status || !status.has_signature) {
    return <Chip size='small' label='—' variant='outlined' sx={{ minWidth: 90 }} />
  }

  if (status.is_signed) {
    const signedAt = formatDate(status.signed_at)

    return (
      <Tooltip title={signedAt ? `Signé le ${signedAt}` : 'Signé'}>
        <Chip
          size='small'
          color='success'
          icon={<i className='ri-check-double-line' style={{ fontSize: 14 }} />}
          label={signedAt ? `Signé ${signedAt}` : 'Signé'}
          sx={{ minWidth: 90 }}
        />
      </Tooltip>
    )
  }

  // Not signed yet — surface the remote state if we have it
  const stateLabel = status.state || status.status || 'En attente'

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Chip
        size='small'
        color='warning'
        variant='outlined'
        icon={<i className='ri-time-line' style={{ fontSize: 14 }} />}
        label={stateLabel}
        sx={{ minWidth: 90 }}
      />
      {status.signer?.email ? (
        <Tooltip title={`Signataire : ${status.signer.email}`}>
          <Typography variant='caption' color='text.secondary' sx={{ ml: 0.5 }}>
            <i className='ri-mail-line' />
          </Typography>
        </Tooltip>
      ) : null}
    </Box>
  )
}
