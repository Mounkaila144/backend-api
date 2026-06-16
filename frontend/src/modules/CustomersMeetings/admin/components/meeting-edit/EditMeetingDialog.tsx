'use client'

import { useEffect, useState, useCallback } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

import type { AxiosError } from 'axios'

import { meetingsService } from '../../services/meetingsService'
import { usePermissions } from '@/shared/contexts/PermissionsContext'

import { useEditMeetingState } from './useEditMeetingState'
import { useMeetingTranslations } from '../../hooks/useMeetingTranslations'
import TabMeetingDetails from './tabs/TabMeetingDetails'
import TabCalculSubvention from './tabs/TabCalculSubvention'
import TabResultsAnah from './tabs/TabResultsAnah'
import TabQuotations from './tabs/TabQuotations'
import TabComments from './tabs/TabComments'
import TabRequests from './tabs/TabRequests'
import TabInformations from './tabs/TabInformations'
import TabDocuments from './tabs/TabDocuments'
import TabLogs from './tabs/TabLogs'
import TabSms from './tabs/TabSms'
import TabDuplicateMobile from './tabs/TabDuplicateMobile'

import type { CustomerMeeting, UpdateMeetingData, MeetingFilterOptions } from '../../../types'

interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

interface EditMeetingDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: number, data: UpdateMeetingData) => Promise<void>
  meetingId: number | null
  onFetchMeeting: (id: number) => Promise<CustomerMeeting | null>
  filterOptions: MeetingFilterOptions
}

interface TabDef {
  key: string
  labelKey: string
  icon: string
}

const TABS: TabDef[] = [
  { key: 'meeting', labelKey: 'editTabMeeting', icon: 'ri-calendar-check-line' },
  { key: 'calcul-subvention', labelKey: 'editTabCalculSubvention', icon: 'ri-calculator-line' },
  { key: 'results-anah', labelKey: 'editTabResultsAnah', icon: 'ri-bar-chart-box-line' },
  { key: 'quotations', labelKey: 'editTabQuotations', icon: 'ri-file-text-line' },
  { key: 'comments', labelKey: 'editTabComments', icon: 'ri-chat-3-line' },
  { key: 'requests', labelKey: 'editTabRequests', icon: 'ri-send-plane-line' },
  { key: 'informations', labelKey: 'editTabInformations', icon: 'ri-information-line' },
  { key: 'documents', labelKey: 'editTabDocuments', icon: 'ri-folder-line' },
  { key: 'logs', labelKey: 'editTabLogs', icon: 'ri-file-list-3-line' },
  { key: 'sms', labelKey: 'editTabSms', icon: 'ri-message-2-line' },
  { key: 'duplicate-mobile', labelKey: 'editTabDuplicateMobile', icon: 'ri-smartphone-line' },
]

