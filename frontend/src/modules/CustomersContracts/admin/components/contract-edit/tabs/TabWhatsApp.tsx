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
import type { ContractWhatsAppItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabWhatsAppProps {
  contractId: number | null

  /** 'customer' for customer WhatsApp, 'partner' for partner WhatsApp */
  variant: 'customer' | 'partner'
  t: ContractTranslations
}

export default function TabWhatsApp({ contractId, variant, t }: TabWhatsAppProps) {
  const [messages, setMessages] = useState<ContractWhatsAppItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)

      const response =
        variant === 'partner'
          ? await contractsService.getContractPartnerWhatsApp(contractId)
          : await contractsService.getContractWhatsApp(contractId)

      if (response.success) {
        setMessages(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, variant, t.tabErrorLoading])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

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

  if (messages.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        Aucun message WhatsApp
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Envoyé par</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {messages.map((m, i) => (
            <TableRow key={m.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(m.created_at)}</TableCell>
              <TableCell>{m.message?.length > 120 ? m.message.substring(0, 120) + '...' : m.message}</TableCell>
              <TableCell>{m.user?.name || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
