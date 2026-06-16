'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'

import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface Props {
  title: string
  polluterId: number
  polluterName: string
  onBack: () => void
}

export default function PolluterSubSectionStub({ title, polluterId, polluterName, onBack }: Props) {
  const t = useConfigTranslations()

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Button variant='outlined' size='small' onClick={onBack}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.isoPolluterSubBack}
        </Button>
        <Typography variant='h6' sx={{ ml: 1 }}>
          {title} — {polluterName}
        </Typography>
      </Box>

      <Alert severity='info' sx={{ mb: 2 }}>
        {t.isoPolluterSubMigrating}
        <br />
        <Typography variant='caption' component='span' sx={{ fontFamily: 'monospace' }}>
          polluterId={polluterId}
        </Typography>
      </Alert>
    </Box>
  )
}
