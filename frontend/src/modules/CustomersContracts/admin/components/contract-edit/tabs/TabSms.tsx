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

import { contractsService } from '../../../services/contractsService'
import type { ContractSmsItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabSmsProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabSms({ contractId, t }: TabSmsProps) {
  const [smsList, setSmsList] = useState<ContractSmsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSms = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractSms(contractId)

      if (response.success) {
        setSmsList(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchSms()
  }, [fetchSms])

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

  if (smsList.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        {t.tabSmsNoItems}
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t.tabSmsDate}</TableCell>
            <TableCell>{t.tabSmsMobile}</TableCell>
            <TableCell>{t.tabSmsMessage}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {smsList.map((s, i) => (
            <TableRow key={s.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</TableCell>
              <TableCell>{s.mobile}</TableCell>
              <TableCell>{s.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
