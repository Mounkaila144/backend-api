'use client'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

import BasePolluterMeetingDocumentsSection from './BasePolluterMeetingDocumentsSection'
import type { BasePolluterMeetingDocumentsSectionProps } from './BasePolluterMeetingDocumentsSection'

type Props = Omit<BasePolluterMeetingDocumentsSectionProps, 'polluterType'>

export default function MeetingDocumentsType2Section(props: Props) {
  const { hasCredential } = usePermissions()

  if (!hasCredential([['superadmin', 'app_domoprime_iso3_meeting_view_type2_documents']])) {
    return null
  }

  return <BasePolluterMeetingDocumentsSection {...props} polluterType='TYPE2' />
}
