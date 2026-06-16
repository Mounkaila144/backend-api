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

import { iso3ResultsService } from '@/modules/AppDomoprimeISO3'
import type { Iso3ContractResultsData } from '@/modules/AppDomoprimeISO3'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabIso3ResultsProps {
  contractId: number | null
  lang: string
  t: ContractTranslations
}

/**
 * Displays CUMAC + ANAH results for a contract.
 * Matches the Symfony template:
 *   app_domoprime_iso3_ajaxResultsForContract.tpl
 *
 * Sections:
 * 1. Informations: Zone, Region, Energie, Revenu, Niveau, Nombre de personnes
 * 2. CUMAC: Qmac prices or error messages
 * 3. ANAH: Moteur, Pollueur, Nombre de parts, Niveau, Anah disponibilité
 */
export default function TabIso3Results({ contractId, lang, t }: TabIso3ResultsProps) {
  const [results, setResults] = useState<Iso3ContractResultsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contractId) return

    let cancelled = false

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await iso3ResultsService.getResultsForContract(contractId, lang)

        if (!cancelled) {
          setResults(response.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(t.iso3ResultsError)
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
  }, [contractId, lang, t.iso3ResultsError])

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
        {t.iso3NoPolluter}
      </Alert>
    )
  }

  const { info, cumac, cumac_errors, anah } = results

  if (!info && !cumac && !anah) {
    return (
      <Alert severity='info' sx={{ mb: 2 }}>
        {t.iso3NoResults}
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

  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <CardContent>
        {/* ── Section 1: Informations (vertical table like Symfony) ── */}
        {info ? (
          <>
            <Typography variant='h6' sx={{ mb: 2 }}>Informations</Typography>
            <TableContainer>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, width: '200px' }}>Zone:</TableCell>
                    <TableCell>{info.zone ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Région:</TableCell>
                    <TableCell>{info.region ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Energie:</TableCell>
                    <TableCell>{info.energy ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Revenu:</TableCell>
                    <TableCell>{formatCurrency(info.revenue)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Niveau:</TableCell>
                    <TableCell>{info.level ?? '----'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Nombre de personnes:</TableCell>
                    <TableCell>{formatNumber(info.number_of_people)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </>
        ) : null}

        {/* ── Section 2: CUMAC ── */}
        <Divider sx={{ my: 2 }} />
        <Typography variant='h6' sx={{ mb: 2 }}>CUMAC</Typography>

        {/* CUMAC Errors (like Symfony's error container) */}
        {cumac_errors && cumac_errors.length > 0 ? (
          <>
            {cumac_errors.map((err, i) => (
              <Alert key={i} severity='error' sx={{ mb: 1 }}>{err}</Alert>
            ))}
            <Typography color='text.secondary' sx={{ mt: 1 }}>
              Le moteur a des erreurs.
            </Typography>
          </>
        ) : null}

        {/* CUMAC Results (only shown if no errors) */}
        {cumac && (!cumac_errors || cumac_errors.length === 0) ? (
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Qmac</TableCell>
                  <TableCell>Anah</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cumac.prices.map((price, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={index < cumac.prices.length - 1 ? { borderBottom: 'none' } : undefined}
                    >
                      {price.has_surface ? price.qmac : '---'}
                    </TableCell>
                    {index === 0 ? (
                      <TableCell rowSpan={cumac.prices.length}>
                        <Chip
                          label={cumac.is_ana_available ? 'Disponible' : 'Non disponible'}
                          color={cumac.is_ana_available ? 'success' : 'default'}
                          size='small'
                          variant='outlined'
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}

        {/* ── Section 3: ANAH (like Symfony's ANAH section) ── */}
        {anah ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant='h6' sx={{ mb: 2 }}>ANAH</Typography>
            <TableContainer>
              <Table size='small'>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, width: '200px' }}>Moteur</TableCell>
                    <TableCell>{anah.engine}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Pollueur</TableCell>
                    <TableCell>{anah.polluter_name ?? '---'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Nombre de parts:</TableCell>
                    <TableCell>{formatNumber(anah.number_of_parts)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Niveau:</TableCell>
                    <TableCell>{anah.level ?? '----'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Anah:</TableCell>
                    <TableCell>
                      <Chip
                        label={anah.is_available ? 'Disponible' : 'Non disponible'}
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
