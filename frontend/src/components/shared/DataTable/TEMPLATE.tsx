/**
 * ========================================
 * TEMPLATE DE TABLEAU RÉUTILISABLE
 * ========================================
 *
 * Copiez ce fichier pour créer rapidement un nouveau tableau.
 *
 * ÉTAPES :
 * 1. Remplacez YourDataType par votre type de données
 * 2. Remplacez yourService par votre service API
 * 3. Définissez vos colonnes
 * 4. Configurez la mobile card
 * 5. Ajustez les actions et filtres selon vos besoins
 */

'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

import { createColumnHelper } from '@tanstack/react-table'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'

// Services
// import { yourService } from '../services/yourService'

// Types
// import type { YourDataType } from '../../types'
import type { ColumnDef } from '@tanstack/react-table'

// Shared Components
import { DataTable, StandardMobileCard } from '@/components/shared/DataTable'
import type { DataTableConfig, ColumnConfig } from '@/components/shared/DataTable'

// ========================================
// TYPES - À REMPLACER
// ========================================
interface YourDataType {
  id: number
  name: string
  email: string

  // ... ajoutez vos champs
}

// Column helper
const columnHelper = createColumnHelper<YourDataType>()

// ========================================
// CONFIGURATION DES COLONNES
// ========================================
const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'id', label: 'ID', defaultVisible: true },
  { id: 'name', label: 'Name', defaultVisible: true },
  { id: 'email', label: 'Email', defaultVisible: true },

  // ... ajoutez vos colonnes
]

const STORAGE_KEY = 'yourTableColumns' // ⚠️ Changez ceci pour être unique

/**
 * YourTableComponent
 * Description de votre composant
 */
export default function YourTableComponent() {
  // ========================================
  // STATES
  // ========================================
  const [data, setData] = useState<YourDataType[]>([])
  const [loading, setLoading] = useState(true)

  // Pagination
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  // Search & Filters
  const [globalSearch, setGlobalSearch] = useState('')

  // Column visibility (with localStorage persistence)
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

  // Save column visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  // ========================================
  // DATA LOADING
  // ========================================
  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      // ⚠️ REMPLACEZ PAR VOTRE APPEL API
      // const response = await yourService.getData({
      //   page: pagination.current_page,
      //   per_page: pagination.per_page,
      //   search: globalSearch || undefined
      // })

      // Exemple de structure de response
      // if (response.success) {
      //   setData(response.data)
      //   setPagination({
      //     current_page: response.meta.current_page,
      //     last_page: response.meta.last_page,
      //     per_page: response.meta.per_page,
      //     total: response.meta.total
      //   })
      // }

      // TEMPORAIRE - Données de démo
      setData([
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ])
      setPagination({ current_page: 1, last_page: 1, per_page: 15, total: 2 })
    } catch {
      // Data loading failed
    } finally {
      setLoading(false)
    }
  }, [pagination.current_page, globalSearch])

  // Load on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // ========================================
  // HANDLERS
  // ========================================
  const handleDelete = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async (id: number) => {
      if (!confirm('Are you sure you want to delete this item?')) {
        return
      }

      try {
        // ⚠️ REMPLACEZ PAR VOTRE APPEL API
        // await yourService.delete(id)
        loadData()
      } catch (err) {
        alert('Error deleting item: ' + (err instanceof Error ? err.message : 'An error occurred'))
      }
    },
    [loadData]
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEdit = useCallback((item: YourDataType) => {
    // TODO: implement edit logic
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleView = useCallback((item: YourDataType) => {
    // TODO: implement view logic
  }, [])

  const handleAdd = useCallback(() => {
    // TODO: implement add logic
  }, [])

  // ========================================
  // COLUMN DEFINITIONS
  // ========================================
  const columns = useMemo<ColumnDef<YourDataType, any>[]>(
    () => [
      columnHelper.accessor('id', {
        id: 'id',
        header: 'ID',
        cell: ({ row }) => <Typography>{row.original.id}</Typography>
      }),
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <Typography className='font-semibold'>{row.original.name}</Typography>
        )
      }),
      columnHelper.accessor('email', {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => <Typography>{row.original.email}</Typography>
      }),

      // ⚠️ AJOUTEZ VOS COLONNES ICI

      // Actions column
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className='flex items-center gap-0.5'>
            <IconButton size='small' onClick={() => handleDelete(row.original.id)} color='error'>
              <i className='ri-delete-bin-7-line' />
            </IconButton>
            <IconButton size='small' onClick={() => handleView(row.original)}>
              <i className='ri-eye-line' />
            </IconButton>
            <IconButton size='small' onClick={() => handleEdit(row.original)} color='primary'>
              <i className='ri-edit-box-line' />
            </IconButton>
          </div>
        )
      })
    ],
    [handleDelete, handleEdit, handleView]
  )

  // ========================================
  // DATATABLE CONFIGURATION
  // ========================================
  const tableConfig: DataTableConfig<YourDataType> = {
    // Data
    columns,
    data,
    loading,

    // Pagination
    pagination,
    onPageChange: page => setPagination(prev => ({ ...prev, current_page: page })),
    onPageSizeChange: size => setPagination(prev => ({ ...prev, per_page: size, current_page: 1 })),
    rowsPerPageOptions: [10, 15, 25, 50, 100],

    // Search
    searchPlaceholder: 'Search...', // ⚠️ Personnalisez
    onSearch: setGlobalSearch,
    onRefresh: loadData,

    // Columns
    availableColumns: AVAILABLE_COLUMNS,
    columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,

    // Messages
    emptyMessage: 'No data available',

    // Toolbar actions
    actions: [
      {
        label: 'Add New', // ⚠️ Personnalisez
        icon: 'ri-add-line',
        color: 'primary',
        onClick: handleAdd
      }

      // Ajoutez d'autres actions (Export, Import, etc.)
    ],

    // ========================================
    // MOBILE CARD CONFIGURATION
    // ========================================
    mobileCard: {
      renderCard: item => (
        <StandardMobileCard

          // Header
          title={item.name}
          subtitle={item.email}

          // Status badge (optionnel)
          status={{
            label: 'Active', // ⚠️ Personnalisez selon vos données
            color: 'success'
          }}

          // Fields to display
          fields={[
            {
              icon: 'ri-mail-line',
              label: 'Email',
              value: item.email
            }

            // ⚠️ AJOUTEZ VOS CHAMPS ICI
            // {
            //   icon: 'ri-phone-line',
            //   label: 'Phone',
            //   value: item.phone,
            //   hidden: !item.phone // Masquer si vide
            // }
          ]}

          // Actions buttons
          actions={[
            {
              icon: 'ri-delete-bin-7-line',
              color: 'error',
              onClick: () => handleDelete(item.id)
            },
            {
              icon: 'ri-eye-line',
              color: 'default',
              onClick: () => handleView(item)
            },
            {
              icon: 'ri-edit-box-line',
              color: 'primary',
              onClick: () => handleEdit(item)
            }
          ]}
          item={item}
        />
      )
    }
  }

  // ========================================
  // RENDER
  // ========================================
  return <DataTable {...tableConfig} />
}
