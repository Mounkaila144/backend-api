'use client'

import { useCallback } from 'react'

// MUI Imports
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'

// Types
import type { ColumnConfig } from './types'

interface ColumnVisibilityMenuProps {
  anchor: HTMLElement | null
  onClose: () => void
  columns: ColumnConfig[]
  visibility: Record<string, boolean>
  onVisibilityChange: (visibility: Record<string, boolean>) => void
}

export function ColumnVisibilityMenu({
  anchor,
  onClose,
  columns,
  visibility,
  onVisibilityChange
}: ColumnVisibilityMenuProps) {
  const handleToggleColumn = useCallback(
    (columnId: string) => {
      onVisibilityChange({
        ...visibility,
        [columnId]: !visibility[columnId]
      })
    },
    [visibility, onVisibilityChange]
  )

  const handleShowAll = useCallback(() => {
    const allVisible: Record<string, boolean> = {}

    columns.forEach(col => {
      allVisible[col.id] = true
    })
    onVisibilityChange(allVisible)
  }, [columns, onVisibilityChange])

  const handleHideAll = useCallback(() => {
    const allHidden: Record<string, boolean> = {}

    columns.forEach(col => {
      allHidden[col.id] = false
    })
    onVisibilityChange(allHidden)
  }, [columns, onVisibilityChange])

  const handleReset = useCallback(() => {
    const defaultVisibility: Record<string, boolean> = {}

    columns.forEach(col => {
      defaultVisibility[col.id] = col.defaultVisible !== false
    })
    onVisibilityChange(defaultVisibility)
  }, [columns, onVisibilityChange])

  return (
    <Popover
      open={Boolean(anchor)}
      anchorEl={anchor}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left'
      }}
    >
      <div className='p-4' style={{ width: 300 }}>
        <div className='flex items-center justify-between mb-4'>
          <Typography variant='h6'>Show Columns</Typography>
          <IconButton size='small' onClick={onClose}>
            <i className='ri-close-line' />
          </IconButton>
        </div>
        <Divider className='mb-2' />
        <div className='flex gap-2 mb-4'>
          <Button size='small' onClick={handleShowAll} variant='outlined'>
            Show All
          </Button>
          <Button size='small' onClick={handleHideAll} variant='outlined'>
            Hide All
          </Button>
          <Button size='small' onClick={handleReset} variant='outlined'>
            Reset
          </Button>
        </div>
        <Divider className='mb-2' />
        <List dense className='max-h-96 overflow-y-auto'>
          {columns.map(column => (
            <ListItem key={column.id} disablePadding>
              <ListItemButton onClick={() => handleToggleColumn(column.id)}>
                <FormControlLabel
                  control={<Checkbox checked={visibility[column.id] !== false} />}
                  label={column.label}
                  className='w-full m-0'
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    </Popover>
  )
}

export default ColumnVisibilityMenu
