'use client'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

import type { DomoprimeQuotation } from '@/modules/AppDomoprime/types'
import { usePermissions } from '@/shared/contexts/PermissionsContext'

import { formatDate, formatCurrency } from './helpers'
import type { QuotationTableTranslations } from './translations'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QuotationDetailsTableProps {
  quotations: DomoprimeQuotation[]
  downloading: string | null
  isHold: boolean
  onDownloadPdf: (id: number, ref: string) => void
  onDisable: (id: number) => void
  onEnable: (id: number) => void
  // Optional: meeting parents have no billing flow yet (Story M2/M4).
  onOpenBillingDialog?: (id: number) => void
  onEditQuotation?: (id: number) => void
  // Optional permanent-delete (superadmin) — meeting CRUD (Story M2).
  onRemove?: (id: number) => void
  t: QuotationTableTranslations
}

// ---------------------------------------------------------------------------
// Component — matches Symfony quotationsITEForViewContract detail table
// Columns: #, Date, Référence, Signé, Signé le, Créé par, Créé le, Actions
// Actions per row: Edit, Yousign, Billing, PDF, Delete/Recycle
// ---------------------------------------------------------------------------

export default function QuotationDetailsTable({
  quotations,
  downloading,
  isHold,
  onDownloadPdf,
  onDisable,
  onEnable,
  onOpenBillingDialog,
  onEditQuotation,
  onRemove,
  t,
}: QuotationDetailsTableProps) {
  const { hasCredential } = usePermissions()

  const canEdit = hasCredential([['superadmin', 'app_domoprime_contract_view_quotation_edit', 'app_domoprime_contract_view_quotation_edit3', 'app_domoprime_meeting_list_quotation_edit']])
  const canCreateBilling = hasCredential([['superadmin', 'app_domoprime_list_quotation_create_billing']])
  const canDelete = hasCredential([['superadmin', 'app_domoprime_contract_view_quotation_delete', 'app_domoprime_meeting_list_quotation_delete']])
  const canPermanentDelete = hasCredential([['superadmin']])

  // Permission-gated financial columns (exact Symfony credential names from permissions.csv)
  const showDate = hasCredential([['superadmin', 'app_domoprime_contract_quotation_date']])
  const showTax55 = hasCredential([['superadmin', 'app_domoprime_contract_quotation_tax_5_5']])
  const showTax20 = hasCredential([['superadmin', 'app_domoprime_contract_quotation_taxe_20']])
  const showPaidWithoutAnah = hasCredential([['superadmin', 'app_domoprime_contract_quotation_paid_without_anah']])
  const showTotalHt = hasCredential([['superadmin', 'app_domoprime_contract_quotation_total_without_tax']])
  const showTotalTax = hasCredential([['superadmin', 'app_domoprime_contract_quotation_total_tax']])
  const showTotalTtc = hasCredential([['superadmin', 'app_domoprime_contract_quotation_total_sale_with_tax']])
  const showPrimeCee = hasCredential([['superadmin', 'app_domoprime_contract_quotation_prime_cee']])
  const showPaidWithAnah = hasCredential([['superadmin', 'app_domoprime_contract_quotation_paid_with_anah']])
  const showPrimeAnah = hasCredential([['superadmin', 'app_domoprime_contract_quotation_prime_anah']])
  const showStatus = hasCredential([['superadmin', 'app_domoprime_contract_quotation_status']])

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small' sx={{ minWidth: 800 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            {showDate ? <TableCell>{t.docColDate}</TableCell> : null}
            <TableCell>{t.docColReference}</TableCell>
            {showTax55 ? <TableCell align='right'>{t.docColTax55}</TableCell> : null}
            {showTax20 ? <TableCell align='right'>{t.docColTax20}</TableCell> : null}
            {showPaidWithoutAnah ? <TableCell align='right'>{t.docColPaidHtWithoutAnah}</TableCell> : null}
            {showTotalHt ? <TableCell align='right'>{t.docColTotalHt}</TableCell> : null}
            {showTotalTax ? <TableCell align='right'>{t.docColTotalTax}</TableCell> : null}
            {showTotalTtc ? <TableCell align='right'>{t.docColTotalTtc}</TableCell> : null}
            {showPrimeCee ? <TableCell align='right'>{t.docColPrimeCee}</TableCell> : null}
            {showPaidWithAnah ? <TableCell align='right'>{t.docColPaidHtWithAnah}</TableCell> : null}
            {showPrimeAnah ? <TableCell align='right'>{t.docColPrimeAnah}</TableCell> : null}
            <TableCell>{t.docColSigned}</TableCell>
            <TableCell>{t.docColSignedAt}</TableCell>
            <TableCell>{t.docColCreatedBy}</TableCell>
            <TableCell>{t.docColCreatedAt}</TableCell>
            {showStatus ? <TableCell>{t.docColStatus}</TableCell> : null}
            <TableCell align='center'>{t.docColActions}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {quotations.map((q, idx) => {
            const isActive = q.status === 'ACTIVE'
            const creator = q.creator

            // Computed financial values matching Symfony formatters
            const paidWithoutAnah = (q.total_sale_without_tax ?? 0) - (q.cee_prime ?? 0)
            const paidWithAnah = (q.total_sale_without_tax ?? 0) - (q.cee_prime ?? 0) - (q.ana_prime ?? 0)

            return (
              <TableRow key={q.id} selected={q.is_last === 'YES'}>
                <TableCell>{idx + 1}</TableCell>
                {showDate ? <TableCell>{q.dated_at ? formatDate(q.dated_at) : '-'}</TableCell> : null}
                <TableCell>{q.reference || '-'}</TableCell>
                {showTax55 ? <TableCell align='right'>{formatCurrency(q.total_tax)}</TableCell> : null}
                {showTax20 ? <TableCell align='right'>{formatCurrency(0)}</TableCell> : null}
                {showPaidWithoutAnah ? <TableCell align='right'>{formatCurrency(paidWithoutAnah)}</TableCell> : null}
                {showTotalHt ? <TableCell align='right'>{formatCurrency(q.total_sale_without_tax)}</TableCell> : null}
                {showTotalTax ? <TableCell align='right'>{formatCurrency(q.total_tax)}</TableCell> : null}
                {showTotalTtc ? <TableCell align='right'>{formatCurrency(q.total_sale_with_tax)}</TableCell> : null}
                {showPrimeCee ? <TableCell align='right'>{formatCurrency(q.cee_prime)}</TableCell> : null}
                {showPaidWithAnah ? <TableCell align='right'>{formatCurrency(paidWithAnah)}</TableCell> : null}
                {showPrimeAnah ? <TableCell align='right'>{formatCurrency(q.ana_prime)}</TableCell> : null}
                <TableCell>
                  <Chip
                    label={q.is_signed === 'YES' ? t.docSigned : t.docNotSigned}
                    size='small'
                    color={q.is_signed === 'YES' ? 'success' : 'default'}
                    variant='outlined'
                  />
                </TableCell>
                <TableCell>{q.signed_at ? formatDate(q.signed_at) : '-'}</TableCell>
                <TableCell>
                  {creator ? `${creator.firstname} ${creator.lastname}` : '-'}
                </TableCell>
                <TableCell>{formatDate(q.created_at)}</TableCell>
                {showStatus ? (
                  <TableCell>
                    <Chip
                      label={isActive ? 'ACTIVE' : q.status}
                      size='small'
                      color={isActive ? 'success' : 'error'}
                      variant='outlined'
                    />
                  </TableCell>
                ) : null}
                <TableCell align='center'>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                    {/* Edit */}
                    {canEdit ? (
                      <Tooltip title={t.docActionEdit}>
                        <span>
                          <IconButton
                            size='small'
                            color='info'
                            disabled={isHold || !isActive || !onEditQuotation}
                            onClick={() => onEditQuotation?.(q.id)}
                          >
                            <i className='ri-pencil-line' style={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : null}

                    {/* Yousign — show status when signed, placeholder when not */}
                    {q.is_signed === 'YES' ? (
                      <Tooltip title={`${t.docSigned} ${q.signed_at ? formatDate(q.signed_at) : ''}`}>
                        <IconButton
                          size='small'
                          color='success'
                          onClick={() => onDownloadPdf(q.id, q.reference)}
                        >
                          <i className='ri-check-double-line' style={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title={t.docActionYousign}>
                        <span>
                          <IconButton size='small' color='secondary' disabled>
                            <i className='ri-quill-pen-line' style={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {/* Billing — only when a billing handler is wired (contract). */}
                    {canCreateBilling && isActive && onOpenBillingDialog ? (
                      <Tooltip title={t.docActionBilling}>
                        <span>
                          <IconButton
                            size='small'
                            color='warning'
                            disabled={isHold}
                            onClick={() => onOpenBillingDialog(q.id)}
                          >
                            <i className='ri-money-euro-circle-line' style={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : null}

                    {/* PDF Download */}
                    <Tooltip title={t.docDownloadPdf}>
                      <IconButton
                        size='small'
                        color='primary'
                        disabled={downloading === `pdf-${q.id}`}
                        onClick={() => onDownloadPdf(q.id, q.reference)}
                      >
                        {downloading === `pdf-${q.id}`
                          ? <CircularProgress size={14} />
                          : <i className='ri-file-pdf-2-line' style={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    </Tooltip>

                    {/* Disable / Enable toggle (trash / recycle) */}
                    {canDelete ? (
                      isActive ? (
                        <Tooltip title={t.docActionDisable}>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => onDisable(q.id)}
                          >
                            <i className='ri-delete-bin-line' style={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title={t.docActionEnable}>
                          <IconButton
                            size='small'
                            color='success'
                            onClick={() => onEnable(q.id)}
                          >
                            <i className='ri-recycle-line' style={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )
                    ) : null}

                    {/* Permanent delete (superadmin only) — Story M2 */}
                    {canPermanentDelete && onRemove ? (
                      <Tooltip title='Supprimer définitivement'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => onRemove(q.id)}
                        >
                          <i className='ri-close-circle-line' style={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Box>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
