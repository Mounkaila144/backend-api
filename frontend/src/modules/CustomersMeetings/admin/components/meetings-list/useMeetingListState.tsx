import { useState, useMemo, useCallback, type SyntheticEvent } from 'react'

import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import type { CustomerMeeting, MeetingFilterOptions, MeetingActionResponse } from '../../../types'
import { useMeetingTranslations } from '../../hooks/useMeetingTranslations'
import { meetingsService } from '../../services/meetingsService'

import { getColumnDefs, COLUMN_DEF_IDS, STORAGE_KEY } from './columns'
import type { MeetingColumnDef } from './columns'
import { createColumnFilterFactory } from './column-filters'
import MeetingActionsCell from './MeetingActions'
import type { ActionType } from './MeetingActions'

const columnHelper = createColumnHelper<CustomerMeeting>()

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Maps frontend column IDs to backend filter parameter names.
 */
export const COLUMN_TO_BACKEND_FILTER: Record<string, string> = {
  // Text search columns
  customer:          'search_lastname',
  customer_phone:    'search_phone',
  customer_city:     'search_city',
  customer_postcode: 'postcode',

  // Status columns
  meeting_status:    'state_id',
  status_call:       'status_call_id',
  status_lead:       'status_lead_id',

  // User columns
  sales:             'sales_id',
  sale2:             'sale2_id',
  telepro:           'telepro_id',
  assistant:         'assistant_id',
  creator:           'created_by_id',
  confirmator:       'confirmator_id',
  confirmed_by:      'confirmed_by_id',

  // Entity columns
  callcenter:        'callcenter_id',
  company:           'company_id',
  partner_layer:     'partner_layer_id',
  polluter:          'polluter_id',
  campaign:          'campaign_id',
  meeting_type:      'type_id',
  opc_range:         'opc_range_id',

  // Boolean columns
  is_confirmed:      'is_confirmed',
  is_hold:           'is_hold',
  is_hold_quote:     'is_hold_quote',
  is_qualified:      'is_qualified',
  status:            'status',

  // ── Sidebar date filters ──
  date_from:         'date_from',
  date_to:           'date_to',
  date_type:         'date_type',

  // ── Sidebar text search ──
  sidebar_search:    'search_lastname',
  sidebar_phone:     'search_phone',
  sidebar_postcode:  'postcode',
  sidebar_city:      'search_city',

  // ── Sidebar ranges ──
  sidebar_opc_range:    'opc_range_id',
  sidebar_in_at_range:  'in_at_range_id',

  // ── Sidebar team ──
  sidebar_telepro:      'telepro_id',
  sidebar_sales:        'sales_id',
  sidebar_sale2:        'sale2_id',
  sidebar_assistant:    'assistant_id',
  sidebar_creator:      'created_by_id',
  sidebar_confirmator:  'confirmator_id',

  // ── Sidebar statuses ──
  sidebar_state:        'state_id',
  sidebar_status_call:  'status_call_id',
  sidebar_status_lead:  'status_lead_id',

  // ── Sidebar selections ──
  sidebar_campaign:      'campaign_id',
  sidebar_callcenter:    'callcenter_id',
  sidebar_polluter:      'polluter_id',
  sidebar_company:       'company_id',
  sidebar_partner_layer: 'partner_layer_id',
  sidebar_meeting_type:  'type_id',

  // ── Sidebar flags ──
  sidebar_is_confirmed:   'is_confirmed',
  sidebar_is_hold:        'is_hold',
  sidebar_is_hold_quote:  'is_hold_quote',
  sidebar_is_qualified:   'is_qualified',
}

interface UseMeetingListStateParams {
  loading: boolean
  deleteMeeting: (id: number) => Promise<boolean>
  updateMeeting: (id: number, data: Record<string, unknown>) => Promise<void>
  refreshMeetings: () => Promise<void>
  updateFilter: (key: string, value: any) => void
  clearFilters: () => void
  permittedFields: Set<string>
  filterOptions: MeetingFilterOptions

  /** Sidebar filters read from URL search params (for persistence) */
  initialSidebarFilters?: Record<string, string>
}

