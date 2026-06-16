import type { ReactNode } from 'react'

import type { ColumnConfig } from '@/components/shared/DataTable'
import type { ContractTranslations } from '../../hooks/useContractTranslations'
import type { CustomerContract } from '../../../types'

import { isYes, getCustomerFullName, formatPrice } from './helpers'
import { textCell, booleanChip, statusChip, dateCellMultiLine, customerCell, phoneCell, saleCell, financialPartnerCell } from './cell-renderers'
import type { HasCredentialFn, OnSaleActionFn, OnPartnerActionFn } from './cell-renderers'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContractColumnDef extends ColumnConfig {
  getValue: (row: CustomerContract) => any
  renderCell: (row: CustomerContract) => ReactNode
}

export const STORAGE_KEY = 'contractsListTableColumns'

// ─── Column Builders ────────────────────────────────────────────────────────
//
// Factory functions for common column rendering patterns.
// Each reduces a 6-line object literal to a 1–3 line call.

/** Text column — displays getValue() result as plain text */
function textCol(id: string, label: string, getValue: (r: CustomerContract) => any, defaultVisible = true): ContractColumnDef {
  return { id, label, defaultVisible, getValue, renderCell: r => textCell(getValue(r)) }
}

/** Boolean chip — colored YES/NO chip via isYes() check */
function boolCol(
  id: string,
  label: string,
  getValue: (r: CustomerContract) => any,
  yes: string,
  no: string,
  yesColor: string,
  noColor: string,
  defaultVisible = true
): ContractColumnDef {
  return { id, label, defaultVisible, getValue, renderCell: r => booleanChip(isYes(getValue(r)), yes, no, yesColor, noColor) }
}

