'use client'

import { useEffect, useCallback, useMemo } from 'react'

import { useParams } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

import type { AxiosError } from 'axios'
import type { UseFormReturn } from 'react-hook-form'

import { useEditContractState } from './useEditContractState'
import { useEditPermissions } from './useEditPermissions'
import { useFilterOptions } from '../../hooks/useFilterOptions'
import { useContractTranslations } from '../../hooks/useContractTranslations'
import { useContractTabs } from '../../hooks/useContractTabs'
import { useDomoprimeFilterOptions } from '@/modules/AppDomoprime'
import { domoprimeIsoService } from '@/modules/AppDomoprime/admin/services/domoprimeService'
import TabContractDetails from './tabs/TabContractDetails'
import TabAttributions from './tabs/TabAttributions'
import TabMeetingForms from './tabs/TabMeetingForms'
import TabProducts from './tabs/TabProducts'
import TabComments from './tabs/TabComments'
import TabEmails from './tabs/TabEmails'
import TabSms from './tabs/TabSms'
import TabDocuments from './tabs/TabDocuments'
import TabInstallations from './tabs/TabInstallations'
import TabMap from './tabs/TabMap'
import TabBilling from './tabs/TabBilling'
import TabWhatsApp from './tabs/TabWhatsApp'
import TabDocCheck from './tabs/TabDocCheck'
import TabSteps from './tabs/TabSteps'
import TabIso3Results from './tabs/TabIso3Results'
import TabAnahResults from './tabs/TabAnahResults'
import TabRequests from './tabs/TabRequests'
import TabAssets from './tabs/TabAssets'
import TabPlaceholder from './tabs/TabPlaceholder'

import type { CustomerContract, UpdateContractData, ContractTab, ContractFilterOptions } from '../../../types'
import type { TeamFinanceFormData } from './editFormSchema'
import type { ContractTranslations } from '../../hooks/useContractTranslations'

interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

interface EditContractDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: number, data: UpdateContractData) => Promise<void>
  contractId: number | null
  onFetchContract: (id: number) => Promise<CustomerContract | null>
}

/**
 * The first tab "Contrat" is always present (like in Symfony's ajaxViewContract.tpl).
 * The remaining tabs come dynamically from the TabsManager API,
 * filtered by user credentials on the server side.
 */
const STATIC_TAB: ContractTab = {
  key: 'contrat',
  title: 'Contract',
  icon: 'ri-file-list-line',
  component: 'contract-details',
  help: null,
  module: 'CustomersContracts',
}

/**
 * Maps a dynamic tab's component key to the React component to render.
 * Tabs whose component key is not in this map get the placeholder.
 *
 * Component keys match the 'component' field from Config/tabs.php in Laravel,
 * which mirrors Symfony's tab component names.
 */
