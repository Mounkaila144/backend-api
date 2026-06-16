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
import type { ContractEmailItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabEmailsProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabEmails({ contractId, t }: TabEmailsProps) {
  const [emails, setEmails] = useState<ContractEmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmails = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractEmails(contractId)

      if (response.success) {
        setEmails(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

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

  if (emails.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        {t.tabEmailNoItems}
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t.tabEmailDate}</TableCell>
            <TableCell>{t.tabEmailSentAt}</TableCell>
            <TableCell>{t.tabEmailSubject}</TableCell>
            <TableCell>{t.tabEmailUser}</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {emails.map((e, i) => (
            <TableRow key={e.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.created_at)}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(e.sent_at)}</TableCell>
              <TableCell>{e.subject}</TableCell>
              <TableCell>{e.user?.name || '—'}</TableCell>
              <TableCell>
                <Chip
                  label={e.is_sent ? 'Sent' : 'Pending'}
                  size='small'
                  color={e.is_sent ? 'success' : 'warning'}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
