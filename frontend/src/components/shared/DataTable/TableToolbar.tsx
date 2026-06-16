'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'

// Components
import ColumnVisibilityMenu from './ColumnVisibilityMenu'

// Types
import type { DataTableAction, ColumnConfig } from './types'

interface TableToolbarProps {
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  onRefresh?: () => void
  loading?: boolean
  actions?: DataTableAction[]
  availableColumns?: ColumnConfig[]
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void
  showColumnFilters?: boolean
  onToggleColumnFilters?: () => void
  columnFilters?: Record<string, any>
  onClearAllFilters?: () => void
  title?: string
}

export function TableToolbar({
  searchPlaceholder = 'Search...',
  onSearch,
  onRefresh,
  loading = false,
  actions = [],
  availableColumns,
  columnVisibility,
  onColumnVisibilityChange,
  showColumnFilters = false,
  onToggleColumnFilters,
  columnFilters,
  onClearAllFilters,
  title
}: TableToolbarProps) {
  const [searchValue, setSearchValue] = useState('')
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Handle search with debounce and minimum 3 characters
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value)

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Debounce the search
      debounceTimerRef.current = setTimeout(() => {
        if (onSearch) {
          // Only search if at least 3 characters or empty (to clear search)
          if (value.length >= 3 || value.length === 0) {
            onSearch(value)
          }
        }
      }, 500)
    },
    [onSearch]
  )

  const handleOpenColumnMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setColumnMenuAnchor(event.currentTarget)
  }, [])

  const handleCloseColumnMenu = useCallback(() => {
    setColumnMenuAnchor(null)
  }, [])

  return (
    <>
      {title && (
        <>
          <CardHeader title={title} className='pbe-4' />
          <Divider />
        </>
      )}

      <div className='flex justify-between gap-4 p-5 flex-col items-stretch sm:flex-row sm:items-center'>
        {/* Left side - Action buttons */}
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          {actions
            .filter(action => !action.hidden)
            .map((action, index) => (
              <Button
                key={index}
                color={action.color || 'primary'}
                variant={action.variant || 'contained'}
                startIcon={<i className={action.icon} />}
                onClick={action.onClick}
                disabled={action.disabled || loading}
                className='w-full sm:w-auto'
              >
                {action.label}
              </Button>
            ))}

          {/* Column visibility and Filters buttons - hide on mobile */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {availableColumns && (
              <Button
                color='secondary'
                variant='outlined'
                startIcon={<i className='ri-settings-3-line' />}
                onClick={handleOpenColumnMenu}
                className='w-full sm:w-auto'
              >
                Columns
              </Button>
            )}
            {onToggleColumnFilters && (
              <Button
                color={showColumnFilters ? 'primary' : 'secondary'}
                variant={showColumnFilters ? 'contained' : 'outlined'}
                startIcon={<i className='ri-filter-3-line' />}
                onClick={onToggleColumnFilters}
                className='w-full sm:w-auto'
              >
                Filters {columnFilters && Object.keys(columnFilters).length > 0 && `(${Object.keys(columnFilters).length})`}
              </Button>
            )}
            {onClearAllFilters && columnFilters && Object.keys(columnFilters).length > 0 && (
              <Button
                color='error'
                variant='outlined'
                startIcon={<i className='ri-close-line' />}
                onClick={onClearAllFilters}
                className='w-full sm:w-auto'
                size='small'
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </div>

        {/* Right side - Search and Refresh */}
        <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto'>
          {onSearch && (
            <TextField
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              size='small'
              className='w-full sm:w-auto'
            />
          )}
          {onRefresh && (
            <Button
              variant='contained'
              startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='ri-refresh-line' />}
              onClick={onRefresh}
              disabled={loading}
              className='w-full sm:w-auto'
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          )}
        </div>
      </div>

      {/* Column Visibility Menu */}
      {availableColumns && columnVisibility && onColumnVisibilityChange && (
        <ColumnVisibilityMenu
          anchor={columnMenuAnchor}
          onClose={handleCloseColumnMenu}
          columns={availableColumns}
          visibility={columnVisibility}
          onVisibilityChange={onColumnVisibilityChange}
        />
      )}
    </>
  )
}

export default TableToolbar
