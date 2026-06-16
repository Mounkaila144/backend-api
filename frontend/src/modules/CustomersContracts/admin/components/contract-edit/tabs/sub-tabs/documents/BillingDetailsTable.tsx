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

import type { DomoprimeBilling } from '@/modules/AppDomoprime/types'
import { usePermissions } from '@/shared/contexts/PermissionsContext'
import type { ContractTranslations } from '../../../../../hooks/useContractTranslations'

import { formatCurrency, formatDate } from './helpers'

interface BillingDetailsTableProps {
  billings: DomoprimeBilling[]
  downloading?: string | null
  onDownloadPdf?: (id: number, ref: string) => void
  onSendEmail?: (id: number) => void
  onCreateAsset?: (id: number) => void
  t: ContractTranslations & Record<string, string>
}

export default function BillingDetailsTable({
  billings,
  downloading,
  onDownloadPdf,
  onSendEmail,
  onCreateAsset,
  t,
}: BillingDetailsTableProps) {
  const { hasCredential } = usePermissions()

  const canSendEmail = hasCredential([['superadmin', 'admin', 'app_domoprime_contrat_billing_list_send_email']])
  const canCreateAsset = hasCredential([['superadmin', 'admin', 'app_domoprime_contrat_billing_list_create_asset']])

  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size='small' sx={{ minWidth: 600 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t.docColDate}</TableCell>
            <TableCell>{t.docColReference}</TableCell>
            <TableCell align='right'>{t.docColTotalHt}</TableCell>
            <TableCell align='right'>{t.docColTotalTax ?? 'TVA'}</TableCell>
            <TableCell align='right'>{t.docColTotalTtc}</TableCell>
            <TableCell>{t.docColCreatedBy ?? 'Créé par'}</TableCell>
            <TableCell>{t.docColCreatedAt ?? 'Créé le'}</TableCell>
            <TableCell>{t.docColStatus}</TableCell>
            <TableCell align='center'>{t.docColActions}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {billings.map((b, idx) => (
            <TableRow key={b.id} selected={b.is_last === 'YES'}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{b.dated_at ? formatDate(b.dated_at) : '-'}</TableCell>
              <TableCell>{b.reference || '-'}</TableCell>
              <TableCell align='right'>{formatCurrency(b.total_sale_without_tax)}</TableCell>
              <TableCell align='right'>{formatCurrency(b.total_tax)}</TableCell>
              <TableCell align='right'>{formatCurrency(b.total_sale_with_tax)}</TableCell>
              <TableCell>-</TableCell>
              <TableCell>{b.created_at ? formatDate(b.created_at) : '-'}</TableCell>
              <TableCell>
                <Chip
                  label={b.status}
                  size='small'
                  color={b.status === 'ACTIVE' ? 'success' : 'error'}
                  variant='outlined'
                />
              </TableCell>
              <TableCell align='center'>
                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                  {/* PDF Download */}
                  {onDownloadPdf ? (
                    <Tooltip title={t.docDownloadPdf}>
                      <IconButton
                        size='small'
                        color='primary'
                        disabled={downloading === `billing-pdf-${b.id}`}
                        onClick={() => onDownloadPdf(b.id, b.reference)}
                      >
                        {downloading === `billing-pdf-${b.id}`
                          ? <CircularProgress size={14} />
                          : <i className='ri-file-pdf-2-line' style={{ fontSize: 16 }} />
                        }
                      </IconButton>
                    </Tooltip>
                  ) : null}

                  {/* Send Email */}
                  {canSendEmail && onSendEmail ? (
                    <Tooltip title={t.docActionSendBillingEmail ?? 'Envoyer par email'}>
                      <IconButton
                        size='small'
                        sx={{ color: 'info.main' }}
                        onClick={() => onSendEmail(b.id)}
                      >
                        <i className='ri-mail-line' style={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  ) : null}

                  {/* Create Asset */}
                  {canCreateAsset && onCreateAsset ? (
                    <Tooltip title={t.docActionCreateAsset ?? 'Créer un avoir'}>
                      <IconButton
                        size='small'
                        color='warning'
                        onClick={() => onCreateAsset(b.id)}
                      >
                        <i className='ri-add-line' style={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
