import { useState, useMemo, useCallback, type SyntheticEvent } from 'react'

import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import type { CustomerContract, ContractFilterOptions, ContractActionResponse } from '../../../types'
import { useContractTranslations } from '../../hooks/useContractTranslations'
import { contractsService } from '../../services/contractsService'

import { getColumnDefs, COLUMN_DEF_IDS, STORAGE_KEY } from './columns'
import type { ContractColumnDef } from './columns'
import { createColumnFilterFactory } from './column-filters'
import ContractActionsCell from './ContractActions'
import type { ActionType } from './ContractActions'

const columnHelper = createColumnHelper<CustomerContract>()

/**
 * Maps frontend column IDs to backend filter parameter names.
 * Matches Symfony's CustomerContractsFormFilter field names.
 */
export const COLUMN_TO_BACKEND_FILTER: Record<string, string> = {
  id:                'search_id',

  // Text search columns
  customer:          'search_lastname',
  customer_phone:    'search_phone',
  customer_city:     'search_city',
  customer_postcode: 'postcode',

  // Status columns (select dropdowns)
  contract_status:   'state_id',
  install_status:    'install_state_id',
  admin_status:      'admin_status_id',
  opc_status:        'opc_status_id',
  time_status:       'time_state_id',

  // User columns (select dropdowns)
  sale1:             'sale_1_id',
  sale2:             'sale_2_id',
  telepro:           'telepro_id',
  assistant:         'assistant_id',
  creator:           'created_by_id',

  // Entity columns (select dropdowns)
  team:              'team_id',
  company:           'company_id',
  financial_partner: 'financial_partner_id',
  partner_layer:     'partner_layer_id',
  polluter:          'polluter_id',
  campaign:          'campaign_id',

  // Boolean columns (direct match)
  is_confirmed:      'is_confirmed',
  is_billable:       'is_billable',
  is_hold:           'is_hold',
  is_hold_quote:     'is_hold_quote',
  is_document:       'is_document',
  is_photo:          'is_photo',
  is_quality:        'is_quality',
  status:            'status',

  // Date column sub-filters (Symfony lines 374-395)
  opc_range_id:      'opc_range_id',
  sav_at_range_id:   'sav_at_range_id',

  // Date range filter (Symfony sidebar lines 3-77)
  date_from:         'date_from',
  date_to:           'date_to',
  date_type:         'date_type',
  date_null:         'date_null',

  // Customer column sub-filter (Symfony domoprime_status)
  domoprime_status:  'domoprime_status',

  // Domoprime sidebar filters (Symfony lines 78-116)
  energy_id:         'energy_id',
  sector_id:         'sector_id',
  class_id:          'class_id',
  product_id:        'product_id',
  zone_id:           'zone_id',
  quotation_is_signed:  'quotation_is_signed',
  document_is_signed:   'document_is_signed',
  surface_parcel_check: 'surface_parcel_check',

  // Sidebar text search filters
  sidebar_search:        'search_lastname',
  sidebar_phone:         'search_phone',
  sidebar_postcode:      'postcode',
  sidebar_city:          'search_city',

  // Sidebar text fields
  acces_1:               'acces_1',
  acces_2:               'acces_2',
  source:                'source',
  rapport_installation:  'rapport_installation',
  rapport_attribution:   'rapport_attribution',
  rapport_temps:         'rapport_temps',
  rapport_admin:         'rapport_admin',

  // Sidebar entity selects
  confirmateur_id:       'confirmateur_id',
  regie_callcenter:      'regie_callcenter',
  sidebar_financial_partner: 'financial_partner_id',
  installer_user_id:     'installer_user_id',
  sidebar_partner_layer: 'partner_layer_id',
  sidebar_creator:       'created_by_id',
  sidebar_company:       'company_id',
}

interface UseContractListStateParams {
  loading: boolean
  deleteContract: (id: number) => Promise<any>
  updateContract: (id: number, data: Record<string, unknown>) => Promise<void>
  refreshContracts: () => Promise<void>
  updateFilter: (key: string, value: any) => void
  clearFilters: () => void

  /** API-driven permitted field keys from backend meta.permitted_fields */
  permittedFields: Set<string>

  /** Server-populated filter dropdown options */
  filterOptions: ContractFilterOptions

  /** Sidebar filters read from URL search params (for persistence) */
  initialSidebarFilters?: Record<string, string>
}

