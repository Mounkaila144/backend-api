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
import type { ContractAssetItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabAssetsProps {
  contractId: number | null
  t: ContractTranslations
}

/**
 * Displays list of Domoprime assets (avoirs) for a contract.
 * Reproduces Symfony: ajaxListPartialAssetForContractAction
 *
 * Columns (matching Symfony for this user):
 *   #, Référence, Total HT, TVA, Créé par, Créé le
 *
 * Note: Date and Total TTC are credential-gated in Symfony.
 */
export default function TabAssets({ contractId, t }: TabAssetsProps) {
  const [assets, setAssets] = useState<ContractAssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssets = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractAssets(contractId)

      if (response.success) {
        setAssets(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

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
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Référence</TableCell>
            <TableCell align='right'>Total HT</TableCell>
            <TableCell align='right'>TVA</TableCell>
            <TableCell>Créé par</TableCell>
            <TableCell>Créé le</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                Aucun avoir
              </TableCell>
            </TableRow>
          ) : null}
          {assets.map((a, i) => (
            <TableRow key={a.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{a.reference || '—'}</TableCell>
              <TableCell align='right'>{fmt(a.total_ht)}</TableCell>
              <TableCell align='right'>{fmt(a.total_tax)}</TableCell>
              <TableCell>{a.creator || '—'}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(a.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
