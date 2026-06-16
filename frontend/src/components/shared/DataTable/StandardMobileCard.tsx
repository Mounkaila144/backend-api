'use client'

// MUI Imports
import type { ReactNode } from 'react'

import Card from '@mui/material/Card'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'

// Types
import type { CardAction, CardField } from './types'

interface StandardMobileCardProps<TData> {

  // Header
  title: string | ReactNode
  subtitle?: string | ReactNode
  avatar?: ReactNode
  status?: {
    label: string
    color: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  }

  // Fields to display
  fields: CardField[]

  // Actions
  actions?: CardAction<TData>[]
  item?: TData
}

/**
 * Standard Mobile Card Component
 * Provides a consistent card layout for mobile views
 */
export function StandardMobileCard<TData>({
  title,
  subtitle,
  avatar,
  status,
  fields,
  actions = [],
  item
}: StandardMobileCardProps<TData>) {
  return (
    <Card className='mb-4' sx={{ border: '1px solid', borderColor: 'divider' }}>
      <Box className='p-4'>
        {/* Header with Avatar, Title and Status */}
        <Box className='flex items-start gap-3 mb-3'>
          {avatar && <Box>{avatar}</Box>}
          <Box className='flex-1'>
            {typeof title === 'string' ? (
              <Typography variant='h6' className='font-semibold'>
                {title}
              </Typography>
            ) : (
              title
            )}
            {subtitle && (
              <Typography variant='body2' color='text.secondary'>
                {subtitle}
              </Typography>
            )}
          </Box>
          {status && (
            <Chip variant='tonal' label={status.label} size='small' color={status.color} />
          )}
        </Box>

        {fields.length > 0 && (
          <>
            <Divider className='my-3' />

            {/* Fields */}
            <Box className='space-y-2'>
              {fields
                .filter(field => !field.hidden)
                .map((field, index) => (
                  <Box
                    key={index}
                    className='flex items-center gap-2'
                    onClick={field.onClick}
                    sx={{ cursor: field.onClick ? 'pointer' : 'default' }}
                  >
                    {field.icon && <i className={`${field.icon} text-textSecondary`} />}
                    {field.label && (
                      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 80 }}>
                        {field.label}:
                      </Typography>
                    )}
                    {typeof field.value === 'string' ? (
                      <Typography variant='body2' sx={{ color: field.color }}>
                        {field.value}
                      </Typography>
                    ) : (
                      field.value
                    )}
                  </Box>
                ))}
            </Box>
          </>
        )}

        {actions.length > 0 && (
          <>
            <Divider className='my-3' />

            {/* Action Buttons */}
            <Box className='flex justify-end gap-2'>
              {actions.map((action, index) => (
                <IconButton
                  key={index}
                  size='small'
                  color={action.color || 'default'}
                  onClick={() => item && action.onClick(item)}
                >
                  <i className={action.icon} />
                </IconButton>
              ))}
            </Box>
          </>
        )}
      </Box>
    </Card>
  )
}

export default StandardMobileCard
