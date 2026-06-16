'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

import { apiClient } from '@/shared/lib/api-client'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabCalculSubventionProps {
  meetingId: number | null
  t: MeetingTranslations
}

interface ResultsData {
  has_polluter: boolean
  engine_type?: string | null
  info?: {
    zone: string | null
    region: string | null
    energy: string | null
    revenue: number
    level: string | null
    number_of_people: number
  } | null
  cumac?: {
    prices: Array<{ qmac: number | null; has_surface: boolean; product_id?: number }>
    total?: number
    polluter_unit_price?: number
    prime_cee?: number
    is_ana_available: boolean
  } | null
  cumac_errors?: string[]
  anah?: {
    engine: string
    polluter_name: string | null
    number_of_parts?: number
    level?: string | null
    is_available: boolean
  } | null
}

/**
 * CUMAC + Prime CEE + ANAH summary tab (Story M3).
 *
 * Mirrors Symfony app_domoprime_iso3_ajaxResultsForMeeting.tpl:
 *   1. Informations: Zone, Region, Energie, Revenu, Niveau, Nombre de personnes
 *   2. CUMAC: per-product Qmac values + total + Prime CEE (Story M3 enhancement)
 *   3. ANAH availability summary
 */
export default function TabCalculSubvention({ meetingId, t }: TabCalculSubventionProps) {
  const tR = t as MeetingTranslations & Record<string, string>
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!meetingId) return

    let cancelled = false

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await apiClient.get<{ success: boolean; data: ResultsData }>(
          `/admin/appdomoprime-iso3/meetings/${meetingId}/results`,
        )

        if (!cancelled && res.data.success) {
          setResults(res.data.data)
        }
      } catch {
        if (!cancelled) {
          setError(tR.resErrorLoading ?? 'Erreur lors du chargement des résultats')
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
  }, [meetingId, tR.resErrorLoading])

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
    return (
      <Alert severity='info' sx={{ mb: 2 }}>
        {tR.resNoPolluter ?? 'Aucun pollueur assigné à ce rendez-vous.'}
      </Alert>
    )
  }

  const { info, cumac, cumac_errors, anah, engine_type } = results

  if (!info && !cumac && !anah) {
    return (
      <Alert severity='info' sx={{ mb: 2 }}>
        {tR.resNoCalculations ?? 'Aucun résultat de calcul disponible.'}
      </Alert>
    )
  }

  const formatNumber = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '---'
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
  }

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '---'
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const hasCumacErrors = cumac_errors && cumac_errors.length > 0
  const hasCumacResults = cumac && !hasCumacErrors

  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <CardContent>
        {/* Section 1 — Informations */}
        {info ? (
          <>
            <Typography variant='h6' sx={{ mb: 2 }}>
              {tR.resInformations ?? 'Informations'}
            </Typography>
            <TableContainer>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, width: '200px' }}>{tR.resZone ?? 'Zone'}</TableCell>
                    <TableCell>{info.zone ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resRegion ?? 'Région'}</TableCell>
                    <TableCell>{info.region ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resEnergy ?? 'Énergie'}</TableCell>
                    <TableCell>{info.energy ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resRevenue ?? 'Revenu'}</TableCell>
                    <TableCell>{formatCurrency(info.revenue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resLevel ?? 'Niveau'}</TableCell>
                    <TableCell>{info.level ?? '----'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resNumberOfPeople ?? 'Nombre de personnes'}</TableCell>
                    <TableCell>{formatNumber(info.number_of_people)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : null}

        {/* Section 2 — CUMAC */}
        <Divider sx={{ my: 2 }} />
        <Typography variant='h6' sx={{ mb: 2 }}>{tR.resCumac ?? 'CUMAC'}</Typography>

        {hasCumacErrors ? (
          <>
            {cumac_errors!.map((err, i) => (
              <Alert key={i} severity='error' sx={{ mb: 1 }}>{err}</Alert>
            ))}
            {engine_type ? (
              <Alert severity='warning' sx={{ mb: 1 }}>
                {engine_type}: {tR.resEngineNoTariff ?? 'Le tarif n\'existe pas.'}
              </Alert>
            ) : null}
            <Typography color='text.secondary' sx={{ mt: 1 }}>
              {tR.resEngineHasErrors ?? 'Le moteur a des erreurs.'}
            </Typography>
          </>
        ) : null}

        {hasCumacResults && cumac ? (
          <>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{tR.resQmac ?? 'Qmac'}</TableCell>
                    <TableCell>{tR.resAnah ?? 'Anah'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cumac.prices.map((price, index) => (
                    <TableRow key={index}>
                      <TableCell
                        sx={index < cumac.prices.length - 1 ? { borderBottom: 'none' } : undefined}
                      >
                        {price.has_surface ? formatNumber(price.qmac) : '---'}
                      </TableCell>
                      {index === 0 ? (
                        <TableCell rowSpan={cumac.prices.length}>
                          <Chip
                            label={cumac.is_ana_available ? (tR.resAvailable ?? 'Disponible') : (tR.resNotAvailable ?? 'Non disponible')}
                            color={cumac.is_ana_available ? 'success' : 'default'}
                            size='small'
                            variant='outlined'
                          />
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                  {cumac.total != null ? (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {tR.resTotalCumac ?? 'Total CUMAC'}: {formatNumber(cumac.total)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Prime CEE — visible only when polluter pricing resolved */}
            {cumac.prime_cee != null && cumac.prime_cee > 0 ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
                  {tR.resPrimeCee ?? 'Prime CEE'}
                </Typography>
                <Typography variant='h5' color='primary' sx={{ fontWeight: 700 }}>
                  {formatCurrency(cumac.prime_cee)} €
                </Typography>
                {cumac.polluter_unit_price ? (
                  <Typography variant='caption' color='text.secondary'>
                    {tR.resPolluterUnitPrice ?? 'Prix unitaire pollueur'}:{' '}
                    {cumac.polluter_unit_price.toLocaleString('fr-FR', { maximumFractionDigits: 6 })}{' '}
                    {tR.resPriceUnit ?? '€/kWh cumac'}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
          </>
        ) : null}

        {/* Section 3 — ANAH */}
        {anah ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>{tR.resAnah ?? 'ANAH'}</Typography>
            <TableContainer>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, width: '200px' }}>{tR.resEngine ?? 'Moteur'}</TableCell>
                    <TableCell>{anah.engine}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>{tR.resPolluter ?? 'Pollueur'}</TableCell>
                    <TableCell>{anah.polluter_name ?? '---'}</TableCell>
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
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