export function useMeetingListState({ loading, deleteMeeting, refreshMeetings, updateFilter, clearFilters, permittedFields, filterOptions, initialSidebarFilters }: UseMeetingListStateParams) {
  const { hasCredential } = usePermissions()
  const t = useMeetingTranslations()

  // Build column definitions with current translations
  const columnDefs = useMemo(() => getColumnDefs(t, hasCredential), [t, hasCredential])

  // Filter columns by backend permitted fields
  const permittedColumns = useMemo<MeetingColumnDef[]>(
    () => columnDefs.filter(col => {
      if (permittedFields.size === 0) return true
      
return permittedFields.has(col.id)
    }),
    [columnDefs, permittedFields]
  )

  // States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null)

  const [showFilters, setShowFilters] = useState(() => {
    return !!initialSidebarFilters && Object.keys(initialSidebarFilters).length > 0
  })

  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    () => initialSidebarFilters ?? {}
  )

  // Dialog states for SMS, Email, Comment
  const [smsDialogMeetingId, setSmsDialogMeetingId] = useState<number | null>(null)
  const [emailDialogMeetingId, setEmailDialogMeetingId] = useState<number | null>(null)
  const [commentDialogMeetingId, setCommentDialogMeetingId] = useState<number | null>(null)

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
  // via `initialBackendFilters` in MeetingsList.tsx, so no hydration effect
  // is needed here — adding one would cause a redundant /meetings call after mount.

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

  const handleColumnVisibilityChange = useCallback((visibility: Record<string, boolean>) => {
    setColumnVisibility(visibility)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility)) } catch { /* ignore */ }
  }, [])

  // Handlers
  const handleDelete = useCallback(async (id: number) => {
    if (!confirm(t.confirmDelete)) return

    try {
      await deleteMeeting(id)
      showNotification(t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.deleteError + errorMessage, 'error')
    }
  }, [deleteMeeting, t.confirmDelete, t.deleteError, t.actionSuccess, showNotification])

  const handleEdit = useCallback((id: number) => {
    setSelectedMeetingId(id)
    setIsEditModalOpen(true)
  }, [])

  /** Dispatch meeting actions from the actions menu */
  const handleAction = useCallback(async (meetingId: number, action: ActionType) => {
    try {
      let result: MeetingActionResponse | undefined

      switch (action) {
        case 'confirm':        result = await meetingsService.confirmMeeting(meetingId); break
        case 'unconfirm':      result = await meetingsService.unconfirmMeeting(meetingId); break
        case 'cancel':         result = await meetingsService.cancelMeeting(meetingId); break
        case 'uncancel':       result = await meetingsService.uncancelMeeting(meetingId); break
        case 'hold':           result = await meetingsService.holdMeeting(meetingId); break
        case 'unhold':         result = await meetingsService.unholdMeeting(meetingId); break
        case 'hold_quote':     result = await meetingsService.holdQuoteMeeting(meetingId); break
        case 'unhold_quote':   result = await meetingsService.unholdQuoteMeeting(meetingId); break
        case 'lock':           result = await meetingsService.lockMeeting(meetingId); break
        case 'unlock':         result = await meetingsService.unlockMeeting(meetingId); break
        case 'cancel_callback': result = await meetingsService.cancelCallback(meetingId); break
        case 'copy_meeting':   result = await meetingsService.copyMeeting(meetingId); break
        case 'recycle':        result = await meetingsService.recycleMeeting(meetingId); break
        case 'create_contract': result = await meetingsService.createContract(meetingId); break
        case 'create_default_products': result = await meetingsService.createDefaultProducts(meetingId); break
        case 'migrate':        result = await meetingsService.migrateMeeting(meetingId); break
        case 'transfer_to_slave': result = await meetingsService.transferToSlave(meetingId); break
        case 'slaves_transfer': result = await meetingsService.slavesTransfer(meetingId); break
        case 'export_kml':
          downloadBlob(await meetingsService.exportKml(meetingId), `meeting_${meetingId}.kml`)
          break
        case 'export_pdf':
          downloadBlob(await meetingsService.exportPdf(meetingId), `meeting_${meetingId}.pdf`)
          break

        // Communication (open dialogs)
        case 'send_sms':     setSmsDialogMeetingId(meetingId); 

return
        case 'send_email':   setEmailDialogMeetingId(meetingId); 

return
        case 'new_comment':  setCommentDialogMeetingId(meetingId); 

return

        default:
          showNotification(t.actionNotImplemented, 'warning')
          
return
      }

      await refreshMeetings()
      showNotification(result?.message || t.actionSuccess, 'success')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)

      showNotification(t.actionError + errorMessage, 'error')
    }
  }, [refreshMeetings, t, showNotification])

  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => {
      if (value === '' || value === null || value === undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [columnId]: _removed, ...rest } = prev


return rest
      }

      
return { ...prev, [columnId]: value }
    })

    const backendParam = COLUMN_TO_BACKEND_FILTER[columnId]

    if (backendParam) {
      updateFilter(backendParam, value || undefined)
    }
  }, [updateFilter])

  const handleClearAllFilters = useCallback(() => {
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
    updateFilter('search_lastname', value)
  }, [updateFilter])

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setSelectedMeetingId(null)
  }, [])

  const handleCloseSmsDialog = useCallback(() => setSmsDialogMeetingId(null), [])
  const handleCloseEmailDialog = useCallback(() => setEmailDialogMeetingId(null), [])
  const handleCloseCommentDialog = useCallback(() => setCommentDialogMeetingId(null), [])

  // Column filter factory
  const createColumnFilter = useMemo(
    () => createColumnFilterFactory(columnFilters, handleColumnFilterChange, loading, filterOptions, t),
    [columnFilters, handleColumnFilterChange, loading, filterOptions, t]
  )

  // TanStack Column Definitions
  const columns = useMemo<ColumnDef<CustomerMeeting, any>[]>(() => {
    const showId = hasCredential([['superadmin', 'admin', 'meeting_view_list_id']])

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

    const actionsCol = columnHelper.display({
      id: 'actions',
      header: t.colActions,
      cell: ({ row }) => (
        <MeetingActionsCell
          meeting={row.original}
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

    return [selectCol, rowNumberCol, ...idCols, ...dataCols, actionsCol] as ColumnDef<CustomerMeeting, any>[]
  }, [permittedColumns, handleDelete, handleEdit, handleAction, hasCredential, t])

  return {
    // State
    columns,
    permittedColumns,
    columnVisibility,
    columnFilters,
    showFilters,
    isEditModalOpen,
    selectedMeetingId,
    hasCredential,
    t,

    // Dialog states
    smsDialogMeetingId,
    emailDialogMeetingId,
    commentDialogMeetingId,

    // Handlers
    handleColumnVisibilityChange,
    handleClearAllFilters,
    handleToggleFilters,
    handleSearch,
    handleEdit,
    handleDelete,
    handleAction,
    handleColumnFilterChange,
    handleCloseEditModal,
    createColumnFilter,

    // Dialog handlers
    handleCloseSmsDialog,
    handleCloseEmailDialog,
    handleCloseCommentDialog,
    refreshMeetings,

    // Notification
    notification,
    showNotification,
    handleCloseNotification,
  }
}
