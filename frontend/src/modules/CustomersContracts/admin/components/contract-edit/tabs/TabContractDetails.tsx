'use client'

import { useState } from 'react'

import type { UseFormReturn } from 'react-hook-form'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import type {
  ContractDetailsFormData,
  CustomerEditFormData,
  IsoEditFormData,
  VerifEditFormData,
  TeamFinanceFormData,
} from '../editFormSchema'
import type { CustomerContract, ContractFilterOptions } from '../../../../types'
import type { DomoprimeFilterOptions } from '@/modules/AppDomoprime/types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

import EditSubTabCustomer from './sub-tabs/EditSubTabCustomer'
import EditSubTabDetails from './sub-tabs/EditSubTabDetails'
import EditSubTabIso from './sub-tabs/EditSubTabIso'
import EditSubTabTeamFinance from './sub-tabs/EditSubTabTeamFinance'
import EditSubTabDocuments from './sub-tabs/EditSubTabDocuments'
import TabIso3Results from './TabIso3Results'

interface TabContractDetailsProps {
  detailsForm: UseFormReturn<ContractDetailsFormData>
  customerForm: UseFormReturn<CustomerEditFormData>
  isoForm: UseFormReturn<IsoEditFormData>
  verifForm: UseFormReturn<VerifEditFormData>
  teamFinanceForm: UseFormReturn<TeamFinanceFormData>
  contract: CustomerContract | null
  filterOptions: ContractFilterOptions
  domoprimeOptions: DomoprimeFilterOptions
  contractId: number | null
  lang: string
  canViewIso3Results: boolean
  t: ContractTranslations
}

export default function TabContractDetails({
  detailsForm,
  customerForm,
  isoForm,
  verifForm,
  teamFinanceForm,
  contract,
  filterOptions,
  domoprimeOptions,
  contractId,
  lang,
  canViewIso3Results,
  t,
}: TabContractDetailsProps) {
  const [activeSubTab, setActiveSubTab] = useState('0')

  return (
    <Box>
      <TabContext value={activeSubTab}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 3,
            px: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'action.hover',
              borderRadius: 2,
              p: 0.5,
              display: 'inline-flex',
            }}
          >
            <TabList
              onChange={(_, val) => setActiveSubTab(val)}
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTabs-flexContainer': {
                  gap: 0.5,
                },
              }}
            >
              <Tab
                label={t.editSubTabDetails}
                value='0'
                sx={{
                  minHeight: 40,
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                  },
                  '&:hover': {
                    backgroundColor: activeSubTab === '0' ? 'primary.main' : 'action.selected',
                  },
                }}
              />
              <Tab
                label={t.editSubTabClient}
                value='1'
                sx={{
                  minHeight: 40,
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                  },
                  '&:hover': {
                    backgroundColor: activeSubTab === '1' ? 'primary.main' : 'action.selected',
                  },
                }}
              />
              <Tab
                label={t.editSubTabIso}
                value='2'
                sx={{
                  minHeight: 40,
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                  },
                  '&:hover': {
                    backgroundColor: activeSubTab === '2' ? 'primary.main' : 'action.selected',
                  },
                }}
              />
              <Tab
                label={t.editSubTabTeamFinance}
                value='3'
                sx={{
                  minHeight: 40,
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                  },
                  '&:hover': {
                    backgroundColor: activeSubTab === '3' ? 'primary.main' : 'action.selected',
                  },
                }}
              />
              <Tab
                label={t.editSubTabDocuments}
                value='4'
                sx={{
                  minHeight: 40,
                  minWidth: 100,
                  textTransform: 'none',
                  fontWeight: 500,
                  borderRadius: 1.5,
                  transition: 'all 0.2s',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    boxShadow: 1,
                  },
                  '&:hover': {
                    backgroundColor: activeSubTab === '4' ? 'primary.main' : 'action.selected',
                  },
                }}
              />
            </TabList>
          </Box>
        </Box>

        <TabPanel value='0' sx={{ px: 0, py: 0 }}>
          {canViewIso3Results ? (
            <TabIso3Results contractId={contractId} lang={lang} t={t} />
          ) : null}
          <EditSubTabDetails form={detailsForm} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='1' sx={{ px: 0, py: 0 }}>
          <EditSubTabCustomer form={customerForm} contract={contract} t={t} />
        </TabPanel>

        <TabPanel value='2' sx={{ px: 0, py: 0 }}>
          <EditSubTabIso
            form={isoForm}
            verifForm={verifForm}
            domoprimeOptions={domoprimeOptions}
            filterOptions={filterOptions}
            t={t}
          />
        </TabPanel>

        <TabPanel value='3' sx={{ px: 0, py: 0 }}>
          <EditSubTabTeamFinance form={teamFinanceForm} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='4' sx={{ px: 0, py: 0 }}>
          <EditSubTabDocuments contract={contract} contractId={contractId} t={t} />
        </TabPanel>
      </TabContext>
    </Box>
  )
}
