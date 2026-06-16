'use client'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'

import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabSmsProps {
  meetingId: number | null
  t: MeetingTranslations
}

/**
 * SMS tab - mirrors Symfony customers_communication_sms/sms component.
 * Shows sent SMS list with date, message, sender.
 * API integration pending CustomersCommunicationSms module migration.
 */
export default function TabSms({ t }: TabSmsProps) {
  const tR = t as Record<string, string>

  return (
    <Box>
      <Alert severity='info' sx={{ mb: 2 }}>
        {tR.tabSmsComingSoon ?? 'La liste des SMS sera disponible après la migration du module Communication SMS.'}
      </Alert>

      {/* SMS table - mirrors Symfony table structure */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabDate ?? 'Date'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabMessage ?? 'Message'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabSentBy ?? 'Envoyé par'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={4} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                {tR.tabNoSms ?? 'Aucun SMS'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
