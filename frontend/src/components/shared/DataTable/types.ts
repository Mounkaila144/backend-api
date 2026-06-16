import type { ReactNode } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

/**
 * Generic DataTable Types
 * Reusable across all tables in the application
 */

// Base configuration for any data table
export interface DataTableConfig<TData> {

  // Column definitions using TanStack Table
  columns: ColumnDef<TData, any>[]

  // Data and loading state
  data: TData[]
  loading?: boolean

  // Pagination
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }

  // Callbacks
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRefresh?: () => void
  onRowDoubleClick?: (row: TData) => void

  // Search
  searchPlaceholder?: string
  onSearch?: (value: string) => void

  // Mobile card configuration
  mobileCard?: MobileCardConfig<TData>

  // Column visibility
  availableColumns?: ColumnConfig[]
  columnVisibility?: Record<string, boolean>
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void

  // Custom actions
  actions?: DataTableAction[]

  // Column Filters (inline filters in table headers)
  showColumnFilters?: boolean
  onToggleColumnFilters?: () => void
  columnFilters?: Record<string, any>
  onColumnFilterChange?: (columnId: string, value: any) => void
  onClearAllFilters?: () => void
  createColumnFilter?: (columnId: string) => ReactNode

  // Sticky columns (pinned left/right while the middle scrolls)
  stickyLeft?: string[]
  stickyRight?: string[]

  // Styling
  emptyMessage?: string
  rowsPerPageOptions?: number[]
}

// Column configuration for visibility menu
export interface ColumnConfig {
  id: string
  label: string
  defaultVisible?: boolean
}

// Mobile card configuration
export interface MobileCardConfig<TData> {

  // Function to render the card for each item
  renderCard: (item: TData, actions?: CardAction<TData>[]) => ReactNode
}

// Actions available in the card
export interface CardAction<TData> {
  label?: string
  icon: string
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  onClick: (item: TData) => void | Promise<void>
}

// Toolbar actions (Add, Export, etc.)
export interface DataTableAction {
  label: string
  icon: string
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  variant?: 'contained' | 'outlined' | 'text'
  onClick: () => void
  hidden?: boolean
  disabled?: boolean
}

// Filter configuration
export interface FilterConfig {
  id: string
  label: string
  type: 'text' | 'select' | 'date' | 'autocomplete'
  options?: FilterOption[]
  placeholder?: string
}

export interface FilterOption {
  value: string | number
  label: string
}

// Generic field display for mobile cards
export interface CardField {
  icon?: string
  label?: string
  value: string | ReactNode
  color?: string
  onClick?: () => void
  hidden?: boolean
}
