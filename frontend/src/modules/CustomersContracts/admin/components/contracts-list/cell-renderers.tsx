import type { ReactNode } from 'react'

import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

import type { ContractTranslations } from '../../hooks/useContractTranslations'
import type { CustomerContract } from '../../../types'
import type { ChipColor } from './helpers'
import { isYes, formatDate, formatDateTime } from './helpers'

/** Signature of usePermissions().hasCredential */
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

// ─── Credential shortcuts (same as columns.tsx) ─────────────────────────────

const adminOr      = (...p: string[]): string[][] => [['superadmin', 'admin', ...p]]
const superadminOr = (...p: string[]): string[][] => [['superadmin', ...p]]

// ─── Date Cell Sub-Date Definitions ─────────────────────────────────────────
//
// Each sub-date mirrors a Symfony template block from
// customers_contracts_ajaxListPartialContract2.tpl (lines 841-925).
//
// showAlways: true  → line always rendered, shows "---" when no data
// showAlways: false → line only rendered when data exists

interface SubDateDef {
  credential: string[][]
  field: keyof CustomerContract
  label: string
  showAlways: boolean

  /** Credential to show datetime instead of date-only */
  datetimeCredential?: string[][]
}

function getSubDateDefs(t: ContractTranslations): Omit<SubDateDef, 'credential'>[] & SubDateDef[] {
  return [
    // tpl:850 — opc_at (only if data exists)
    { credential: adminOr('contract_list_opc_at'),
      datetimeCredential: adminOr('contract_display_list_opc_at_datetime'),
      field: 'opc_at', label: t.dateInstallAh, showAlways: false },

    // tpl:873 — pre_meeting_at (always show, "---" fallback)
    { credential: superadminOr('contract_list_view_pre_meeting_at', 'contract_display_list_pre_meeting_at_datetime'),
      datetimeCredential: superadminOr('contract_display_list_pre_meeting_at_datetime'),
      field: 'pre_meeting_at', label: t.datePreVisit, showAlways: true },

    // tpl:888 — apf_at (only if data exists)
    { credential: adminOr('contract_list_apf_at'),
      field: 'apf_at', label: t.dateSentLabel, showAlways: false },

    // tpl:893 — payment_at (only if data exists)
    { credential: adminOr('contract_list_payment_at'),
      field: 'payment_at', label: t.datePaymentLabel, showAlways: false },

    // tpl:898 — sav_at (always show, "---" fallback)
    { credential: superadminOr('contract_list_view_sav_at'),
      field: 'sav_at', label: t.dateInstall, showAlways: true },

    // tpl:915 — doc_at (always show, "---" fallback)
    { credential: superadminOr('contract_list_view_doc_at'),
      field: 'doc_at', label: t.dateDoc, showAlways: true },

    // tpl:920 — closed_at (only if data exists)
    { credential: adminOr('contract_list_closed_at'),
      field: 'closed_at', label: t.dateClosure, showAlways: false },
  ]
}

/**
 * Multi-line date cell matching Symfony template (tpl lines 841-925).
 *
 * Each sub-element is gated by its own credential, exactly as in the original:
 *  - opened_at:      [['admin', 'contract_list_opened_at']]
 *  - opc_at:         [['superadmin', 'admin', 'contract_list_opc_at']]
 *  - pre_meeting_at: [['superadmin', 'contract_list_view_pre_meeting_at', ...]]
 *  - apf_at:         [['superadmin', 'admin', 'contract_list_apf_at']]
 *  - payment_at:     [['superadmin', 'admin', 'contract_list_payment_at']]
 *  - sav_at:         [['superadmin', 'contract_list_view_sav_at']]
 *  - doc_at:         [['superadmin', 'contract_list_view_doc_at']]
 *  - closed_at:      [['superadmin', 'admin', 'contract_list_closed_at']]
 */
export const dateCellMultiLine = (
  r: CustomerContract,
  t: ContractTranslations,
  hasCredential: HasCredentialFn
): ReactNode => {
  // ── Hold icons (tpl:844-845 — no credential check, always rendered) ──
  const holdFlags: ReactNode[] = []

  if (isYes(r.is_hold)) {
    holdFlags.push(
      <Chip key='hold' label='H' size='small' color='warning' sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }} />
    )
  }

  if (isYes(r.is_hold_admin)) {
    holdFlags.push(
      <Chip key='hold-admin' label='HA' size='small' color='error' sx={{ height: 18, fontSize: '0.65rem', mr: 0.5 }} />
    )
  }

  // ── opened_at (tpl:846 — [['admin', 'contract_list_opened_at']]) ──
  const showOpenedAt = hasCredential([['admin', 'contract_list_opened_at']])

  // ── Sub-dates, each gated by its own credential ──
  const subDateDefs = getSubDateDefs(t)
  const subDates: ReactNode[] = []

  for (const def of subDateDefs) {
    if (!hasCredential(def.credential)) continue

    const value = r[def.field] as string | null | undefined

    if (!value && !def.showAlways) continue

    const useDateTime = def.datetimeCredential ? hasCredential(def.datetimeCredential) : true

    const formatted = value
      ? (useDateTime ? formatDateTime(value) : formatDate(value))
      : '---'

    subDates.push(
      <Typography key={def.field} variant='caption' sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
        <em>{def.label}:</em> {formatted}
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, whiteSpace: 'nowrap' }}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {holdFlags}
        {showOpenedAt && (
          <Typography variant='body2' sx={{ fontWeight: 500 }}>
            {formatDate(r.opened_at)}
          </Typography>
        )}
      </Box>
      {subDates}
    </Box>
  )
}

