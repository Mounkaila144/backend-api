import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

import { StandardMobileCard } from '@/components/shared/DataTable'
import type { ContractTranslations } from '../../hooks/useContractTranslations'
import type { CustomerContract } from '../../../types'

import { isYes, getCustomerFullName, formatDate, formatPrice } from './helpers'

interface ContractMobileCardProps {
  contract: CustomerContract

  /** Action-level permission checks (view, edit, delete buttons) */
  hasCredential: (credential: string | string[][]) => boolean

  /** API-driven permitted field keys from backend meta.permitted_fields */
  permittedFields: Set<string>
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  t: ContractTranslations
}

/** Check if a field is permitted. Empty set = allow all (first load). */
function canSee(permittedFields: Set<string>, key: string): boolean {
  return permittedFields.size === 0 || permittedFields.has(key)
}

export default function ContractMobileCard({ contract, hasCredential, permittedFields, onEdit, onDelete, t }: ContractMobileCardProps) {
  const confirmed = isYes(contract.is_confirmed) || contract.confirme
  const billable = isYes(contract.is_billable) || contract.facturable
  const active = contract.status === 'ACTIVE' || contract.actif
  const contractStatus = contract.contract_status || contract.status_contrat

  return (
    <StandardMobileCard
      title={getCustomerFullName(contract)}
      subtitle={`${t.mobileRef}: ${contract.reference}`}
      status={contractStatus ? {
        label: contractStatus.name,
        color: active ? 'success' : 'error'
      } : {
        label: active ? t.chipActive : t.chipInactive,
        color: active ? 'success' : 'error'
      }}
      fields={[
        { icon: 'ri-money-euro-circle-line', label: t.mobileAmount, value: formatPrice(contract.total_price_with_taxe ?? contract.montant_ttc) },
        { icon: 'ri-calendar-line', label: t.colDate, value: formatDate(contract.opened_at || contract.date_ouverture), hidden: !canSee(permittedFields, 'opened_at') },
        { icon: 'ri-phone-line', value: contract.customer?.phone || contract.customer?.mobile || '-', hidden: !canSee(permittedFields, 'customer_phone') },
        { icon: 'ri-map-pin-line', value: contract.customer?.address?.city || '-', hidden: !contract.customer?.address?.city || !canSee(permittedFields, 'customer_city') },
        {
          icon: 'ri-checkbox-circle-line',
          value: (
            <Box className='flex gap-2'>
              <Chip variant='tonal' label={confirmed ? t.chipConfirmed : t.chipNotConfirmed} size='small' color={confirmed ? 'success' : 'warning'} />
              <Chip variant='tonal' label={billable ? t.chipBillable : t.chipNotBillable} size='small' color={billable ? 'success' : 'error'} />
            </Box>
          )
        }
      ]}
      actions={[
        ...(hasCredential([['superadmin', 'admin', 'contract_view']]) ? [{ icon: 'ri-eye-line', color: 'default' as const, onClick: () => window.open(`/admin/contracts/${contract.id}`, '_blank') }] : []),
        ...(hasCredential([['superadmin', 'admin', 'contract_modify']]) ? [{ icon: 'ri-edit-box-line', color: 'primary' as const, onClick: () => onEdit(contract.id) }] : []),
        ...(hasCredential([['superadmin', 'admin']]) ? [{ icon: 'ri-delete-bin-7-line', color: 'error' as const, onClick: () => onDelete(contract.id) }] : [])
      ]}
      item={contract}
    />
  )
}
