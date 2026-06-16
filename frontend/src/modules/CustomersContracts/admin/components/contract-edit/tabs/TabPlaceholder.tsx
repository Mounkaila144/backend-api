'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabPlaceholderProps {
  tabName: string
  icon: string
  t: ContractTranslations
}

export default function TabPlaceholder({ tabName, icon, t }: TabPlaceholderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        gap: 2,
        color: 'text.secondary',
      }}
    >
      <i className={icon} style={{ fontSize: 48, opacity: 0.4 }} />
      <Typography variant='h6'>{tabName}</Typography>
      <Typography variant='body2' color='text.disabled'>
        {t.editTabComingSoon}
      </Typography>
    </Box>
  )
}