/**
 * Customer cell matching Symfony: company on first line, LASTNAME FIRSTNAME on second,
 * then Cumac status (tpl:1744 — calculationForPager component).
 */
export const customerCell = (r: CustomerContract): ReactNode => {
  const c = r.customer

  if (!c) return <Typography variant='body2'>-</Typography>

  const fullName = (c.lastname || c.firstname)
    ? `${(c.lastname || '').toUpperCase()} ${(c.firstname || '').toUpperCase()}`.trim()
    : c.nom_prenom?.toUpperCase() || '-'

  const calc = r.calculation

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
      <Typography variant='caption' sx={{ lineHeight: 1.3 }}>
        <span style={{ fontWeight: 'bold' }}>Cumac:</span>{' '}
        {calc ? (
          <span style={{ fontWeight: 'bold', color: calc.is_accepted ? '#4caf50' : '#f44336' }}>
            {calc.status_i18n}
          </span>
        ) : '---'}
      </Typography>
    </Box>
  )
}

/**
 * Phone cell matching Symfony: phone as clickable tel: link, mobile below.
 */
export const phoneCell = (r: CustomerContract): ReactNode => {
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

/** Callback for SMS/Email actions on sale users */
export type OnSaleActionFn = (contractId: number, saleField: 'sale1' | 'sale2', action: 'sms' | 'email') => void

/** Callback for actions on the financial partner cell */
export type OnPartnerActionFn = (contractId: number, action: 'email_installer' | 'email_partner' | 'whatsapp_partner') => void

/**
 * Sale user cell matching Symfony tpl:1162-1209.
 * Shows user name + SMS/Email icon buttons (permission-gated).
 */
export const saleCell = (
  r: CustomerContract,
  saleField: 'sale1' | 'sale2',
  hasCredential: HasCredentialFn,
  onSaleAction?: OnSaleActionFn
): ReactNode => {
  const user = r[saleField] as { id?: number; name?: string } | null | undefined

  if (!user?.name) return <Typography variant='body2'>-</Typography>

  const canSms = hasCredential([['superadmin', 'admin', 'contract_sale_sms_send']])
  const canEmail = hasCredential([['superadmin', 'admin', 'contract_sale_email_send']])

  return (
    <Box>
      <Typography variant='body2'>{user.name}</Typography>
      {(canSms || canEmail) && (
        <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
          {canSms && (
            <IconButton
              size='small'
              title='SMS'
              onClick={e => { e.stopPropagation(); onSaleAction?.(r.id!, saleField, 'sms') }}
              sx={{ p: 0.25 }}
            >
              <i className='ri-message-2-line' style={{ fontSize: 16 }} />
            </IconButton>
          )}
          {canEmail && (
            <IconButton
              size='small'
              title='Email'
              onClick={e => { e.stopPropagation(); onSaleAction?.(r.id!, saleField, 'email') }}
              sx={{ p: 0.25 }}
            >
              <i className='ri-mail-line' style={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  )
}

/**
 * Financial partner cell matching Symfony tpl:1240-1253.
 * Shows partner name + action buttons:
 *  - Installer email (contract_list_installers_send_email, tpl component SendMailToInstallerButton)
 *  - Partner email (contract_list_partners_send_email, tpl component SendMailToPartnerButton)
 *  - WhatsApp (contract_partner_whats_app_list_partner, tpl component partnerForContractPager)
 */
export const financialPartnerCell = (
  r: CustomerContract,
  hasCredential: HasCredentialFn,
  onPartnerAction?: OnPartnerActionFn
): ReactNode => {
  const partner = r.financial_partner as { id?: number; name?: string } | null | undefined

  if (!partner?.name) return <Typography variant='body2'>-</Typography>

  const hasInstaller = !!r.installer_user_id
  const canInstallerEmail = hasInstaller && hasCredential([['superadmin', 'contract_list_installers_send_email']])
  const canPartnerEmail = hasCredential([['superadmin', 'contract_list_partners_send_email']])
  const canWhatsApp = hasCredential([['superadmin', 'contract_partner_whats_app_list_partner']])

  return (
    <Box>
      <Typography variant='body2'>{partner.name}</Typography>
      {(canInstallerEmail || canPartnerEmail || canWhatsApp) && (
        <Box sx={{ display: 'flex', gap: 0.25, mt: 0.25 }}>
          {canInstallerEmail && (
            <IconButton
              size='small'
              title='Email installateur'
              onClick={e => { e.stopPropagation(); onPartnerAction?.(r.id!, 'email_installer') }}
              sx={{ p: 0.25 }}
            >
              <i className='ri-mail-send-line' style={{ fontSize: 16 }} />
            </IconButton>
          )}
          {canPartnerEmail && (
            <IconButton
              size='small'
              title='Email partenaire'
              onClick={e => { e.stopPropagation(); onPartnerAction?.(r.id!, 'email_partner') }}
              sx={{ p: 0.25 }}
            >
              <i className='ri-mail-line' style={{ fontSize: 16 }} />
            </IconButton>
          )}
          {canWhatsApp && (
            <IconButton
              size='small'
              title='WhatsApp partenaire'
              onClick={e => { e.stopPropagation(); onPartnerAction?.(r.id!, 'whatsapp_partner') }}
              sx={{ p: 0.25, color: '#25D366' }}
            >
              <i className='ri-whatsapp-line' style={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
      )}
    </Box>
  )
}
