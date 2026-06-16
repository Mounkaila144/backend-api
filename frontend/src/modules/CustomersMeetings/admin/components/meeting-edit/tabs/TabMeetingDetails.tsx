'use client'

import { useState } from 'react'

import type { UseFormReturn } from 'react-hook-form'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

import type {
  MeetingDetailsEditFormData,
  TeamEditFormData,
  CustomerEditFormData,
  DomoprimeEditFormData,
} from '../editFormSchema'
import type { CustomerMeeting, MeetingFilterOptions } from '../../../../types'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

import EditSubTabWorkType from './sub-tabs/EditSubTabWorkType'
import EditSubTabLeadTracking from './sub-tabs/EditSubTabLeadTracking'
import EditSubTabCustomerDetails from './sub-tabs/EditSubTabCustomerDetails'
import EditSubTabAssignment from './sub-tabs/EditSubTabAssignment'
import EditSubTabInstallation from './sub-tabs/EditSubTabInstallation'
import EditSubTabAdditional from './sub-tabs/EditSubTabAdditional'
import EditSubTabDocuments from './sub-tabs/EditSubTabDocuments'

interface TabMeetingDetailsProps {
  detailsForm: UseFormReturn<MeetingDetailsEditFormData>
  customerForm: UseFormReturn<CustomerEditFormData>
  teamForm: UseFormReturn<TeamEditFormData>
  domoprimeForm: UseFormReturn<DomoprimeEditFormData>
  meeting: CustomerMeeting | null
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
}

const SUB_TAB_STYLE = {
  minHeight: 40,
  minWidth: 80,
  textTransform: 'none' as const,
  fontWeight: 500,
  borderRadius: 1.5,
  transition: 'all 0.2s',
  color: 'text.secondary',
  fontSize: '0.8rem',
  '&.Mui-selected': {
    backgroundColor: 'primary.main',
    color: 'primary.contrastText',
    boxShadow: 1,
  },
}

export default function TabMeetingDetails({
  detailsForm,
  customerForm,
  teamForm,
  domoprimeForm,
  meeting,
  filterOptions,
  t,
}: TabMeetingDetailsProps) {
  const [activeSubTab, setActiveSubTab] = useState('0')

  return (
    <Box>
      <TabContext value={activeSubTab}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, px: 2 }}>
          <Box sx={{ backgroundColor: 'action.hover', borderRadius: 2, p: 0.5, display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            <TabList
              onChange={(_, val) => setActiveSubTab(val)}
              variant='scrollable'
              scrollButtons='auto'
              sx={{
                minHeight: 'auto',
                '& .MuiTabs-indicator': { display: 'none' },
                '& .MuiTabs-flexContainer': { gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' },
              }}
            >
              <Tab label={t.editSubTabWorkType} value='0' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabLeadTracking} value='1' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabCustomerDetails} value='2' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabAssignment} value='3' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabInstallation} value='4' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabAdditional} value='5' sx={SUB_TAB_STYLE} />
              <Tab label={t.editSubTabDocuments} value='6' sx={SUB_TAB_STYLE} />
            </TabList>
          </Box>
        </Box>

        <TabPanel value='0' sx={{ px: 0, py: 0 }}>
          <EditSubTabWorkType detailsForm={detailsForm} teamForm={teamForm} domoprimeForm={domoprimeForm} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='1' sx={{ px: 0, py: 0 }}>
          <EditSubTabLeadTracking detailsForm={detailsForm} teamForm={teamForm} meeting={meeting} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='2' sx={{ px: 0, py: 0 }}>
          <EditSubTabCustomerDetails customerForm={customerForm} meeting={meeting} t={t} />
        </TabPanel>

        <TabPanel value='3' sx={{ px: 0, py: 0 }}>
          <EditSubTabAssignment detailsForm={detailsForm} teamForm={teamForm} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='4' sx={{ px: 0, py: 0 }}>
          <EditSubTabInstallation detailsForm={detailsForm} teamForm={teamForm} meeting={meeting} filterOptions={filterOptions} t={t} />
        </TabPanel>

        <TabPanel value='5' sx={{ px: 0, py: 0 }}>
          <EditSubTabAdditional detailsForm={detailsForm} teamForm={teamForm} domoprimeForm={domoprimeForm} filterOptions={filterOptions} t={t} />
        </TabPanel>

        {/* Story M1 / mirror du sous-onglet contract `EditSubTabDocuments`:
            section ISO3 polluter-typée (PreMeeting PDF + résumé du dernier
            devis). Le grand onglet "Documents" reste réservé à l'upload de
            fichiers (CustomersDocuments). */}
        <TabPanel value='6' sx={{ px: 0, py: 0 }}>
          <EditSubTabDocuments meetingId={meeting?.id ?? null} meeting={meeting} t={t} />
        </TabPanel>
      </TabContext>
    </Box>
  )
}
