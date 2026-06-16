'use client'

import Alert from '@mui/material/Alert'

import type { CustomerContract } from '../../../../../types'
import type { ContractTranslations } from '../../../../hooks/useContractTranslations'

import { resolvePolluterType } from './documents/helpers'
import DocumentsITESection from './documents/sections/DocumentsITESection'
import DocumentsBoilerSection from './documents/sections/DocumentsBoilerSection'
import DocumentsPackSection from './documents/sections/DocumentsPackSection'
import DocumentsType1Section from './documents/sections/DocumentsType1Section'
import DocumentsType2Section from './documents/sections/DocumentsType2Section'
import DocumentsLegacySection from './documents/sections/DocumentsLegacySection'

interface EditSubTabDocumentsProps {
  contract: CustomerContract | null
  contractId: number | null
  t: ContractTranslations
}

export default function EditSubTabDocuments({
  contract,
  contractId,
  t,
}: EditSubTabDocumentsProps) {
  const hasPolluter = Boolean(contract?.polluter_id)

  if (!hasPolluter) {
    return (
      <Alert severity='info' sx={{ mt: 2 }}>
        {t.docNoPolluter}
      </Alert>
    )
  }

  // Equivalent of Symfony contract.tpl line 2:
  //   {if $contract->isHold() || (hasCredential('contract_view_hold_quote') && $contract->isHoldQuote())}
  //     compact HOLD layout (no documents)
  //   {else} normal layout with documents fieldset {/if}
  // We drop the credential gate — when the quote is locked, documents are not actionable
  // for any role, matching the observed Symfony UX for admin user 341 on contract 243.
  if (contract?.is_hold === 'YES') {
    return (
      <Alert severity='warning' sx={{ mt: 2 }}>
        {t.docContractOnHold}
      </Alert>
    )
  }

  if (contract?.is_hold_quote === 'YES') {
    return (
      <Alert severity='warning' sx={{ mt: 2 }}>
        {t.docContractHoldQuote}
      </Alert>
    )
  }

  const polluterCommercial = contract?.polluter?.commercial ?? contract?.polluter?.name ?? ''
  const polluterType = (contract?.polluter?.type?.toUpperCase() || resolvePolluterType(polluterCommercial)).toUpperCase()

  const sectionProps = { contract, contractId, t }

  switch (polluterType) {
    case 'ITE':
      return <DocumentsITESection {...sectionProps} />
    case 'BOILER':
      return <DocumentsBoilerSection {...sectionProps} />
    case 'PAC':
    case 'PACK':
      return <DocumentsPackSection {...sectionProps} />
    case 'TYPE1':
      return <DocumentsType1Section {...sectionProps} />
    case 'TYPE2':
      return <DocumentsType2Section {...sectionProps} />
    default:
      return <DocumentsLegacySection {...sectionProps} />
  }
}
