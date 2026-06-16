'use client'

import { useMemo, useCallback, useState } from 'react'

import { createColumnHelper } from '@tanstack/react-table'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

// Components
import type { ColumnDef } from '@tanstack/react-table'

import { formatDistanceToNow } from 'date-fns'

import { fr } from 'date-fns/locale'

import { DependencyGraph } from '@/modules/SuperAdmin/superadmin/components/modules/DependencyGraph'

// Services & Types
import type { SiteListItem } from '../../types/site.types'

// Shared Components
import { DataTable, StandardMobileCard } from '@/components/shared/DataTable'
import type { DataTableConfig } from '@/components/shared/DataTable'

// Date formatting

// Column helper
const columnHelper = createColumnHelper<SiteListItem>()

interface SitesTableProps {
  sites: SiteListItem[]
  isLoading: boolean
  onEdit: (site: SiteListItem) => void
  onDelete: (site: SiteListItem) => void
  onManageModules: (site: SiteListItem) => void
  onTestConnection: (site: SiteListItem) => void
  onActivate: (site: SiteListItem) => void
  activatingId: number | null
  onAdd?: () => void
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  onRefresh?: () => void
  onSearch?: (value: string) => void
}

/**
 * Sites Table Component
 * Using the reusable DataTable architecture
 */
