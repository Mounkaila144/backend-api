'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import {
  POLLUTER_TYPE_SUFFIXES,
  formatDate,
} from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/helpers'
import DocumentLinkRow from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/DocumentLinkRow'
import CreateQuotationDialog from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/CreateQuotationDialog'

import type { CustomerMeeting } from '../../../../../../types'
import type { MeetingTranslations } from '../../../../../hooks/useMeetingTranslations'
import { useMeetingDocumentState } from '../useMeetingDocumentState'

export type PolluterType = 'ITE' | 'BOILER' | 'PAC' | 'TYPE1' | 'TYPE2' | 'ISO'

export interface BasePolluterMeetingDocumentsSectionProps {
  meeting: CustomerMeeting | null
  meetingId: number | null
  t: MeetingTranslations
  polluterType: PolluterType
}

export default function BasePolluterMeetingDocumentsSection({
  meeting,
  meetingId,
  t,
  polluterType,
}: BasePolluterMeetingDocumentsSectionProps) {
  const tR = t as MeetingTranslations & Record<string, string>
  const { hasCredential } = usePermissions()

  const polluterCommercial = meeting?.polluter?.commercial ?? meeting?.polluter?.name ?? '-'
  const suffix = POLLUTER_TYPE_SUFFIXES[polluterType] ?? ''
  const sectionTitle = `${tR.docDocumentsFor ?? 'Documents pour'} ${polluterCommercial}${suffix ? ` ${suffix}` : ''}`

  const canViewPreMeeting = hasCredential([['superadmin', 'app_domoprime_meeting_view_premeeting_document']])
  // Symfony: app_domoprime_iso_meeting_view_quotations gates the quotations
  // block. We accept the contract credential as fallback while meeting-side
  // credentials are seeded — admins must not lose access.
  const canViewQuotations = hasCredential([['superadmin',
    'app_domoprime_iso_meeting_view_quotations',
    'app_domoprime_iso_contract_view_quotations',
  ]])

  const {
    loading,
    error,
    downloading,
    activeQuotations,
    lastQuotation,
    handleDownloadPdf,
    handleDisableQuotation,
    handleEnableQuotation,
    handleDownloadPreMeetingPdf,
    notification,
    handleCloseNotification,
    createDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    handleQuotationCreated,
  } = useMeetingDocumentState(meetingId, tR)

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  const customerMissing = !meeting?.customer_id

  return (
    <Box data-polluter-type={polluterType}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <i className='ri-file-text-line' style={{ fontSize: 20 }} />
        <Typography variant='h6'>{sectionTitle}</Typography>
      </Box>

      {customerMissing ? (
        <Alert severity='info' sx={{ mb: 2 }}>
          {tR.docMeetingNoCustomer ?? 'Ce meeting n\'a pas encore de client. Aucun devis ne peut être créé.'}
        </Alert>
      ) : null}

      {/* 1. Document de pré visite */}
      {canViewPreMeeting && meeting?.polluter_id ? (
        <DocumentLinkRow
          icon='ri-file-user-line'
          label={tR.docPreMeeting ?? 'Document de pré visite'}
          available
          loading={downloading === `premeeting-${meetingId}`}
          onClick={handleDownloadPreMeetingPdf}
        />
      ) : null}

      {/* 2. Devis attachés au meeting */}
      {canViewQuotations ? (
        <Box sx={{ mt: 2 }}>
          {activeQuotations.length === 0 ? (
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography variant='body2' color='text.secondary'>
                {tR.docNoQuotations ?? 'Aucun devis trouvé'}
              </Typography>
              <Tooltip title={tR.docActionNewQuotation ?? 'Nouveau devis'}>
                <span>
                  <IconButton
                    size='small'
                    color='primary'
                    onClick={openCreateDialog}
                    disabled={customerMissing}
                  >
                    <i className='ri-add-line' />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Stack direction='row' alignItems='center' spacing={1} flexWrap='wrap'>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {tR.docLastQuotation ?? 'Dernier devis'}: {lastQuotation?.reference ?? `DEV-${lastQuotation?.id}`}
                </Typography>
                <Chip
                  size='small'
                  label={lastQuotation?.status ?? 'ACTIVE'}
                  color={lastQuotation?.status === 'ACTIVE' ? 'success' : 'default'}
                />
                {lastQuotation?.dated_at ? (
                  <Typography variant='caption' color='text.secondary'>
                    {formatDate(lastQuotation.dated_at)}
                  </Typography>
                ) : null}

                <Tooltip title={tR.docActionDownloadPdf ?? 'Télécharger PDF'}>
                  <span>
                    <IconButton
                      size='small'
                      onClick={() =>
                        lastQuotation &&
                        handleDownloadPdf(lastQuotation.id, lastQuotation.reference ?? '')
                      }
                      disabled={!lastQuotation || downloading === `pdf-${lastQuotation?.id}`}
                    >
                      <i className='ri-download-line' />
                    </IconButton>
                  </span>
                </Tooltip>

                {lastQuotation?.status === 'ACTIVE' ? (
                  <Tooltip title={tR.docActionDisable ?? 'Désactiver'}>
                    <IconButton
                      size='small'
                      color='warning'
                      onClick={() => handleDisableQuotation(lastQuotation.id)}
                    >
                      <i className='ri-close-circle-line' />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title={tR.docActionEnable ?? 'Réactiver'}>
                    <IconButton
                      size='small'
                      color='success'
                      onClick={() => lastQuotation && handleEnableQuotation(lastQuotation.id)}
                    >
                      <i className='ri-check-line' />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title={tR.docActionNewQuotation ?? 'Nouveau devis'}>
                  <span>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={openCreateDialog}
                      disabled={customerMissing}
                    >
                      <i className='ri-add-line' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              {activeQuotations.length > 1 ? (
                <Typography variant='caption' color='text.secondary'>
                  {(tR.docTotalQuotations ?? '{count} devis au total').replace('{count}', String(activeQuotations.length))}
                </Typography>
              ) : null}
            </Stack>
          )}
        </Box>
      ) : null}

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
