'use client'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

import BasePolluterMeetingDocumentsSection from './BasePolluterMeetingDocumentsSection'
import type { BasePolluterMeetingDocumentsSectionProps } from './BasePolluterMeetingDocumentsSection'

type Props = Omit<BasePolluterMeetingDocumentsSectionProps, 'polluterType'>

/**
 * Fallback section used when the meeting polluter type does not match any of
 * the 5 ISO3 specialised types (ITE/BOILER/PAC/TYPE1/TYPE2). Mirrors
 * Symfony's app_domoprime_iso/documentsForViewMeeting block.
 */
export default function MeetingDocumentsLegacySection(props: Props) {
  const { hasCredential } = usePermissions()

  if (!hasCredential([['superadmin', 'app_domoprime_iso_meeting_view_documents']])) {
    return null
  }

  return <BasePolluterMeetingDocumentsSection {...props} polluterType='ISO' />
}
