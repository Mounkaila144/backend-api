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
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

import { meetingsService } from '../../../services/meetingsService'
import type { MeetingLog } from '../../../services/meetingsService'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabLogsProps {
  meetingId: number | null
  t: MeetingTranslations
}

export default function TabLogs({ meetingId, t }: TabLogsProps) {
  const [logs, setLogs] = useState<MeetingLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadLogs = useCallback(async () => {
    if (!meetingId) return
    setLoading(true)
    setError(null)

    try {
      const res = await meetingsService.getLogs(meetingId)

      if (res.success) {
        setLogs(res.data)
      }
    } catch {
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const tR = t as Record<string, string>

  return (
    <Box>
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <IconButton onClick={loadLogs} size='small' title='Refresh'>
          <i className='ri-refresh-line' />
        </IconButton>
      </Box>

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabDate ?? 'Date'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabLog ?? 'Log'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabUser ?? 'Utilisateur'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabStatusChange ?? 'Changement'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                  {tR.tabNoLogs ?? 'Aucun log'}
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <TableRow key={log.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{log.created_at ?? '---'}</TableCell>
                  <TableCell sx={{ maxWidth: 400, wordBreak: 'break-word' }}>{log.comment ?? '---'}</TableCell>
                  <TableCell>{log.user ?? '---'}</TableCell>
                  <TableCell>
                    {log.old_status || log.new_status ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {log.old_status ? <Chip label={log.old_status} size='small' color='default' /> : null}
                        {log.old_status && log.new_status ? <i className='ri-arrow-right-line' style={{ fontSize: 14 }} /> : null}
                        {log.new_status ? <Chip label={log.new_status} size='small' color='primary' /> : null}
                      </Box>
                    ) : '---'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