export default function EditMeetingDialog({
  isOpen,
  onClose,
  onUpdate,
  meetingId,
  onFetchMeeting,
  filterOptions,
}: EditMeetingDialogProps) {
  const t = useMeetingTranslations()

  const {
    activeTab,
    setActiveTab,
    meeting,
    loading,
    submitting,
    setSubmitting,
    error,
    setError,
    detailsForm,
    teamForm,
    customerForm,
    domoprimeForm,
    loadMeeting,
    getFormData,
    resetAll,
  } = useEditMeetingState()

  // Load meeting when dialog opens
  useEffect(() => {
    if (isOpen && meetingId) {
      loadMeeting(meetingId, onFetchMeeting)
    }

    if (!isOpen) {
      resetAll()
    }
  }, [isOpen, meetingId, loadMeeting, onFetchMeeting, resetAll])

  const tR = t as Record<string, string>
  const { hasCredential } = usePermissions()

  const [transforming, setTransforming] = useState(false)
  const [transformNotice, setTransformNotice] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const canTransform = Boolean(
    meeting?.customer_id &&
    meeting?.polluter_id &&
    hasCredential([['superadmin', 'customer_meeting_transform_to_contract']])
  )

  const handleTransformToContract = useCallback(async () => {
    if (!meetingId || !canTransform) return
    if (!window.confirm(tR.transformToContractConfirm ?? 'Transformer en contrat ?')) return

    setTransforming(true)
    setError(null)

    try {
      const res = await meetingsService.createContract(meetingId)

      if (!res.success) {
        const message = res.message ?? (tR.transformError ?? 'Erreur')
        setTransformNotice({ open: true, message, severity: 'error' })
        return
      }

      const reference = res.reference ?? `CT-${res.contract_id ?? ''}`
      const tpl = res.already_existed
        ? (tR.transformAlreadyExists ?? 'Contrat déjà existant : {reference}')
        : (tR.transformSuccess ?? 'Contrat créé : {reference}')
      const message = tpl.replace('{reference}', reference)

      const migratedTpl = tR.transformQuotationsMigrated ?? '{count} devis migrés'
      const migratedMsg = (res.quotations_migrated ?? 0) > 0
        ? ` — ${migratedTpl.replace('{count}', String(res.quotations_migrated))}`
        : ''

      setTransformNotice({ open: true, message: message + migratedMsg, severity: 'success' })

      // Refresh the meeting so any state changes (state_id) propagate.
      if (meetingId) {
        await loadMeeting(meetingId, onFetchMeeting)
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const responseMessage = axiosErr?.response?.data?.message
      setTransformNotice({
        open: true,
        message: responseMessage ?? (tR.transformError ?? 'Erreur lors de la transformation'),
        severity: 'error',
      })
    } finally {
      setTransforming(false)
    }
  }, [meetingId, canTransform, tR, setError, loadMeeting, onFetchMeeting])

  const handleSave = useCallback(async () => {
    if (!meetingId) return

    setSubmitting(true)
    setError(null)

    try {
      const data = getFormData()

      await onUpdate(meetingId, data)
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const responseData = axiosErr?.response?.data

      if (responseData?.errors) {
        const messages = Object.values(responseData.errors).flat()

        setError(messages.join('\n'))
      } else if (responseData?.message) {
        setError(responseData.message)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setSubmitting(false)
    }
  }, [meetingId, getFormData, onUpdate, onClose, setSubmitting, setError])

  const tabValue = String(activeTab)

  const getTabLabel = (tab: TabDef): string => {
    return (t as Record<string, string>)[tab.labelKey] ?? tab.key
  }

  const renderTabContent = (key: string) => {
    switch (key) {
      case 'meeting':
        return (
          <TabMeetingDetails
            detailsForm={detailsForm}
            customerForm={customerForm}
            teamForm={teamForm}
            domoprimeForm={domoprimeForm}
            meeting={meeting}
            filterOptions={filterOptions}
            t={t}
          />
        )
      case 'calcul-subvention':
        return <TabCalculSubvention meetingId={meetingId} t={t} />
      case 'results-anah':
        return <TabResultsAnah meetingId={meetingId} t={t} />
      case 'quotations':
        return <TabQuotations meetingId={meetingId} meeting={meeting} t={t} />
      case 'comments':
        return <TabComments meetingId={meetingId} t={t} />
      case 'requests':
        return <TabRequests meetingId={meetingId} t={t} />
      case 'informations':
        return <TabInformations meetingId={meetingId} t={t} />
      case 'documents':
        return <TabDocuments meetingId={meetingId} t={t} />
      case 'logs':
        return <TabLogs meetingId={meetingId} t={t} />
      case 'sms':
        return <TabSms meetingId={meetingId} t={t} />
      case 'duplicate-mobile':
        return <TabDuplicateMobile meetingId={meetingId} t={t} />
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth='xl' fullWidth>
      {submitting ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1301 }} /> : null}

      <AppBar sx={{ position: 'sticky', top: 0, zIndex: 1 }} color='default' elevation={1}>
        <Toolbar>
          <IconButton edge='start' onClick={onClose} aria-label='close'>
            <i className='ri-close-line' />
          </IconButton>
          <Box sx={{ flex: 1, ml: 2 }}>
            <Typography variant='h6' component='span'>{t.editMeeting}</Typography>
            {meeting?.registration ? (
              <Typography variant='body2' color='text.secondary'>
                Ref: {meeting.registration}
              </Typography>
            ) : null}
          </Box>
          {canTransform ? (
            <Button
              color='success'
              variant='outlined'
              startIcon={<i className='ri-arrow-right-line' />}
              onClick={handleTransformToContract}
              disabled={transforming || submitting || loading}
              sx={{ mr: 1 }}
            >
              {transforming ? '…' : (tR.transformToContract ?? 'Transformer en contrat')}
            </Button>
          ) : null}
          <Button color='secondary' onClick={onClose} sx={{ mr: 1 }}>
            {t.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={submitting || loading}
          >
            {submitting ? t.updating : t.updateMeeting}
          </Button>
        </Toolbar>
      </AppBar>

      <Snackbar
        open={transformNotice.open}
        autoHideDuration={6000}
        onClose={() => setTransformNotice(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={transformNotice.severity}
          onClose={() => setTransformNotice(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {transformNotice.message}
        </Alert>
      </Snackbar>

      <DialogContent sx={{ p: 0 }}>
        {error ? (
          <Alert severity='error' sx={{ m: 2, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <TabList
                onChange={(_, val) => setActiveTab(Number(val))}
                variant='scrollable'
                scrollButtons={true}
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTabs-scrollButtons': {
                    width: 40,
                    color: 'primary.main',
                    backgroundColor: 'background.paper',
                    boxShadow: 1,
                    borderRadius: 1,
                    my: 'auto',
                    '&.Mui-disabled': { opacity: 0.3 },
                    '&:hover': { backgroundColor: 'action.hover' },
                  },
                  '& .MuiTabs-scroller': {
                    overflowX: 'auto !important',
                    scrollbarWidth: 'thin',
                  },
                }}
              >
                {TABS.map((tab, index) => (
                  <Tab
                    key={tab.key}
                    label={getTabLabel(tab)}
                    value={String(index)}
                    icon={<i className={tab.icon} />}
                    iconPosition='start'
                    sx={{
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                  />
                ))}
              </TabList>
            </Box>

            {TABS.map((tab, index) => (
              <TabPanel key={tab.key} value={String(index)} sx={{ p: 3 }}>
                {renderTabContent(tab.key)}
              </TabPanel>
            ))}
          </TabContext>
        )}
      </DialogContent>
    </Dialog>
  )
}