export function useContractListState({ loading, deleteContract, refreshContracts, updateFilter, clearFilters, permittedFields, filterOptions, initialSidebarFilters }: UseContractListStateParams) {
  const { hasCredential } = usePermissions()
  const t = useContractTranslations()

  // Sale cell SMS/Email action handler
  const handleSaleAction = useCallback((contractId: number, saleField: 'sale1' | 'sale2', action: 'sms' | 'email') => {
    setSaleDialogTarget({ contractId, saleField })
    if (action === 'sms') setSmsDialogContractId(contractId)
    else setEmailDialogContractId(contractId)
  }, [])

  // Financial partner cell action handler (installer email, partner email, WhatsApp)
  const handlePartnerAction = useCallback((contractId: number, action: 'email_installer' | 'email_partner' | 'whatsapp_partner') => {
    if (action === 'email_installer' || action === 'email_partner') {
      setEmailDialogContractId(contractId)
    }

    // TODO: WhatsApp action — requires dedicated endpoint/dialog
  }, [])

  // Build column definitions with current translations
  const columnDefs = useMemo(() => getColumnDefs(t, hasCredential, handleSaleAction, handlePartnerAction), [t, hasCredential, handleSaleAction, handlePartnerAction])

  // Filter columns by backend permitted fields (single source of truth).
  // If col.id is in permittedFields → show. If permittedFields doesn't
  // manage the column (not in the set at all) → always show.
  const permittedColumns = useMemo<ContractColumnDef[]>(
    () => columnDefs.filter(col => {
      if (permittedFields.size === 0) return true
      
return permittedFields.has(col.id)
    }),
    [columnDefs, permittedFields]
  )

  // States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null)

  const [showFilters, setShowFilters] = useState(() => {
    // Auto-open sidebar if URL has persisted filters
    return !!initialSidebarFilters && Object.keys(initialSidebarFilters).length > 0
  })

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    () => initialSidebarFilters ?? {}
  )

  // Dialog states for SMS, Email, Comment
  const [smsDialogContractId, setSmsDialogContractId] = useState<number | null>(null)
  const [emailDialogContractId, setEmailDialogContractId] = useState<number | null>(null)
  const [commentDialogContractId, setCommentDialogContractId] = useState<number | null>(null)

  // Sale-specific SMS/Email dialog state (target = sale1 or sale2)
  const [saleDialogTarget, setSaleDialogTarget] = useState<{ contractId: number; saleField: 'sale1' | 'sale2' } | null>(null)

  // Snackbar notification state
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' | 'info' }>({
    open: false, message: '', severity: 'success'
  })

  const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ open: true, message, severity })
  }, [])

  const handleCloseNotification = useCallback((_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return

    setNotification(prev => ({ ...prev, open: false }))
  }, [])

  // URL-persisted sidebar filters are already injected into the first API call
  // via `initialBackendFilters` in ContractsList1.tsx, so no hydration effect
  // is needed here — adding one would cause a redundant /contracts call after mount.

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}

    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) return JSON.parse(saved)
    } catch { /* incognito / quota exceeded / disabled */ }

    const defaults: Record<string, boolean> = {}

    COLUMN_DEF_IDS.forEach(id => { defaults[id] = true })

    return defaults
  })

  // Persist column visibility in event handler, not in effect
  const handleColumnVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility)

    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)) } catch { /* ignore */ }
  }, [])

  // Handlers
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm(t.confirmDelete)) return

    try {
      await deleteContract(id)
      showNotification(t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.deleteError + errorMessage, 'error')
    }
  }, [deleteContract, t.confirmDelete, t.deleteError, t.actionSuccess, showNotification])

  const handleEdit = useCallback((id: number) => {
    setSelectedContractId(id)
    setIsEditModalOpen(true)
  }, [])

  /** Dispatch contract actions from the actions menu */
  const handleAction = useCallback(async (contractId: number, action: ActionType) => {
    try {
      let result: ContractActionResponse | undefined

      switch (action) {
        // State transitions (dedicated endpoints)
        case 'confirm':      result = await contractsService.confirmContract(contractId); break
        case 'unconfirm':    result = await contractsService.unconfirmContract(contractId); break
        case 'cancel':       result = await contractsService.cancelContract(contractId); break
        case 'uncancel':     result = await contractsService.uncancelContract(contractId); break
        case 'blowing':      result = await contractsService.blowingContract(contractId); break
        case 'unblowing':    result = await contractsService.unblowingContract(contractId); break
        case 'placement':    result = await contractsService.placementContract(contractId); break
        case 'unplacement':  result = await contractsService.unplacementContract(contractId); break

        // Hold toggles
        case 'hold':         result = await contractsService.holdContract(contractId); break
        case 'unhold':       result = await contractsService.unholdContract(contractId); break
        case 'hold_admin':   result = await contractsService.holdAdminContract(contractId); break
        case 'unhold_admin': result = await contractsService.unholdAdminContract(contractId); break
        case 'hold_quote':   result = await contractsService.holdQuoteContract(contractId); break
        case 'unhold_quote': result = await contractsService.unholdQuoteContract(contractId); break

        // Copy & Products
        case 'copy_contract':          result = await contractsService.copyContract(contractId); break
        case 'create_default_products': result = await contractsService.createDefaultProducts(contractId); break

        // Communication (open dialogs instead of calling API directly)
        case 'send_sms':     setSmsDialogContractId(contractId); 

return
        case 'send_email':   setEmailDialogContractId(contractId); 

return
        case 'new_comment':  setCommentDialogContractId(contractId); 

return

        // Documents & Export (placeholders until backend is ready)
        case 'documents_form':
        case 'generate_cumac':
        case 'export_kml':
        case 'export_pdf':
        case 'pre_meeting_document':
        case 'billing':
          showNotification(t.actionNotImplemented, 'warning')

          return

        default:
          showNotification(t.actionNotImplemented, 'warning')

          return
      }

      // Refresh list after successful action
      await refreshContracts()
      showNotification(result?.message || t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.actionError + errorMessage, 'error')
    }
  }, [refreshContracts, t, showNotification])

  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => {
      if (value === '' || value === null || value === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [columnId]: _removed, ...rest } = prev

        return rest
      }

      return { ...prev, [columnId]: value }
    })

    // Send to backend using the mapped parameter name
    const backendParam = COLUMN_TO_BACKEND_FILTER[columnId]

    if (backendParam) {
      updateFilter(backendParam, value || undefined)
    }
  }, [updateFilter])

  const handleClearAllFilters = useCallback(() => {
    // Clear all mapped backend filters
    for (const backendParam of Object.values(COLUMN_TO_BACKEND_FILTER)) {
      updateFilter(backendParam, undefined)
    }

    setColumnFilters({})
    clearFilters()
  }, [clearFilters, updateFilter])

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  const handleSearch = useCallback((value: string) => {
    updateFilter('reference', value)
  }, [updateFilter])

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalOpen(false)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setSelectedContractId(null)
  }, [])

  const handleCloseSmsDialog = useCallback(() => { setSmsDialogContractId(null); setSaleDialogTarget(null) }, [])
  const handleCloseEmailDialog = useCallback(() => { setEmailDialogContractId(null); setSaleDialogTarget(null) }, [])
  const handleCloseCommentDialog = useCallback(() => setCommentDialogContractId(null), [])

  // Column filter factory
  const createColumnFilter = useCallback(
    createColumnFilterFactory(columnFilters, handleColumnFilterChange, loading, filterOptions, t),
    [columnFilters, handleColumnFilterChange, loading, filterOptions, t]
  )

  // TanStack Column Definitions
  const columns = useMemo<ColumnDef<CustomerContract, any>[]>(() => {
    // ID column gated by credential (Symfony: superadmin, admin, contract_view_list_id)
    const showId = hasCredential([['superadmin', 'admin', 'contract_view_list_id']])

    const idCols = showId ? [columnHelper.accessor('id', {
      id: 'id',
      header: '# ID',
      cell: ({ row }) => <Typography className='font-semibold' color='primary'>{row.original.id}</Typography>
    })] : []

    const dataCols = permittedColumns.map(def =>
      columnHelper.accessor(def.getValue, {
        id: def.id,
        header: def.label,
        cell: ({ row }) => def.renderCell(row.original)
      })
    )

    // Actions column always visible (Symfony: formFilter->hasColumn('actions'))
    // Per-row authorization is handled inside ContractActionsCell (isAuthorized || contract_list_view_actions)
    const actionsCol = columnHelper.display({
      id: 'actions',
      header: t.colActions,
      cell: ({ row }) => (
        <ContractActionsCell
          contract={row.original}
          onAction={handleAction}
          onEdit={handleEdit}
          onDelete={handleDelete}
          t={t}
        />
      )
    })

    const selectCol = columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          size='small'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          size='small'
        />
      ),
    })

    const rowNumberCol = columnHelper.display({
      id: 'row_number',
      header: '#',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>
          {row.index + 1}
        </Typography>
      ),
    })

    return [selectCol, rowNumberCol, ...idCols, ...dataCols, actionsCol] as ColumnDef<CustomerContract, any>[]
  }, [permittedColumns, handleDelete, handleEdit, handleAction, hasCredential, t])

  return {
    // State
    columns,
    permittedColumns,
    columnVisibility,
    columnFilters,
    showFilters,
    isCreateModalOpen,
    isEditModalOpen,
    selectedContractId,
    hasCredential,
    t,

    // Dialog states
    smsDialogContractId,
    emailDialogContractId,
    commentDialogContractId,
    saleDialogTarget,

    // Handlers
    handleColumnVisibilityChange,
    handleClearAllFilters,
    handleToggleFilters,
    handleSearch,
    handleEdit,
    handleDelete,
    handleAction,
    handleCloseCreateModal,
    handleColumnFilterChange,
    handleCloseEditModal,
    setIsCreateModalOpen,
    createColumnFilter,

    // Dialog handlers
    handleCloseSmsDialog,
    handleCloseEmailDialog,
    handleCloseCommentDialog,
    refreshContracts,

    // Notification
    notification,
    showNotification,
    handleCloseNotification,
  }
}
