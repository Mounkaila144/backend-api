'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import { contractsService } from '../../../services/contractsService'
import type { ContractBillingItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabBillingProps {
  contractId: number | null
  t: ContractTranslations
}

/**
 * Displays list of Domoprime billings (factures) for a contract.
 * Reproduces Symfony: ajaxListPartialBillingForContractAction
 *
 * Columns (matching Symfony exactly):
 *   #, Date, Référence, Total Ventes HT, Montant de la taxe, Total Ventes TTC,
 *   Prime, Crédit impôts, Qmac, Nombre de personne, Nombre d'enfants,
 *   Crédit d'impôt utilisé, Reste à charge, Credit limit,
 *   Reste à charge après crédit d'impôts, Crédit d'impots disponible,
 *   Créé par, Créé le
 */
export default function TabBilling({ contractId, t }: TabBillingProps) {
  const [billings, setBillings] = useState<ContractBillingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBilling = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractBilling(contractId)

      if (response.success) {
        setBillings(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '—'

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const fmt = (val: number) => {
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  return (
    <TableContainer component={Paper} variant='outlined' sx={{ overflowX: 'auto' }}>
      <Table size='small' sx={{ minWidth: 1400 }}>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Référence</TableCell>
            <TableCell align='right'>Total Ventes HT</TableCell>
            <TableCell align='right'>Montant de la taxe</TableCell>
            <TableCell align='right'>Total Ventes TTC</TableCell>
            <TableCell align='right'>Prime</TableCell>
            <TableCell align='right'>Crédit impôts</TableCell>
            <TableCell align='right'>Qmac</TableCell>
            <TableCell>Nombre de personne</TableCell>
            <TableCell>Nombre d&apos;enfants</TableCell>
            <TableCell align='right'>Crédit d&apos;impôt utilisé</TableCell>
            <TableCell align='right'>Reste à charge</TableCell>
            <TableCell align='right'>Credit limit</TableCell>
            <TableCell align='right'>Reste à charge après crédit d&apos;impôts</TableCell>
            <TableCell align='right'>Crédit d&apos;impots disponible</TableCell>
            <TableCell>Créé par</TableCell>
            <TableCell>Créé le</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {billings.length === 0 ? (
            <TableRow>
              <TableCell colSpan={18} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                Aucune facture
              </TableCell>
            </TableRow>
          ) : null}
          {billings.map((b, i) => (
            <TableRow key={b.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(b.dated_at)}</TableCell>
              <TableCell>{b.reference || '—'}</TableCell>
              <TableCell align='right'>{fmt(b.total_sale_ht)}</TableCell>
              <TableCell align='right'>{fmt(b.total_tax)}</TableCell>
              <TableCell align='right'>{fmt(b.total_sale_ttc)}</TableCell>
              <TableCell align='right'>{fmt(b.prime)}</TableCell>
              <TableCell align='right'>{fmt(b.tax_credit)}</TableCell>
              <TableCell align='right'>{fmt(b.qmac_value)}</TableCell>
              <TableCell>{b.number_of_people}</TableCell>
              <TableCell>{b.number_of_children}</TableCell>
              <TableCell align='right'>{fmt(b.tax_credit_used)}</TableCell>
              <TableCell align='right'>{fmt(b.rest_in_charge)}</TableCell>
              <TableCell align='right'>{fmt(b.tax_credit_limit)}</TableCell>
              <TableCell align='right'>{fmt(b.rest_in_charge_after_credit)}</TableCell>
              <TableCell align='right'>{fmt(b.tax_credit_available)}</TableCell>
              <TableCell>{b.creator || '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(b.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
