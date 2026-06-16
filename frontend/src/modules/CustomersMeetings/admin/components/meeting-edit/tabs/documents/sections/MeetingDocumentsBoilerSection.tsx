'use client'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

import BasePolluterMeetingDocumentsSection from './BasePolluterMeetingDocumentsSection'
import type { BasePolluterMeetingDocumentsSectionProps } from './BasePolluterMeetingDocumentsSection'

type Props = Omit<BasePolluterMeetingDocumentsSectionProps, 'polluterType'>

export default function MeetingDocumentsBoilerSection(props: Props) {
  const { hasCredential } = usePermissions()

  if (!hasCredential([['superadmin', 'app_domoprime_iso3_meeting_view_boiler_documents']])) {
    return null
  }

  return <BasePolluterMeetingDocumentsSection {...props} polluterType='BOILER' />
}
