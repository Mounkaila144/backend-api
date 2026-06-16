'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { apiClient } from '@/shared/lib/api-client'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabResultsAnahProps {
  meetingId: number | null
  t: MeetingTranslations
}

interface AnahData {
  has_polluter: boolean
  anah?: {
    engine: string
    polluter_name: string | null
    zone?: string | null
    region?: string | null
    energy?: string | null
    revenue?: number
    number_of_people?: number
    number_of_parts?: number
    level?: string | null
    is_available: boolean
  } | null
  errors?: string[]
}

/**
 * ANAH-only results tab (Story M3).
 * Mirror of Symfony app_domoprime_iso3_ajaxResultsAnaForMeeting.tpl.
 */
export default function TabResultsAnah({ meetingId, t }: TabResultsAnahProps) {
  const tR = t as MeetingTranslations & Record<string, string>
  const [results, setResults] = useState<AnahData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!meetingId) return

    let cancelled = false

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await apiClient.get<{ success: boolean; data: AnahData }>(
          `/admin/appdomoprime-iso3/meetings/${meetingId}/results-anah`,
        )

        if (!cancelled && res.data.success) {
          setResults(res.data.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : (tR.resErrorLoadingAnah ?? 'Erreur lors du chargement des résultats ANAH'))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchResults()

    return () => {
      cancelled = true
    }
  }, [meetingId, tR.resErrorLoadingAnah])

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

  if (!results) return null

  if (!results.has_polluter) {
    return <Alert severity='info'>{tR.resAnahNotAvailable ?? 'Aucun pollueur dans le rendez-vous.'}</Alert>
  }

  if (!results.anah && (!results.errors || results.errors.length === 0)) {
    return null
  }

  const { anah } = results

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '---'
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  }

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '---'
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Card variant='outlined'>
      <CardContent>
        {results.errors && results.errors.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            {results.errors.map((err, i) => (
              <Alert key={i} severity='error' sx={{ mb: 1 }}>{err}</Alert>
            ))}
          </Box>
        ) : null}

        {anah ? (
          <TableContainer>
            <Table size='small'>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500, width: '200px' }}>{tR.resEngine ?? 'Moteur'}</TableCell>
                  <TableCell>{anah.engine}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resPolluter ?? 'Pollueur'}</TableCell>
                  <TableCell>{anah.polluter_name ? anah.polluter_name.toUpperCase() : '---'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resZone ?? 'Zone'}</TableCell>
                  <TableCell>{anah.zone ?? '---'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resRegion ?? 'Région'}</TableCell>
                  <TableCell>{anah.region ?? '---'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resEnergy ?? 'Énergie'}</TableCell>
                  <TableCell>{anah.energy ?? '---'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resRevenue ?? 'Revenu'}</TableCell>
                  <TableCell>{formatCurrency(anah.revenue)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resNumberOfPeople ?? 'Nombre de personnes'}</TableCell>
                  <TableCell>{formatNumber(anah.number_of_people)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resNumberOfParts ?? 'Nombre de parts'}</TableCell>
                  <TableCell>{formatNumber(anah.number_of_parts)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resLevel ?? 'Niveau'}</TableCell>
                  <TableCell>{anah.level ?? '----'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 500 }}>{tR.resAnah ?? 'Anah'}</TableCell>
                  <TableCell>
                    <Chip
                      label={anah.is_available ? (tR.resAvailable ?? 'Disponible') : (tR.resNotAvailable ?? 'Non disponible')}
                      color={anah.is_available ? 'success' : 'default'}
                      size='small'
                      variant='outlined'
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </CardContent>
    </Card>
  )
}