/** Status chip — renders a { value, name, color } status object */
function statusCol(id: string, label: string, getStatus: (r: CustomerContract) => any, defaultVisible = true): ContractColumnDef {
  return {
    id,
    label,
    defaultVisible,
    getValue: r => {
      const s = getStatus(r)

      
return s?.value ?? s?.name
    },
    renderCell: r => statusChip(getStatus(r))
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Column Definitions (ordered to match the Symfony 1 template)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function getColumnDefs(t: ContractTranslations, hasCredential: HasCredentialFn, onSaleAction?: OnSaleActionFn, onPartnerAction?: OnPartnerActionFn): ContractColumnDef[] {
  return [
    // ── Date (tpl:841) ────────────────────────────────────────────────────

    {
      id: 'date',
      label: t.colDate,
      defaultVisible: true,
      getValue: r => r.opened_at,
      renderCell: r => dateCellMultiLine(r, t, hasCredential)
    },

    // ── Client (tpl:927) ──────────────────────────────────────────────────

    {
      id: 'customer',
      label: t.colClient,
      defaultVisible: true,
      getValue: r => getCustomerFullName(r),
      renderCell: r => customerCell(r)
    },

    // ── Classe Énergie (tpl:946) ──────────────────────────────────────────

    textCol('class_energy', t.colClassEnergy, r => r.class_energy, false),

    // ── Société & Campagne (tpl:961, 970) ─────────────────────────────────

    textCol('company', t.colCompany, r => r.company?.name),
    textCol('campaign', t.colCampaign, r => r.campaign?.name, false),

    // ── Facturable (tpl:979) ──────────────────────────────────────────────

    boolCol('is_billable', t.colBillable, r => r.is_billable, t.chipYes, t.chipNo, 'success', 'error'),

    // ── Coordonnées Client (tpl:996–1035) ─────────────────────────────────

    {
      id: 'customer_phone',
      label: t.colPhone,
      defaultVisible: true,
      getValue: r => r.customer?.phone,
      renderCell: r => phoneCell(r)
    },
    {
      id: 'customer_postcode',
      label: t.colPostcode,
      defaultVisible: true,
      getValue: r => r.customer?.address?.postcode,
      renderCell: r => textCell(r.customer?.address?.postcode?.toUpperCase())
    },
    {
      id: 'customer_city',
      label: t.colCity,
      defaultVisible: true,
      getValue: r => r.customer?.address?.city,
      renderCell: r => textCell(r.customer?.address?.city?.toUpperCase())
    },

    // ── Pricing & Surfaces (tpl:1036–1161) ────────────────────────────────

    textCol('pricing', t.colPricing, r => r.pricing, false),
    textCol('surface_home', t.colSurfaceHome, r => r.surface_home),

    // ── Prime Rénov (tpl:1058–1089) ─────────────────────────────────────

    textCol('prime_renov', t.colPrimeRenov, r => {
      const pr = r.prime_renov

      if (!pr?.reference) return null
      
return pr.amount ? `${pr.reference} — ${pr.amount} €` : pr.reference
    }, false),
    textCol('prime_renov_state1', t.colPrimeRenovState1, r => r.prime_renov?.state1, false),
    textCol('prime_renov_state2', t.colPrimeRenovState2, r => r.prime_renov?.state2, false),

    // ── Surfaces suite (tpl:1090–1161) ──────────────────────────────────

    textCol('surface_top', t.colSurfaceTop, r => r.surface_top, false),
    textCol('surface_wall', t.colSurfaceWall, r => r.surface_wall, false),
    textCol('surface_floor', t.colSurfaceFloor, r => r.surface_floor, false),
    textCol('surface_parcel', t.colSurfaceParcel, r => r.surface_parcel, false),

    // ── Équipe Commerciale (tpl:1162–1237) ────────────────────────────────

    {
      id: 'sale1',
      label: t.colSale1,
      defaultVisible: true,
      getValue: r => r.sale1?.name,
      renderCell: r => saleCell(r, 'sale1', hasCredential, onSaleAction)
    },
    {
      id: 'sale2',
      label: t.colSale2,
      defaultVisible: true,
      getValue: r => r.sale2?.name,
      renderCell: r => saleCell(r, 'sale2', hasCredential, onSaleAction)
    },
    textCol('telepro', t.colTelepro, r => r.telepro?.name),
    textCol('assistant', t.colAssistant, r => r.assistant?.name),

    // ── Partenaires (tpl:1238–1261) ───────────────────────────────────────

    {
      id: 'financial_partner',
      label: t.colFinancialPartner,
      defaultVisible: true,
      getValue: r => r.financial_partner?.name,
      renderCell: r => financialPartnerCell(r, hasCredential, onPartnerAction)
    },
    textCol('partner_layer', t.colPartnerLayer, r => r.partner_layer?.name),

    // ── Statuts (tpl:1263–1327) ───────────────────────────────────────────

    statusCol('opc_status', t.colOpcStatus, r => r.opc_status),
    statusCol('admin_status', t.colAdminStatus, r => r.admin_status),
    statusCol('time_status', t.colTimeStatus, r => r.time_status),

    // ── Organisation (tpl:1328–1351) ──────────────────────────────────────

    textCol('polluter', t.colPolluter, r => r.polluter?.name),
    textCol('team', t.colTeam, r => r.team?.name),

    // ── Indicateurs Oui/Non (tpl:1357–1400+) ─────────────────────────────

    boolCol('is_confirmed', t.colConfirmed, r => r.is_confirmed, t.chipConfirmed, t.chipNotConfirmed, 'success', 'warning'),
    boolCol('is_hold', t.colBlocked, r => r.is_hold, t.chipYes, t.chipNo, 'error', 'success'),
    boolCol('is_hold_quote', t.colQuoteBlocked, r => r.is_hold_quote, t.chipYes, t.chipNo, 'error', 'success'),
    boolCol('is_document', t.colDocument, r => r.is_document, t.chipYes, t.chipNo, 'success', 'default'),
    boolCol('is_photo', t.colPhoto, r => r.is_photo, t.chipYes, t.chipNo, 'success', 'default'),
    boolCol('is_quality', t.colQuality, r => r.is_quality, t.chipValidated, t.chipPending, 'success', 'default'),

    // ── Métadonnées ───────────────────────────────────────────────────────

    textCol('creator', t.colCreator, r => r.creator?.name),
    textCol('contributor', t.colContributor, r => r.contributor_summary, false),

    // ── Statuts Contrat & Montant ─────────────────────────────────────────

    statusCol('contract_status', t.colContractStatus, r => r.contract_status),
    statusCol('install_status', t.colInstallStatus, r => r.install_status),
    {
      id: 'status',
      label: t.colStatus,
      defaultVisible: true,
      getValue: r => r.status,
      renderCell: r => booleanChip(r.status === 'ACTIVE', t.chipActive, t.statusDeleted, 'success', 'error')
    },
    {
      id: 'montant_ttc',
      label: t.colAmountTtc,
      defaultVisible: true,
      getValue: r => r.total_price_with_taxe,
      renderCell: r => textCell(formatPrice(r.total_price_with_taxe), 'font-semibold', 'success.main')
    }
  ]
}

/** @deprecated Use getColumnDefs(t) instead. Kept for default visibility initialization. */
export const COLUMN_DEF_IDS = [
  'date',
  'customer',
  'class_energy',
  'company',
  'campaign',
  'is_billable',
  'customer_phone',
  'customer_postcode',
  'customer_city',
  'pricing',
  'surface_home',
  'prime_renov',
  'prime_renov_state1',
  'prime_renov_state2',
  'surface_top',
  'surface_wall',
  'surface_floor',
  'surface_parcel',
  'sale1',
  'sale2',
  'telepro',
  'assistant',
  'financial_partner',
  'partner_layer',
  'opc_status',
  'admin_status',
  'time_status',
  'polluter',
  'team',
  'is_confirmed',
  'is_hold',
  'is_hold_quote',
  'is_document',
  'is_photo',
  'is_quality',
  'creator',
  'contributor',
  'contract_status',
  'install_status',
  'status',
  'montant_ttc'
] as const
