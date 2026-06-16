'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'

import { apiClient } from '@/shared/lib/api-client'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabRequestsProps {
  meetingId: number | null
  t: MeetingTranslations
}

interface Calculation {
  id: number
  region: string
  zone: string
  sector: string
  energy: string
  class: string
  revenue: number
  number_of_people: number
  qmac: number
  qmac_value: number
  user: string
  accepted_by: string | null
  created_at: string | null
  status: string | null
}

/**
 * Displays calculation list for a meeting (Demandes tab).
 * Mirrors Symfony: app_domoprime_ajaxListPartialRequestForMeeting.tpl
 *
 * Table columns: #, Region, Zone, Sector, Energy, Class, Revenue,
 *   Number of people, Qmac, Qmac value, By, Validated By, Created at
 */
export default function TabRequests({ meetingId }: TabRequestsProps) {
  const [calculations, setCalculations] = useState<Calculation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!meetingId) return

    let cancelled = false

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await apiClient.get<{ success: boolean; data: Calculation[] }>(
          `/admin/appdomoprime/calculations/meeting/${meetingId}`,
        )

        if (!cancelled && res.data.success) {
          setCalculations(res.data.data)
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors du chargement des demandes')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      cancelled = true
    }
  }, [meetingId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>
  }

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '---'
    
return val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>Calculs</Typography>
        <IconButton onClick={() => window.location.reload()} size='small' title='Refresh'>
          <i className='ri-refresh-line' />
        </IconButton>
      </Box>

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Région</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Zone</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Secteur</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Énergie</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Classe</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Revenu</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nb pers.</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Qmac</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Qmac valeur</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Par</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Validé par</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Créé le</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {calculations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun calcul
                </TableCell>
              </TableRow>
            ) : (
              calculations.map((calc, index) => (
                <TableRow key={calc.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{calc.region}</TableCell>
                  <TableCell>{calc.zone}</TableCell>
                  <TableCell>{calc.sector}</TableCell>
                  <TableCell>{calc.energy}</TableCell>
                  <TableCell>{calc.class}</TableCell>
                  <TableCell>{formatNumber(calc.revenue)}</TableCell>
                  <TableCell>{formatNumber(calc.number_of_people)}</TableCell>
                  <TableCell>{formatNumber(calc.qmac)}</TableCell>
                  <TableCell>{formatNumber(calc.qmac_value)}</TableCell>
                  <TableCell>{calc.user}</TableCell>
                  <TableCell>{calc.accepted_by ?? 'Aucun valideur'}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{calc.created_at ?? '---'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
