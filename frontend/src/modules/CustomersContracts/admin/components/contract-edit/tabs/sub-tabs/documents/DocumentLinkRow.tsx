'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'

interface DocumentLinkRowProps {
  icon: string
  label: string
  available: boolean
  warning?: string
  loading?: boolean
  onClick?: () => void
  expandable?: boolean
  expanded?: boolean
  onToggle?: () => void
  children?: React.ReactNode
}

export default function DocumentLinkRow({
  icon,
  label,
  available,
  warning,
  loading: isLoading,
  onClick,
  expandable,
  expanded,
  onToggle,
  children,
}: DocumentLinkRowProps) {
  const handleClick = () => {
    if (expandable && onToggle) {
      onToggle()
    } else if (available && onClick) {
      onClick()
    }
  }

  const isClickable = (expandable && onToggle) || (available && onClick)

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          py: 1,
          px: 1,
          borderRadius: 1,
          cursor: isClickable ? 'pointer' : 'default',
          '&:hover': { backgroundColor: isClickable ? 'action.hover' : 'transparent' },
        }}
        onClick={handleClick}
      >
        {expandable ? (
          <i
            className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
            style={{ fontSize: 18 }}
          />
        ) : null}
        <i className={icon} style={{ fontSize: 18, opacity: available ? 1 : 0.4 }} />
        <Typography variant='body2' sx={{ flex: 1, opacity: available ? 1 : 0.5 }}>
          {label}
        </Typography>
        {warning ? (
          <Tooltip title={warning}>
            <i className='ri-error-warning-line' style={{ color: '#f44336', fontSize: 16 }} />
          </Tooltip>
        ) : null}
        {isLoading ? (
          <CircularProgress size={18} />
        ) : !expandable ? (
          <Chip
            label={available ? 'PDF' : '-'}
            size='small'
            variant='outlined'
            color={available ? 'primary' : 'default'}
            disabled={!available}
            sx={{ minWidth: 40 }}
          />
        ) : null}
      </Box>
      {expandable && children ? (
        <Collapse in={expanded}>
          <Box sx={{ pl: 4, pb: 1 }}>
            {children}
          </Box>
        </Collapse>
      ) : null}
    </>
  )
}
