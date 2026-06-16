'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

import { createColumnHelper } from '@tanstack/react-table'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'

// Services
import type { ColumnDef } from '@tanstack/react-table'

import { customersService } from '../services/customersService'

// Types
import type { Customer, CustomerFilters } from '../../types'

// Shared Components
import { DataTable, StandardMobileCard } from '@/components/shared/DataTable'
import type { DataTableConfig, ColumnConfig } from '@/components/shared/DataTable'

// Column helper
const columnHelper = createColumnHelper<Customer>()

/**
 * Available columns configuration
 */
const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'id', label: 'ID', defaultVisible: true },
  { id: 'company', label: 'Company/Name', defaultVisible: true },
  { id: 'email', label: 'Email', defaultVisible: true },
  { id: 'phone', label: 'Phone/Mobile', defaultVisible: true },
  { id: 'address', label: 'Address', defaultVisible: false },
  { id: 'occupation', label: 'Occupation', defaultVisible: false },
  { id: 'created_at', label: 'Created Date', defaultVisible: true }
]

const STORAGE_KEY = 'customerListTableColumns'

/**
 * Customers Component
 * Now using the reusable DataTable architecture
 */
export default function Customers() {
  // States
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_error, setError] = useState<string | null>(null)

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  // Filters
  const [globalSearch, setGlobalSearch] = useState('')

  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'ACTIVE',
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15
  })

  // Column filters state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}

    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }

    // Default visibility
    const defaultVisibility: Record<string, boolean> = {}

    AVAILABLE_COLUMNS.forEach(col => {
      defaultVisibility[col.id] = col.defaultVisible !== false
    })

    return defaultVisibility
  })

  // Persist column visibility in event handler — avoids an extra effect run on mount.
  const handleColumnVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility)

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)) } catch { /* ignore */ }
  }, [])

  // Load customers
  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build search from column filters
      let searchQuery = globalSearch

      // If there are column filters, build a search string from them
      if (Object.keys(columnFilters).length > 0) {
        const filterValues = Object.values(columnFilters).filter(Boolean).join(' ')

        if (filterValues) {
          searchQuery = searchQuery ? `${searchQuery} ${filterValues}` : filterValues
        }
      }

      const response = await customersService.getCustomers({
        ...filters,
        page: pagination.current_page,
        search: searchQuery || undefined
      })

      if (response.success) {
        setCustomers(response.data)

        if (response.meta) {
          setPagination({
            current_page: response.meta.current_page || pagination.current_page,
            last_page: response.meta.last_page || 1,
            per_page: response.meta.per_page || filters.per_page || 15,
            total: response.meta.total || 0
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers')
      console.error('Error loading customers:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.current_page, filters, globalSearch, columnFilters])

  // Load on mount and when dependencies change
  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  // Handle delete
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return
    }

    try {
      await customersService.deleteCustomer(id)
      loadCustomers()
    } catch (err) {
      alert('Error deleting customer: ' + (err instanceof Error ? err.message : 'An error occurred'))
    }
  }, [loadCustomers])

  // Handle column filter change
  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => {
      if (value === '' || value === null || value === undefined) {
        // Remove filter if empty
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [columnId]: _removed, ...rest } = prev


return rest
      }

      
return {
        ...prev,
        [columnId]: value
      }
    })
  }, [])

  // Clear all column filters
  const handleClearAllFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  // Toggle filters visibility
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  // Helper to create column filter component
  const createColumnFilter = useCallback(
    (columnId: string) => {
      const value = columnFilters[columnId] || ''

      // Text search filters for most columns
      const textSearchColumns = [
        'company',
        'email',
        'phone',
        'address',
        'occupation'
      ]

      if (textSearchColumns.includes(columnId)) {
        return (
          <TextField
            size='small'
            value={value}
            onChange={e => handleColumnFilterChange(columnId, e.target.value)}
            placeholder='Search...'
            fullWidth
            variant='outlined'
            disabled={loading}
            sx={{ minWidth: 120 }}
          />
        )
      }

      // No filter for id and created_at for now
      return null
    },
    [columnFilters, handleColumnFilterChange, loading]
  )

  // Column definitions
  const columns = useMemo<ColumnDef<Customer, any>[]>(
    () => [
      columnHelper.accessor('id', {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => <Typography>{row.original.id}</Typography>
      }),
      columnHelper.accessor('display_name', {
        id: 'company',
        header: 'Company/Name',
        cell: ({ row }) => (
          <div>
            <Typography className='font-semibold'>{row.original.display_name}</Typography>
            {row.original.occupation && (
              <Typography variant='caption' color='text.secondary'>
                {row.original.occupation}
              </Typography>
            )}
          </div>
        )
      }),
      columnHelper.accessor('email', {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email || '-'}</Typography>
      }),
      columnHelper.accessor('phone', {
        id: 'phone',
        header: 'Phone/Mobile',
        cell: ({ row }) => (
          <div>
            {row.original.phone && (
              <Typography variant='body2'>📞 {row.original.phone}</Typography>
            )}
            {row.original.mobile && (
              <Typography variant='body2'>📱 {row.original.mobile}</Typography>
            )}
            {!row.original.phone && !row.original.mobile && '-'}
          </div>
        )
      }),
      columnHelper.accessor('primary_address', {
        id: 'address',
        header: 'Address',
        cell: ({ row }) =>
          row.original.primary_address ? (
            <Typography variant='body2'>
              {row.original.primary_address.city}, {row.original.primary_address.postcode}
            </Typography>
          ) : (
            <Typography>-</Typography>
          )
      }),
      columnHelper.accessor('occupation', {
        id: 'occupation',
        header: 'Occupation',
        cell: ({ row }) => <Typography>{row.original.occupation || '-'}</Typography>
      }),
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: 'Created Date',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {new Date(row.original.created_at).toLocaleDateString()}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-0.5'>
            <IconButton size='small' onClick={() => handleDelete(row.original.id)} color='error'>
              <i className='ri-delete-bin-7-line' />
            </IconButton>
            <IconButton size='small'>
              <i className='ri-eye-line' />
            </IconButton>
            <IconButton size='small'>
              <i className='ri-edit-box-line' />
            </IconButton>
          </div>
        )
      })
    ],
    [handleDelete]
  )

  // DataTable configuration
  const tableConfig: DataTableConfig<Customer> = {
    columns,
    data: customers,
    loading,
    pagination,
    availableColumns: AVAILABLE_COLUMNS,
    columnVisibility,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPageChange: page => setPagination(prev => ({ ...prev, current_page: page })),
    onPageSizeChange: size => {
      setFilters(prev => ({ ...prev, per_page: size }))
      setPagination(prev => ({ ...prev, per_page: size, current_page: 1 }))
    },
    onSearch: setGlobalSearch,
    onRefresh: loadCustomers,
    searchPlaceholder: 'Search customers by name, email, phone...',
    emptyMessage: 'No customers found',
    rowsPerPageOptions: [10, 15, 25, 50],

    // Column Filters
    showColumnFilters: showFilters,
    onToggleColumnFilters: handleToggleFilters,
    columnFilters,
    onClearAllFilters: handleClearAllFilters,
    createColumnFilter,

    // Actions in toolbar
    actions: [
      {
        label: 'Add Customer',
        icon: 'ri-user-add-line',
        color: 'primary',
        onClick: () => alert('Add customer functionality')
      }
    ],

    // Mobile card configuration
    mobileCard: {
      renderCard: customer => (
        <StandardMobileCard
          title={customer.display_name}
          subtitle={customer.occupation}
          status={{
            label: 'Active',
            color: 'success'
          }}
          fields={[
            {
              icon: 'ri-mail-line',
              value: customer.email || '-'
            },
            {
              icon: 'ri-phone-line',
              value: customer.phone || customer.mobile || '-'
            },
            {
              icon: 'ri-map-pin-line',
              value: customer.primary_address
                ? `${customer.primary_address.city}, ${customer.primary_address.postcode}`
                : '-',
              hidden: !customer.primary_address
            },
            {
              icon: 'ri-calendar-line',
              label: 'Created',
              value: new Date(customer.created_at).toLocaleDateString()
            }
          ]}
          actions={[
            {
              icon: 'ri-delete-bin-7-line',
              color: 'error',
              onClick: () => handleDelete(customer.id)
            },
            {
              icon: 'ri-eye-line',
              color: 'default',
              onClick: () => alert('View customer')
            },
            {
              icon: 'ri-edit-box-line',
              color: 'primary',
              onClick: () => alert('Edit customer')
            }
          ]}
          item={customer}
        />
      )
    }
  }

  return <DataTable {...tableConfig} />
}
