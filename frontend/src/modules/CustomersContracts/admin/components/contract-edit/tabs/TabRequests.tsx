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
import type { ContractRequestItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabRequestsProps {
  contractId: number | null
  t: ContractTranslations
}

/**
 * Displays list of Domoprime calculation requests for a contract.
 * Reproduces Symfony: ajaxListPartialRequestForContractAction
 *
 * Columns (matching Symfony):
 *   #, Région, Zone, Secteur, Energie, Classe, Revenu, Nombre de personne,
 *   Qmac, Valeur Cumac, Par, Validé par, Créé le, Actions
 */
export default function TabRequests({ contractId, t }: TabRequestsProps) {
  const [requests, setRequests] = useState<ContractRequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractRequests(contractId)

      if (response.success) {
        setRequests(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatNumber = (val: number) => {
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
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
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Région</TableCell>
            <TableCell>Zone</TableCell>
            <TableCell>Secteur</TableCell>
            <TableCell>Energie</TableCell>
            <TableCell>Classe</TableCell>
            <TableCell>Revenu</TableCell>
            <TableCell>Nombre de personne</TableCell>
            <TableCell>Qmac</TableCell>
            <TableCell>Valeur Cumac</TableCell>
            <TableCell>Par</TableCell>
            <TableCell>Validé par</TableCell>
            <TableCell>Créé le</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                Aucune requête
              </TableCell>
            </TableRow>
          ) : null}
          {requests.map((r, i) => (
            <TableRow key={r.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{r.region || '—'}</TableCell>
              <TableCell>{r.zone || '—'}</TableCell>
              <TableCell>{r.sector || '—'}</TableCell>
              <TableCell>{r.energy || '—'}</TableCell>
              <TableCell>{r.class || '—'}</TableCell>
              <TableCell>{formatNumber(r.revenue)}</TableCell>
              <TableCell>{formatNumber(r.number_of_people)}</TableCell>
              <TableCell>{formatNumber(r.qmac)}</TableCell>
              <TableCell>{formatNumber(r.qmac_value)}</TableCell>
              <TableCell>{r.user || '—'}</TableCell>
              <TableCell>{r.accepted_by || '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
