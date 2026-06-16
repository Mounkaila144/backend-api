'use client'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'

import QuotationDetailsTable from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/QuotationDetailsTable'
import EditQuotationView from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/EditQuotationView'
import CreateQuotationDialog from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/CreateQuotationDialog'

import type { CustomerMeeting } from '../../../../types'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'
import { useMeetingDocumentState } from './documents/useMeetingDocumentState'

interface TabQuotationsProps {
  meetingId: number | null
  meeting: CustomerMeeting | null
  t: MeetingTranslations
}

/**
 * Quotations tab — Story M2.
 *
 * Provides full CRUD over the meeting's quotations:
 * - List with rich details (QuotationDetailsTable, shared with contract)
 * - Create via CreateQuotationDialog (Story M0)
 * - Edit inline via EditQuotationView (shared with contract)
 * - Disable / Enable / Permanent delete (superadmin)
 * - PDF export
 *
 * The Tab Documents view (Story M1) shows a compact summary of the same data;
 * this tab is the operational, table-style version.
 */
export default function TabQuotations({ meetingId, meeting, t }: TabQuotationsProps) {
  const tR = t as MeetingTranslations & Record<string, string>

  const {
    loading,
    error,
    downloading,
    quotations,
    handleDownloadPdf,
    handleDisableQuotation,
    handleEnableQuotation,
    handleRemoveQuotation,
    notification,
    handleCloseNotification,
    createDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    handleQuotationCreated,
    editingQuotationId,
    startEditing,
    cancelEditing,
    handleSaveQuotation,
  } = useMeetingDocumentState(meetingId, tR)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (editingQuotationId) {
    return (
      <EditQuotationView
        quotationId={editingQuotationId}
        onSave={handleSaveQuotation}
        onCancel={cancelEditing}
        t={tR}
      />
    )
  }

  const isHold = meeting?.is_hold === 'YES' || meeting?.is_hold_quote === 'YES'
  const customerMissing = !meeting?.customer_id

  return (
    <Box>
      <Stack direction='row' spacing={1} sx={{ mb: 2, justifyContent: 'space-between', alignItems: 'center' }} flexWrap='wrap'>
        <Typography variant='h6'>
          {tR.docQuotationsTitle ?? tR.editTabQuotations ?? 'Devis'}
        </Typography>
        <Stack direction='row' spacing={1}>
          <Button
            variant='contained'
            size='small'
            startIcon={<i className='ri-add-line' />}
            onClick={openCreateDialog}
            disabled={!meetingId || customerMissing || isHold}
          >
            {tR.docActionNewQuotation ?? 'Nouveau devis'}
          </Button>
          <IconButton onClick={() => window.location.reload()} size='small' title='Refresh' sx={{ display: 'none' }}>
            <i className='ri-refresh-line' />
          </IconButton>
        </Stack>
      </Stack>

      {customerMissing ? (
        <Alert severity='info' sx={{ mb: 2 }}>
          {tR.docMeetingNoCustomer ?? 'Ce meeting n\'a pas encore de client. Aucun devis ne peut être créé.'}
        </Alert>
      ) : null}

      {isHold ? (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {tR.docMeetingOnHold ?? 'Le meeting est bloqué.'}
        </Alert>
      ) : null}

      <Paper variant='outlined'>
        {quotations.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant='body2'>
              {tR.docNoQuotations ?? 'Aucun devis trouvé'}
            </Typography>
          </Box>
        ) : (
          <QuotationDetailsTable
            quotations={quotations}
            downloading={downloading}
            isHold={isHold}
            onDownloadPdf={handleDownloadPdf}
            onDisable={handleDisableQuotation}
            onEnable={handleEnableQuotation}
            onEditQuotation={startEditing}
            onRemove={handleRemoveQuotation}
            t={tR}
          />
        )}
      </Paper>

      <CreateQuotationDialog
        meetingId={meetingId}
        mode='standard'
        open={createDialogOpen}
        onClose={closeCreateDialog}
        onCreated={handleQuotationCreated}
      />

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notification.severity} onClose={() => handleCloseNotification()} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