function renderDynamicTabContent(
  tab: ContractTab,
  props: {
    contractId: number | null
    lang: string
    teamFinanceForm: UseFormReturn<TeamFinanceFormData>
    filterOptions: ContractFilterOptions
    filterOptionsLoading: boolean
    onSave: () => Promise<void> | void
    t: ContractTranslations
  },
) {
  switch (tab.component) {
    // ── Template hardcoded tabs (before TabsManager) ──

    // Calcul Subvention (Symfony: app_domoprime_iso3/PanelResultsForViewContract)
    // Uses the same ISO3 results engine as the sub-tab in ContractDetails
    case 'contract-calcul-subvention':
      return <TabIso3Results contractId={props.contractId} lang={props.lang} t={props.t} />

    // Résultats ANAH (Symfony: app_domoprime_iso3/PanelAnaResultsForViewContract)
    // Separate ANAH-only endpoint and component (different from Calcul Subvention)
    case 'contract-resultats-anah':
      return <TabAnahResults contractId={props.contractId} lang={props.lang} t={props.t} />

    // Requests (Symfony: app_domoprime/ListPartialRequestForContract)
    case 'contract-requests':
      return <TabRequests contractId={props.contractId} t={props.t} />

    // ── TabsManager tabs ──

    // Products tab
    case 'contract-products':
      return <TabProducts contractId={props.contractId} t={props.t} />

    // Informations/Forms tab (Symfony: CustomerMeetingViewFormsForContractForm - dynamic forms)
    case 'contract-forms':
      return <TabMeetingForms contractId={props.contractId} t={props.t} />

    // Attributions tab (fully independent from contract edit - like Symfony)
    case 'contract-attributions':
    case 'contract-attributions-team':
      return <TabAttributions contractId={props.contractId} t={props.t} />

    // Comments tab
    case 'contract-comments':
      return <TabComments contractId={props.contractId} t={props.t} />

    // Emails tab
    case 'contract-emails':
      return <TabEmails contractId={props.contractId} t={props.t} />

    // SMS tab
    case 'contract-sms':
      return <TabSms contractId={props.contractId} t={props.t} />

    // Documents tab
    case 'contract-documents':
      return <TabDocuments contractId={props.contractId} t={props.t} />

    // Installations tab
    case 'contract-installations':
      return <TabInstallations contractId={props.contractId} t={props.t} />

    // Map / Carte tab
    case 'contract-map':
    case 'contract-localisation':
      return <TabMap contractId={props.contractId} t={props.t} />

    // Factures / Billing (Domoprime: app_domoprime/ListPartialBillingForContract)
    case 'contract-billing':
      return <TabBilling contractId={props.contractId} t={props.t} />

    // Avoirs / Assets (Domoprime: app_domoprime/ListPartialAssetForContract)
    case 'contract-billing-assets':
      return <TabAssets contractId={props.contractId} t={props.t} />

    // Billing module tabs (from customers_contracts_billing module - currently disabled)
    case 'contract-billing-module':
    case 'contract-billing-assets-module':
    case 'contract-billing-forecasts':
    case 'contract-billing-payments':
    case 'contract-billing-paid':
    case 'contract-billing-payments-combined':
      return <TabBilling contractId={props.contractId} t={props.t} />

    // WhatsApp tab
    case 'contract-whatsapp':
      return <TabWhatsApp contractId={props.contractId} variant='customer' t={props.t} />

    // Partner WhatsApp tab
    case 'contract-partner-whatsapp':
      return <TabWhatsApp contractId={props.contractId} variant='partner' t={props.t} />

    // Doc Check tab
    case 'contract-documents-check':
      return <TabDocCheck contractId={props.contractId} t={props.t} />

    // Steps / Démarches tab
    case 'contract-steps':
      return <TabSteps contractId={props.contractId} t={props.t} />

    // Fidealis tab (Symfony: services_fidealis/ListPartialDocumentForContract)
    case 'contract-fidealis':
      return <TabPlaceholder tabName={tab.title} icon={tab.icon || 'ri-shield-star-line'} t={props.t} />

    default:
      return (
        <TabPlaceholder
          tabName={tab.title}
          icon={tab.icon || 'ri-function-line'}
          t={props.t}
        />
      )
  }
}

