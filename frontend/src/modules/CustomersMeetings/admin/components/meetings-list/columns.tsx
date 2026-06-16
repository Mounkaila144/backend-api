import type { ReactNode } from 'react'

import type { ColumnConfig } from '@/components/shared/DataTable'
import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'
import type { CustomerMeeting } from '../../../types'

import { isYes, getCustomerFullName, formatPrice } from './helpers'
import { textCell, booleanChip, statusChip, dateCellMultiLine, customerCell, phoneCell } from './cell-renderers'
import type { HasCredentialFn } from './cell-renderers'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MeetingColumnDef extends ColumnConfig {
  getValue: (row: CustomerMeeting) => any
  renderCell: (row: CustomerMeeting) => ReactNode
}

export const STORAGE_KEY = 'meetingsListTableColumns'

// ─── Column Builders ────────────────────────────────────────────────────────

function textCol(id: string, label: string, getValue: (r: CustomerMeeting) => any, defaultVisible = true): MeetingColumnDef {
  return { id, label, defaultVisible, getValue, renderCell: r => textCell(getValue(r)) }
}

function boolCol(
  id: string, label: string, getValue: (r: CustomerMeeting) => any,
  yes: string, no: string, yesColor: string, noColor: string, defaultVisible = true
): MeetingColumnDef {
  return { id, label, defaultVisible, getValue, renderCell: r => booleanChip(isYes(getValue(r)), yes, no, yesColor, noColor) }
}