export default function SitesTable({
  sites,
  isLoading,
  onEdit,
  onDelete,
  onManageModules,
  onTestConnection,
  onActivate,
  activatingId,
  onAdd,
  pagination,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onSearch
}: SitesTableProps) {
  // État pour le dialog du graphe de dépendances
  const [dependencyGraphOpen, setDependencyGraphOpen] = useState(false)

  // Helper functions
  const getTypeLabel = useCallback((type: string | null) => {
    switch (type) {
      case 'CUST':
        return { label: 'CRM', color: 'info' as const }
      case 'ECOM':
        return { label: 'E-commerce', color: 'success' as const }
      case 'CMS':
        return { label: 'CMS', color: 'secondary' as const }
      default:
        return { label: 'N/A', color: 'default' as const }
    }
  }, [])

  const formatLastConnection = useCallback((date: string | null) => {
    if (!date) return 'Jamais'

    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
    } catch {
      return 'N/A'
    }
  }, [])

  // Handle delete with confirmation
  const handleDelete = useCallback(
    async (site: SiteListItem) => {
      if (window.confirm(`Êtes-vous sûr de vouloir supprimer le site "${site.host}" ?`)) {
        onDelete(site)
      }
    },
    [onDelete]
  )

  // Column definitions
  const columns = useMemo<ColumnDef<SiteListItem, any>[]>(
    () => [
      columnHelper.accessor('site_id', {
        id: 'site_id',
        header: 'ID',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-medium'>
            {row.original.id}
          </Typography>
        )
      }),
      columnHelper.accessor('host', {
        id: 'host',
        header: 'Domaine',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <div className='flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center'>
              <span className='text-white font-bold text-sm'>
                {row.original.host.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <Typography className='font-semibold'>{row.original.host}</Typography>
              {row.original.is_customer && (
                <Chip label='Client' size='small' color='success' className='mt-1' />
              )}
            </div>
          </div>
        )
      }),
      columnHelper.accessor('db_name', {
        id: 'db_name',
        header: 'Base de données',
        cell: ({ row }) => (
          <Typography variant='body2' className='font-mono text-sm'>
            {row.original.db_name}
          </Typography>
        )
      }),
      columnHelper.accessor('type', {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const typeInfo = getTypeLabel(row.original.type)

          
return <Chip label={typeInfo.label} size='small' color={typeInfo.color} />
        }
      }),
      columnHelper.accessor('company', {
        id: 'company',
        header: 'Société',
        cell: ({ row }) => (
          <Typography variant='body2'>{row.original.company || '-'}</Typography>
        )
      }),
      columnHelper.accessor('available', {
        id: 'available',
        header: 'Statut',
        cell: ({ row }) =>
          row.original.available ? (
            <Chip label='Actif' size='small' color='success' />
          ) : (
            <Chip label='Inactif' size='small' color='error' />
          )
      }),
      columnHelper.accessor('last_connection', {
        id: 'last_connection',
        header: 'Dernière connexion',
        cell: ({ row }) => (
          <Typography variant='body2' color='text.secondary'>
            {formatLastConnection(row.original.last_connection)}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isActivating = activatingId === row.original.id
          const isUptodate = row.original.is_uptodate

          return (
            <div className='flex items-center gap-0.5'>
              {!isUptodate ? (
                <Tooltip title='Activer le site (exécuter les migrations)'>
                  <span>
                    <IconButton
                      size='small'
                      onClick={() => onActivate(row.original)}
                      color='warning'
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <CircularProgress size={16} color='warning' />
                      ) : (
                        <i className='ri-play-circle-line' />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              ) : (
                <Tooltip title='Site activé (migrations à jour)'>
                  <span>
                    <IconButton size='small' color='success' disabled>
                      <i className='ri-checkbox-circle-line' />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <IconButton size='small' onClick={() => onManageModules(row.original)} color='info' title='Gérer les modules'>
                <i className='tabler-anchor' />
              </IconButton>
              <IconButton size='small' onClick={() => onEdit(row.original)} color='primary' title='Modifier'>
                <i className='ri-edit-box-line' />
              </IconButton>
              <IconButton
                size='small'
                onClick={() => onTestConnection(row.original)}
                color='success'
                title='Tester la connexion'
              >
                <i className='ri-lightbulb-flash-line' />
              </IconButton>
              <IconButton size='small' onClick={() => handleDelete(row.original)} color='error' title='Supprimer'>
                <i className='ri-delete-bin-7-line' />
              </IconButton>
            </div>
          )
        }
      })
    ],
    [getTypeLabel, formatLastConnection, onManageModules, onEdit, onTestConnection, handleDelete, onActivate, activatingId]
  )

  // DataTable configuration
  const tableConfig: DataTableConfig<SiteListItem> = {
    columns,
    data: sites,
    loading: isLoading,
    pagination,
    onPageChange,
    onPageSizeChange,
    onSearch,
    onRefresh,
    searchPlaceholder: 'Rechercher par domaine, base de données, société...',
    emptyMessage: 'Aucun site trouvé',
    rowsPerPageOptions: [10, 15, 25, 50],

    // Actions in toolbar
    actions: [
      {
        label: 'Graphe Dépendances',
        icon: 'tabler-topology-star-ring-3',
        color: 'secondary',
        onClick: () => setDependencyGraphOpen(true)
      },
      ...(onAdd ? [{
        label: 'Nouveau Site',
        icon: 'ri-add-line',
        color: 'primary' as const,
        onClick: onAdd
      }] : [])
    ],

    // Mobile card configuration
    mobileCard: {
      renderCard: site => (
        <StandardMobileCard
          title={site.host}
          subtitle={site.company}
          status={{
            label: site.available ? 'Actif' : 'Inactif',
            color: site.available ? 'success' : 'error'
          }}
          fields={[
            {
              icon: 'ri-database-2-line',
              label: 'Base de données',
              value: site.db_name
            },
            {
              icon: 'ri-stack-line',
              label: 'Type',
              value: getTypeLabel(site.type).label
            },
            {
              icon: 'ri-building-line',
              label: 'Société',
              value: site.company || '-',
              hidden: !site.company
            },
            {
              icon: 'ri-time-line',
              label: 'Dernière connexion',
              value: formatLastConnection(site.last_connection)
            }
          ]}
          actions={[
            ...(!site.is_uptodate ? [{
              icon: activatingId === site.id ? 'ri-loader-4-line' : 'ri-play-circle-line',
              color: 'warning' as const,
              onClick: () => onActivate(site)
            }] : []),
            {
              icon: 'tabler-puzzle',
              color: 'info' as const,
              onClick: () => onManageModules(site)
            },
            {
              icon: 'ri-edit-box-line',
              color: 'primary' as const,
              onClick: () => onEdit(site)
            },
            {
              icon: 'ri-flash-line',
              color: 'success' as const,
              onClick: () => onTestConnection(site)
            },
            {
              icon: 'ri-delete-bin-7-line',
              color: 'error' as const,
              onClick: () => handleDelete(site)
            }
          ]}
          item={site}
        />
      )
    }
  }

  return (
    <>
      <DataTable {...tableConfig} />

      {/* Dialog du graphe de dépendances */}
      <Dialog
        open={dependencyGraphOpen}
        onClose={() => setDependencyGraphOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6">Graphe des Dépendances</Typography>
              <Typography variant="caption" color="text.secondary">
                Visualisation des relations entre les modules
              </Typography>
            </Box>
            <IconButton onClick={() => setDependencyGraphOpen(false)} size="small">
              <i className="tabler-x" style={{ fontSize: 20 }} />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <DependencyGraph height="100%" />
        </DialogContent>
      </Dialog>
    </>
  )
}