export default function EditContractDialog({
  isOpen,
  onClose,
  onUpdate,
  contractId,
  onFetchContract,
}: EditContractDialogProps) {
  const t = useContractTranslations()
  const { lang } = useParams<{ lang: string }>()
  const { canEdit } = useEditPermissions()
  const { filterOptions, filterOptionsLoading } = useFilterOptions()
  const { filterOptions: domoprimeOptions } = useDomoprimeFilterOptions()

  // Dynamic tabs from API (filtered by user credentials server-side)
  const { tabs: dynamicTabs, loading: tabsLoading } = useContractTabs()

  const canViewIso3Results = canEdit('app_domoprime_iso3_contract_view_cumac_results')

  const {
    activeTab,
    setActiveTab,
    contract,
    loading,
    submitting,
    setSubmitting,
    error,
    setError,
    detailsForm,
    teamFinanceForm,
    customerForm,
    isoForm,
    verifForm,
    loadContract,
    getFormData,
    resetAll,
  } = useEditContractState()

  // Merge: static "Contrat" tab + dynamic tabs from API
  const allTabs = useMemo<ContractTab[]>(() => {
    return [STATIC_TAB, ...dynamicTabs]
  }, [dynamicTabs])

  // Load contract when dialog opens
  useEffect(() => {
    if (isOpen && contractId) {
      const fetchIsoData = async (id: number): Promise<Record<string, unknown> | null> => {
        try {
          const response = await domoprimeIsoService.getByContractId(id)

          
return response.success ? (response.data as unknown as Record<string, unknown>) : null
        } catch (error) {
          console.error('Failed to load ISO data:', error)
          
return null
        }
      }

      loadContract(contractId, onFetchContract, fetchIsoData)
    }

    if (!isOpen) {
      resetAll()
    }
  }, [isOpen, contractId, loadContract, onFetchContract, resetAll])

  const handleSave = useCallback(async () => {
    if (!contractId) return

    setSubmitting(true)
    setError(null)

    try {
      const data = getFormData()

      await onUpdate(contractId, data)
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
  }, [contractId, getFormData, onUpdate, onClose, setSubmitting, setError])

  const tabValue = String(activeTab)

  const renderTabContent = (tab: ContractTab, index: number) => {
    // First tab is always the contract details (static)
    if (index === 0) {
      return (
        <TabContractDetails
          detailsForm={detailsForm}
          customerForm={customerForm}
          isoForm={isoForm}
          verifForm={verifForm}
          teamFinanceForm={teamFinanceForm}
          contract={contract}
          filterOptions={filterOptions}
          domoprimeOptions={domoprimeOptions}
          contractId={contractId}
          lang={lang || 'fr'}
          canViewIso3Results={canViewIso3Results}
          t={t}
        />
      )
    }

    // Dynamic tabs: map component key to React component
    return renderDynamicTabContent(tab, {
      contractId,
      lang: lang || 'fr',
      teamFinanceForm,
      filterOptions,
      filterOptionsLoading,
      onSave: handleSave,
      t,
    })
  }

  const isLoading = loading || tabsLoading

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth='xl' fullWidth>
      {submitting ? <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1301 }} /> : null}

      <AppBar sx={{ position: 'sticky', top: 0, zIndex: 1 }} color='default' elevation={1}>
        <Toolbar>
          <IconButton edge='start' onClick={onClose} aria-label='close'>
            <i className='ri-close-line' />
          </IconButton>
          <Box sx={{ flex: 1, ml: 2 }}>
            <Typography variant='h6' component='span'>{t.editContract}</Typography>
            {contract?.reference ? (
              <Typography variant='body2' color='text.secondary'>
                {t.referenceLabel}: {contract.reference}
              </Typography>
            ) : null}
          </Box>
          <Button color='secondary' onClick={onClose} sx={{ mr: 1 }}>
            {t.cancel}
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={submitting || isLoading}
          >
            {submitting ? t.editSaving : t.editSave}
          </Button>
        </Toolbar>
      </AppBar>

      <DialogContent sx={{ p: 0 }}>
        {error ? (
          <Alert severity='error' sx={{ m: 2, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TabContext value={tabValue}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
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
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                  '& .MuiTabs-scrollButtons.MuiTabScrollButton-horizontal': {
                    height: 36,
                  },
                  '& .MuiTabs-scroller': {
                    overflowX: 'auto !important',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                      height: 6,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'action.hover',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'primary.main',
                      borderRadius: 3,
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                {allTabs.map((tab, index) => (
                  <Tab
                    key={tab.key}
                    label={tab.title}
                    value={String(index)}
                    icon={<i className={tab.icon || 'ri-function-line'} />}
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

            {allTabs.map((tab, index) => (
              <TabPanel key={tab.key} value={String(index)} sx={{ p: 3 }}>
                {renderTabContent(tab, index)}
              </TabPanel>
            ))}
          </TabContext>
        )}
      </DialogContent>
    </Dialog>
  )
}
