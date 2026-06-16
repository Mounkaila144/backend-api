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
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

import { contractsService } from '../../../services/contractsService'
import type { ContractInstallationItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabInstallationsProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabInstallations({ contractId, t }: TabInstallationsProps) {
  const [installations, setInstallations] = useState<ContractInstallationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInstallations = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractInstallations(contractId)

      if (response.success) {
        setInstallations(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchInstallations()
  }, [fetchInstallations])

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
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

  if (installations.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        {t.editTabInstallations} — {t.tabProductNoItems}
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t.tabCommentDate}</TableCell>
            <TableCell>{t.tabProductName}</TableCell>
            <TableCell>Installateur</TableCell>
            <TableCell>{t.tabProductDetails}</TableCell>
            <TableCell>{t.tabCommentStatus}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {installations.map((s, i) => (
            <TableRow key={s.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(s.in_at)}</TableCell>
              <TableCell>{s.product?.name || '—'}</TableCell>
              <TableCell>{s.installer?.name || '—'}</TableCell>
              <TableCell>{s.details || '—'}</TableCell>
              <TableCell>
                <Chip
                  label={s.status}
                  size='small'
                  color={s.status === 'ACTIVE' ? 'success' : 'default'}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
