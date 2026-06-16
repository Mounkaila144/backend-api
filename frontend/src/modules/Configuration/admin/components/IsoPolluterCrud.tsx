'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'

import PolluterConfirmDialogs from './iso-polluter/PolluterConfirmDialogs'
import PolluterFormDialog from './iso-polluter/PolluterFormDialog'
import PolluterListTable from './iso-polluter/PolluterListTable'
import PolluterSubSectionRouter from './iso-polluter/PolluterSubSectionRouter'
import { emptyFilter } from './iso-polluter/types'
import { usePolluterCrud } from './iso-polluter/usePolluterCrud'

/**
 * Polluter CRUD page — thin layout. All state, side effects, and API calls live in
 * usePolluterCrud(). This component only wires the hook output to the presentational
 * children and decides between the list view, the sub-section view, and the loading view.
 */
export default function IsoPolluterCrud() {
  const c = usePolluterCrud()

  // ─── Sub-section render ──────────────────────────────────────────────────

  if (c.subSection) {
    return (
      <PolluterSubSectionRouter
        subSection={c.subSection}
        onBack={() => c.setSubSection(null)}
        t={c.t}
      />
    )
  }

  // ─── Initial loading ─────────────────────────────────────────────────────

  if (c.loading && c.items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  // ─── Main list render ────────────────────────────────────────────────────

  return (
    <Box>
      {c.error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => c.setError(null)}>
          {c.error}
        </Alert>
      ) : null}

      <Snackbar
        open={!!c.successMsg}
        autoHideDuration={3000}
        onClose={() => c.setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => c.setSuccessMsg(null)} variant='filled'>
          {c.successMsg}
        </Alert>
      </Snackbar>

      <PolluterListTable
        items={c.items}
        loading={c.loading}
        filter={c.filter}
        can={c.can}
        onSort={c.handleSort}
        onFilterChange={c.setFilter}
        onOpenCreate={c.handleOpenCreate}
        onOpenEdit={c.handleOpenEdit}
        onToggleActive={c.handleToggleActive}
        onDelete={item => c.setDeletingItem(item)}
        onRemove={item => c.setRemovingItem(item)}
        onSubSection={(key, polluter) => c.setSubSection({ key, polluter })}
        onExportOne={c.handleExportOne}
        onExportAll={c.handleExportAll}
        onOpenImport={() => c.setImportDialogOpen(true)}
        onResetFilter={() => c.setFilter(emptyFilter)}
        t={c.t}
      />

      <PolluterFormDialog
        open={c.dialogOpen}
        editing={c.editingItem}
        formData={c.formData}
        saving={c.saving}
        onSet={c.setField}
        onSave={c.handleSave}
        onClose={c.handleCloseDialog}
        t={c.t}
      />

      <PolluterConfirmDialogs
        deletingItem={c.deletingItem}
        deleting={c.deleting}
        onConfirmDelete={c.handleConfirmDelete}
        onCloseDelete={() => c.setDeletingItem(null)}
        removingItem={c.removingItem}
        removing={c.removing}
        onConfirmRemove={c.handleConfirmRemove}
        onCloseRemove={() => c.setRemovingItem(null)}
        importDialogOpen={c.importDialogOpen}
        importFile={c.importFile}
        importing={c.importing}
        onConfirmImport={c.handleImport}
        onCloseImport={() => { c.setImportDialogOpen(false); c.setImportFile(null) }}
        onSelectImportFile={c.setImportFile}
        t={c.t}
      />
    </Box>
  )
}
