import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

import { StandardMobileCard } from '@/components/shared/DataTable'
import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'
import type { CustomerMeeting } from '../../../types'

import { isYes, getCustomerFullName, formatDateTime, formatPrice } from './helpers'

interface MeetingMobileCardProps {
  meeting: CustomerMeeting
  hasCredential: (credential: string | string[][]) => boolean
  permittedFields: Set<string>
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  t: MeetingTranslations
}

function canSee(permittedFields: Set<string>, key: string): boolean {
  return permittedFields.size === 0 || permittedFields.has(key)
}

export default function MeetingMobileCard({ meeting, hasCredential, permittedFields, onEdit, onDelete, t }: MeetingMobileCardProps) {
  const confirmed = isYes(meeting.is_confirmed)
  const qualified = isYes(meeting.is_qualified)
  const active = meeting.status === 'ACTIVE'
  const meetingStatus = meeting.meeting_status

  return (
    <StandardMobileCard
      title={getCustomerFullName(meeting)}
      subtitle={`${t.mobileRef}: ${meeting.registration}`}
      status={meetingStatus ? {
        label: meetingStatus.value ?? meetingStatus.name,
        color: active ? 'success' : 'error'
      } : {
        label: active ? t.chipActive : t.chipInactive,
        color: active ? 'success' : 'error'
      }}
      fields={[
        { icon: 'ri-money-euro-circle-line', label: t.mobileAmount, value: formatPrice(meeting.turnover), hidden: !canSee(permittedFields, 'turnover') },
        { icon: 'ri-calendar-line', label: t.colDate, value: formatDateTime(meeting.in_at), hidden: !canSee(permittedFields, 'in_at') },
        { icon: 'ri-phone-line', value: meeting.customer?.phone || meeting.customer?.mobile || '-', hidden: !canSee(permittedFields, 'customer_phone') },
        { icon: 'ri-map-pin-line', value: meeting.customer?.address?.city || '-', hidden: !meeting.customer?.address?.city || !canSee(permittedFields, 'customer_city') },
        {
          icon: 'ri-checkbox-circle-line',
          value: (
            <Box className='flex gap-2'>
              <Chip variant='tonal' label={confirmed ? t.chipConfirmed : t.chipNotConfirmed} size='small' color={confirmed ? 'success' : 'warning'} />
              <Chip variant='tonal' label={qualified ? t.chipQualified : t.chipNotQualified} size='small' color={qualified ? 'success' : 'default'} />
            </Box>
          )
        }
      ]}
      actions={[
        ...(hasCredential([['superadmin', 'admin', 'meeting_view']]) ? [{ icon: 'ri-eye-line', color: 'default' as const, onClick: () => window.open(`/admin/meetings/${meeting.id}`, '_blank') }] : []),
        ...(hasCredential([['superadmin', 'admin', 'meeting_modify']]) ? [{ icon: 'ri-edit-box-line', color: 'primary' as const, onClick: () => onEdit(meeting.id) }] : []),
        ...(hasCredential([['superadmin', 'admin']]) ? [{ icon: 'ri-delete-bin-7-line', color: 'error' as const, onClick: () => onDelete(meeting.id) }] : [])
      ]}
      item={meeting}
    />
  )
}
