'use client'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

import BasePolluterDocumentsSection from './BasePolluterDocumentsSection'
import type { BasePolluterDocumentsSectionProps } from './BasePolluterDocumentsSection'

type Props = Omit<BasePolluterDocumentsSectionProps, 'polluterType'>

export default function DocumentsType1Section(props: Props) {
  const { hasCredential } = usePermissions()

  if (!hasCredential([['superadmin', 'app_domoprime_iso3_contract_view_type1_documents']])) {
    return null
  }

  return <BasePolluterDocumentsSection {...props} polluterType='TYPE1' />
}
