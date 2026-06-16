'use client'

import { useState, useMemo } from 'react'

import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'

import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

import { useMeetings } from '../hooks/useMeetings'
import { useMeetingFilterOptions } from '../hooks/useMeetingFilterOptions'
import { readSidebarFiltersFromParams } from '../hooks/useSidebarFilterParams'
import { DataTable } from '@/components/shared/DataTable'
import type { DataTableConfig } from '@/components/shared/DataTable'
import type { CustomerMeeting } from '../../types'

import MeetingMobileCard from './meetings-list/MeetingMobileCard'
import MeetingFilterPanel from './meetings-list/MeetingFilterPanel'
import { useMeetingListState, COLUMN_TO_BACKEND_FILTER } from './meetings-list/useMeetingListState'

// Heavy dialogs are lazy-loaded — they only mount when actually opened.
const CreateMeetingWizard = dynamic(() => import('./meeting-wizard/CreateMeetingWizard'), { ssr: false })
const EditMeetingDialog = dynamic(() => import('./meeting-edit/EditMeetingDialog'), { ssr: false })

export default function MeetingsList() {
  const searchParams = useSearchParams()

  // Read sidebar filters from URL once (for persistence across navigation)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialSidebarFilters = useMemo(() => readSidebarFiltersFromParams(searchParams), [])

  // Convert sidebar filter keys to backend param names so the FIRST API call
  // already includes persisted filters (avoids race condition with hydration effect)
  const initialBackendFilters = useMemo(() => {
    const mapped: Record<string, any> = {}

    for (const [key, value] of Object.entries(initialSidebarFilters)) {
      const backendKey = COLUMN_TO_BACKEND_FILTER[key]

      if (backendKey && value) mapped[backendKey] = value
    }

    
return mapped
  }, [initialSidebarFilters])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const {
    meetings, loading, error, currentPage, totalPages, total, perPage,
    permittedFields,
    setCurrentPage, setPerPage, updateFilter, clearFilters,
    deleteMeeting, updateMeeting, refreshMeetings, createMeeting, getMeeting
  } = useMeetings(initialBackendFilters)

  const { filterOptions } = useMeetingFilterOptions()

  const {
    columns, permittedColumns, columnVisibility, columnFilters, showFilters,
    isEditModalOpen, selectedMeetingId, hasCredential, t,
    notification, handleCloseNotification,
    handleColumnVisibilityChange, handleClearAllFilters, handleToggleFilters,
    handleSearch, handleEdit, handleDelete, handleColumnFilterChange,
    handleCloseEditModal, createColumnFilter,
  } = useMeetingListState({ loading, deleteMeeting, updateMeeting, refreshMeetings, updateFilter, clearFilters, permittedFields, filterOptions, initialSidebarFilters })

  const tableConfig: DataTableConfig<CustomerMeeting> = {
    columns,
    data: Array.isArray(meetings) ? meetings : [],
    loading,
    pagination: { current_page: currentPage, last_page: totalPages, per_page: perPage, total },
    availableColumns: permittedColumns,
    columnVisibility,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onPageChange: setCurrentPage,
    onPageSizeChange: setPerPage,
    onSearch: handleSearch,
    onRefresh: () => window.location.reload(),
    onRowDoubleClick: (meeting) => handleEdit(meeting.id),
    searchPlaceholder: t.searchPlaceholder,
    emptyMessage: t.emptyMessage,
    rowsPerPageOptions: [10, 15, 25, 50],
    showColumnFilters: showFilters,
    onToggleColumnFilters: handleToggleFilters,
    columnFilters,
    onClearAllFilters: handleClearAllFilters,
    createColumnFilter,
    stickyLeft: ['select', 'id'],
    stickyRight: ['actions'],
    actions: hasCredential([['superadmin', 'admin', 'meeting_new']]) ? [
      { label: t.newMeeting, icon: 'ri-add-line', color: 'primary', onClick: () => setIsCreateModalOpen(true) }
    ] : [],
    mobileCard: {
      renderCard: meeting => (
        <MeetingMobileCard
          meeting={meeting}
          hasCredential={hasCredential}
          permittedFields={permittedFields}
          onEdit={handleEdit}
          onDelete={handleDelete}
          t={t}
        />
      )
    }
  }

  return (
    <>
      {error ? (
        <Box sx={{ background: '#fee', color: '#c33', padding: 2, borderRadius: 2, marginBottom: 2, border: '1px solid #fcc' }}>
          {error}
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        {showFilters && (
          <MeetingFilterPanel
            columnFilters={columnFilters}
            onFilterChange={handleColumnFilterChange}
            loading={loading}
            filterOptions={filterOptions}
            t={t}
          />
        )}

        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <DataTable {...tableConfig} />
        </Box>
      </Box>

      {isCreateModalOpen && (
        <CreateMeetingWizard
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={createMeeting}
        />
      )}

      {isEditModalOpen && selectedMeetingId !== null && (
        <EditMeetingDialog
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onUpdate={updateMeeting}
          meetingId={selectedMeetingId}
          onFetchMeeting={getMeeting}
          filterOptions={filterOptions}
        />
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant='filled'
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  )
}
