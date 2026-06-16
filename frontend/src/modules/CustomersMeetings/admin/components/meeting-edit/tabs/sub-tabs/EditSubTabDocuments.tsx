'use client'

import Alert from '@mui/material/Alert'

import { resolvePolluterType } from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/helpers'

import type { CustomerMeeting } from '../../../../../types'
import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'
import MeetingDocumentsITESection from '../documents/sections/MeetingDocumentsITESection'
import MeetingDocumentsBoilerSection from '../documents/sections/MeetingDocumentsBoilerSection'
import MeetingDocumentsPackSection from '../documents/sections/MeetingDocumentsPackSection'
import MeetingDocumentsType1Section from '../documents/sections/MeetingDocumentsType1Section'
import MeetingDocumentsType2Section from '../documents/sections/MeetingDocumentsType2Section'
import MeetingDocumentsLegacySection from '../documents/sections/MeetingDocumentsLegacySection'

interface EditSubTabDocumentsProps {
  meetingId: number | null
  meeting: CustomerMeeting | null
  t: MeetingTranslations
}

/**
 * Sub-tab "Documents" inside the meeting Rendez-vous tab — mirror of the
 * contract sub-tab `EditSubTabDocuments`.
 *
 * Routes to one of 6 polluter-typed sections based on the meeting's polluter.
 * Each section handles its own credential gate
 * (`app_domoprime_iso3_meeting_view_<type>_documents`).
 *
 * Hold gate parity with Symfony `_meeting_view_hold.tpl`: when the meeting is
 * hold or hold-quote, the documents fieldset is hidden.
 */
export default function EditSubTabDocuments({ meetingId, meeting, t }: EditSubTabDocumentsProps) {
  const tR = t as MeetingTranslations & Record<string, string>

  if (!meeting?.polluter_id) {
    return (
      <Alert severity='info' sx={{ mt: 2 }}>
        {tR.docNoPolluter ?? 'Ce meeting n\'a pas de polluter.'}
      </Alert>
    )
  }

  if (meeting.is_hold === 'YES') {
    return (
      <Alert severity='warning' sx={{ mt: 2 }}>
        {tR.docMeetingOnHold ?? 'Le meeting est bloqué.'}
      </Alert>
    )
  }

  if (meeting.is_hold_quote === 'YES') {
    return (
      <Alert severity='warning' sx={{ mt: 2 }}>
        {tR.docMeetingHoldQuote ?? 'Les devis de ce meeting sont bloqués.'}
      </Alert>
    )
  }

  const polluterCommercial = meeting.polluter?.commercial ?? meeting.polluter?.name ?? ''
  const polluterType = (meeting.polluter?.type?.toUpperCase() || resolvePolluterType(polluterCommercial)).toUpperCase()

  const sectionProps = { meeting, meetingId, t }

  switch (polluterType) {
    case 'ITE':
      return <MeetingDocumentsITESection {...sectionProps} />
    case 'BOILER':
      return <MeetingDocumentsBoilerSection {...sectionProps} />
    case 'PAC':
    case 'PACK':
      return <MeetingDocumentsPackSection {...sectionProps} />
    case 'TYPE1':
      return <MeetingDocumentsType1Section {...sectionProps} />
    case 'TYPE2':
      return <MeetingDocumentsType2Section {...sectionProps} />
    default:
      return <MeetingDocumentsLegacySection {...sectionProps} />
  }
}
