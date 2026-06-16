import type { ReactNode } from 'react'

import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'
import type { CustomerMeeting } from '../../../types'
import type { ChipColor } from './helpers'
import { isYes, formatDateTime } from './helpers'

export type HasCredentialFn = (credential: string | string[] | string[][], requireAll?: boolean) => boolean

export const textCell = (value: any, className?: string, color?: string): ReactNode => (
  <Typography variant='body2' {...(className && { className })} {...(color && { color })}>
    {value ?? '-'}
  </Typography>
)

export const booleanChip = (
  value: boolean,
  trueLabel: string,
  falseLabel: string,
  trueColor: ChipColor = 'success',
  falseColor: ChipColor = 'warning'
): ReactNode => (
  <Chip variant='tonal' label={value ? trueLabel : falseLabel} size='small' color={value ? trueColor : falseColor} />
)

export const statusChip = (status: { name?: string; value?: string; color?: string } | null | undefined): ReactNode => {
  if (!status) return <Typography variant='body2'>-</Typography>
  
return (
    <Chip
      label={status.value ?? status.name}
      size='small'
      sx={{ backgroundColor: status.color || undefined, color: status.color ? '#fff' : undefined }}
    />
  )
}

// ─── Date Cell with sub-dates ─────────────────────────────────────────────────

interface SubDateDef {
  credential: string[][]
  field: keyof CustomerMeeting
  label: string
  showAlways: boolean
}

function getSubDateDefs(t: MeetingTranslations): SubDateDef[] {
  return [
    { credential: [['superadmin', 'admin', 'meeting_view_list_callback_datetime']],
      field: 'callback_at', label: t.dateCallback, showAlways: true },
    { credential: [['superadmin', 'admin', 'meeting_list_out_at']],
      field: 'out_at', label: t.dateOut, showAlways: false },
    { credential: [['superadmin', 'admin', 'meeting_list_opc_at']],
      field: 'opc_at', label: t.dateOpc, showAlways: false },
    { credential: [['superadmin', 'admin', 'meeting_view_list_treatment_date']],
      field: 'treated_at', label: t.dateTreated, showAlways: false },
    { credential: [['superadmin', 'admin', 'meeting_list_confirmed_at']],
      field: 'confirmed_at', label: t.dateConfirmed, showAlways: false },
    { credential: [['superadmin', 'admin', 'meeting_view_list_created_date']],
      field: 'created_at', label: t.dateBookedIn, showAlways: false },
    { credential: [['superadmin', 'admin', 'meeting_view_list_creation_date']],
      field: 'creation_at', label: t.dateCreation, showAlways: false },
  ]
}

export const dateCellMultiLine = (
  r: CustomerMeeting,
  t: MeetingTranslations,
  hasCredential: HasCredentialFn
): ReactNode => {
  const holdFlags: ReactNode[] = []

  if (isYes(r.is_hold)) {
    holdFlags.push(
      <Chip key='hold' label='H' size='small' color='warning' sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }} />
    )
  }

  if (isYes(r.is_locked)) {
    holdFlags.push(
      <Chip key='locked' label='L' size='small' color='error' sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }} />
    )
  }

  const showInAt = hasCredential([['admin', 'meeting_list_in_at']])
  const showOpcRange = hasCredential([['superadmin', 'meeting_list_view_opc_range']])

  const subDateDefs = getSubDateDefs(t)
  const subDates: ReactNode[] = []

  for (const def of subDateDefs) {
    if (!hasCredential(def.credential)) continue
    const value = r[def.field] as string | null | undefined

    if (!value && !def.showAlways) continue

    subDates.push(
      <Typography key={def.field} variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
        <em>{def.label}:</em> {value ? formatDateTime(value) : '---'}
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, whiteSpace: 'nowrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {holdFlags}
        {showInAt && (
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {formatDateTime(r.in_at)}
          </Typography>
        )}
      </Box>
      {showOpcRange && r.opc_range && (
        <Chip
          label={r.opc_range.name}
          size='small'
          sx={{
            height: 18,
            fontSize: '0.65rem',
            backgroundColor: r.opc_range.color || undefined,
            color: r.opc_range.color ? '#fff' : undefined,
          }}
        />
      )}
      {subDates}
    </Box>
  )
}

export const customerCell = (r: CustomerMeeting): ReactNode => {
  const c = r.customer

  if (!c) return <Typography variant='body2'>-</Typography>

  const fullName = (c.lastname || c.firstname)
    ? `${(c.lastname || '').toUpperCase()} ${(c.firstname || '').toUpperCase()}`.trim()
    : '-'

  return (
    <Box>
      {c.company ? (
        <>
          <Typography variant='body2' sx={{ fontWeight: 500 }}>{c.company}</Typography>
          <Typography variant='body2'>{fullName}</Typography>
        </>
      ) : (
        <Typography variant='body2' sx={{ fontWeight: 500 }}>{fullName}</Typography>
      )}
    </Box>
  )
}

export const phoneCell = (r: CustomerMeeting): ReactNode => {
  const c = r.customer

  if (!c) return <Typography variant='body2'>-</Typography>

  return (
    <Box>
      {c.phone ? (
        <Typography variant='body2'>
          <a href={`tel:${c.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{c.phone}</a>
        </Typography>
      ) : null}
      {c.mobile ? (
        <Typography variant='caption' sx={{ color: 'text.secondary' }}>
          {c.mobile}
        </Typography>
      ) : null}
      {!c.phone && !c.mobile ? <Typography variant='body2'>-</Typography> : null}
    </Box>
  )
}