function statusCol(id: string, label: string, getStatus: (r: CustomerMeeting) => any, defaultVisible = true): MeetingColumnDef {
  return {
    id, label, defaultVisible,
    getValue: r => { const s = getStatus(r);

 

return s?.value ?? s?.name },
    renderCell: r => statusChip(getStatus(r))
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Column Definitions — ordered to match Symfony Meeting2.tpl (lines 502-653)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getColumnDefs(t: MeetingTranslations, hasCredential: HasCredentialFn): MeetingColumnDef[] {
  return [
    // 1. Date (in_at + sub-dates + hold/lock flags + opc_range badge)
    {
      id: 'in_at',
      label: t.colDate,
      defaultVisible: true,
      getValue: r => r.in_at,
      renderCell: r => dateCellMultiLine(r, t, hasCredential)
    },

    // 2. Customer (lastname/firstname/company)
    {
      id: 'customer',
      label: t.colClient,
      defaultVisible: true,
      getValue: r => getCustomerFullName(r),
      renderCell: r => customerCell(r)
    },

    // 3. Company
    textCol('company', t.colCompany, r => r.company?.name),

    // 4. Phone
    {
      id: 'customer_phone',
      label: t.colPhone,
      defaultVisible: true,
      getValue: r => r.customer?.phone,
      renderCell: r => phoneCell(r)
    },

    // 5. Postcode
    {
      id: 'customer_postcode',
      label: t.colPostcode,
      defaultVisible: true,
      getValue: r => r.customer?.address?.postcode,
      renderCell: r => textCell(r.customer?.address?.postcode?.toUpperCase())
    },

    // 6. City
    {
      id: 'customer_city',
      label: t.colCity,
      defaultVisible: true,
      getValue: r => r.customer?.address?.city,
      renderCell: r => textCell(r.customer?.address?.city?.toUpperCase())
    },

    // 7-9. Domoprime ISO Surfaces (after city, before sales — matching Symfony line 547-561)
    {
      id: 'surface_top',
      label: t.colSurfaceTop,
      defaultVisible: false,
      getValue: r => r.surface_top,
      renderCell: r => textCell(r.surface_top != null && r.surface_top > 0 ? r.surface_top.toFixed(2) : null)
    },
    {
      id: 'surface_wall',
      label: t.colSurfaceWall,
      defaultVisible: false,
      getValue: r => r.surface_wall,
      renderCell: r => textCell(r.surface_wall != null && r.surface_wall > 0 ? r.surface_wall.toFixed(2) : null)
    },
    {
      id: 'surface_floor',
      label: t.colSurfaceFloor,
      defaultVisible: false,
      getValue: r => r.surface_floor,
      renderCell: r => textCell(r.surface_floor != null && r.surface_floor > 0 ? r.surface_floor.toFixed(2) : null)
    },

    // 10. Sales (commercial_1) — Symfony line 562
    textCol('sales', t.colSales, r => r.sales?.name),

    // 11. Sale2 (commercial_2) — Symfony line 567
    textCol('sale2', t.colSale2, r => r.sale2?.name),

    // 12. Telepro — Symfony line 572
    textCol('telepro', t.colTelepro, r => r.telepro?.name),

    // 13. Assistant — Symfony line 578
    textCol('assistant', t.colAssistant, r => r.assistant?.name),

    // 14. Campaign — Symfony line 590
    textCol('campaign', t.colCampaign, r => r.campaign?.name, false),

    // 15. Callcenter — Symfony line 596
    textCol('callcenter', t.colCallcenter, r => r.callcenter?.name),

    // 16. Polluter — Symfony line 601
    textCol('polluter', t.colPolluter, r => r.polluter?.name, false),

    // 17. Partner Layer — commented out in Symfony #2 (line 606-610), kept for flexibility
    textCol('partner_layer', t.colPartnerLayer, r => r.partner_layer?.name, false),

    // 18. Meeting Status (sale_state) — Symfony line 611
    statusCol('meeting_status', t.colMeetingStatus, r => r.meeting_status),

    // 19. Meeting Type — commented out in Symfony #2 (line 617-621), kept for flexibility
    statusCol('meeting_type', t.colMeetingType, r => r.meeting_type, false),

    // 20. Status Call — Symfony line 628
    statusCol('status_call', t.colStatusCall, r => r.status_call),

    // 21. Status Lead — Symfony line 633
    statusCol('status_lead', t.colStatusLead, r => r.status_lead),

    // 22. Creator — Symfony line 638
    textCol('creator', t.colCreator, r => r.creator?.name),

    // 23. Confirmed by — extra (from Meeting1.tpl)
    textCol('confirmed_by', t.colConfirmedBy, r => r.confirmed_by?.name, false),

    // 24. Confirmator — extra
    textCol('confirmator', t.colConfirmator, r => r.confirmator?.name, false),

    // 25. OPC Range — shown as badge in date cell in Symfony, also available as column
    {
      id: 'opc_range',
      label: t.colOpcRange,
      defaultVisible: false,
      getValue: r => r.opc_range?.name,
      renderCell: r => {
        const range = r.opc_range

        if (!range) return textCell(null)
        
return statusChip({ name: range.name, color: range.color ?? undefined })
      }
    },

    // 26. Is Confirmed — Symfony line 643
    boolCol('is_confirmed', t.colConfirmed, r => r.is_confirmed, t.chipConfirmed, t.chipNotConfirmed, 'success', 'warning'),

    // 27-29. Boolean flags — extra columns (shown as flags in Symfony date cell)
    boolCol('is_hold', t.colHold, r => r.is_hold, t.chipYes, t.chipNo, 'error', 'success'),
    boolCol('is_hold_quote', t.colHoldQuote, r => r.is_hold_quote, t.chipYes, t.chipNo, 'error', 'success'),
    boolCol('is_qualified', t.colQualified, r => r.is_qualified, t.chipQualified, t.chipNotQualified, 'success', 'default'),

    // 30. Turnover — extra
    {
      id: 'turnover',
      label: t.colTurnover,
      defaultVisible: true,
      getValue: r => r.turnover,
      renderCell: r => textCell(formatPrice(r.turnover), 'font-semibold', 'success.main')
    },

    // 31. Status (ACTIVE/DELETE) — Symfony line 648
    {
      id: 'status',
      label: t.colStatus,
      defaultVisible: true,
      getValue: r => r.status,
      renderCell: r => booleanChip(r.status === 'ACTIVE', t.chipActive, t.statusDeleted, 'success', 'error')
    },
  ]
}

export const COLUMN_DEF_IDS = [
  'in_at', 'customer', 'company', 'customer_phone', 'customer_postcode', 'customer_city',
  'surface_top', 'surface_wall', 'surface_floor',
  'sales', 'sale2', 'telepro', 'assistant',
  'campaign', 'callcenter', 'polluter', 'partner_layer',
  'meeting_status', 'meeting_type', 'status_call', 'status_lead',
  'creator', 'confirmed_by', 'confirmator',
  'opc_range',
  'is_confirmed', 'is_hold', 'is_hold_quote', 'is_qualified',
  'turnover', 'status',
] as const
