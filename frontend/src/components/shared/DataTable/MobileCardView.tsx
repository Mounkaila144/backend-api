'use client'

// MUI Imports
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Types
import type { MobileCardConfig } from './types'

interface MobileCardViewProps<TData> {
  data: TData[]
  loading?: boolean
  emptyMessage?: string
  config: MobileCardConfig<TData>
}

export function MobileCardView<TData>({
  data,
  loading = false,
  emptyMessage = 'No data available',
  config
}: MobileCardViewProps<TData>) {
  if (loading) {
    return (
      <Box className='flex justify-center items-center' sx={{ py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (data.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography>{emptyMessage}</Typography>
      </Box>
    )
  }

  return (
    <>
      {data.map((item, index) => (
        <Box key={index}>{config.renderCard(item)}</Box>
      ))}
    </>
  )
}

export default MobileCardView
