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

import { apiClient } from '@/shared/lib/api-client'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabDuplicateMobileProps {
  meetingId: number | null
  t: MeetingTranslations
}

interface DuplicateMeeting {
  id: number
  in_at: string | null
  state_id: number | null
  firstname: string | null
  lastname: string | null
  phone: string | null
  mobile: string | null
}

export default function TabDuplicateMobile({ meetingId, t }: TabDuplicateMobileProps) {
  const [duplicates, setDuplicates] = useState<DuplicateMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const tR = t as Record<string, string>

  const loadDuplicates = useCallback(async () => {
    if (!meetingId) return
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.get<{ success: boolean; data: DuplicateMeeting[] }>(
        `/admin/customersmeetings/meetings/${meetingId}/duplicate-mobile`,
      )

      if (res.data.success) {
        setDuplicates(res.data.data)
      }
    } catch {
      setError(tR.tabDuplicateLoadError ?? 'Erreur lors du chargement des doublons')
    } finally {
      setLoading(false)
    }
  }, [meetingId, tR.tabDuplicateLoadError])

  useEffect(() => {
    loadDuplicates()
  }, [loadDuplicates])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (duplicates.length === 0) {
    return (
      <Alert severity='success'>
        {tR.tabNoDuplicates ?? 'Aucun rendez-vous avec le même numéro de mobile.'}
      </Alert>
    )
  }

  return (
    <Box>
      <Alert severity='warning' sx={{ mb: 2 }}>
        {tR.tabDuplicateWarning ?? `${duplicates.length} rendez-vous trouvé(s) avec le même mobile.`}
      </Alert>

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabDate ?? 'Date'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabClient ?? 'Client'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabPhone ?? 'Téléphone'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabMobile ?? 'Mobile'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duplicates.map(dup => (
              <TableRow key={dup.id} hover>
                <TableCell>{dup.id}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{dup.in_at ?? '---'}</TableCell>
                <TableCell>{[dup.lastname, dup.firstname].filter(Boolean).join(' ') || '---'}</TableCell>
                <TableCell>{dup.phone ?? '---'}</TableCell>
                <TableCell>{dup.mobile ?? '---'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
