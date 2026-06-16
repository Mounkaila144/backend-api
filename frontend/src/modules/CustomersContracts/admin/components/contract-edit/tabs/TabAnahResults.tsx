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
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { iso3ResultsService } from '@/modules/AppDomoprimeISO3'
import type { Iso3AnahResultsData } from '@/modules/AppDomoprimeISO3'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabAnahResultsProps {
  contractId: number | null
  lang: string
  t: ContractTranslations
}

/**
 * Displays ANAH-only results for a contract.
 * Matches Symfony: app_domoprime_iso3_ajaxResultsAnaForContract.tpl
 *
 * Shows (for ITE/PAC/BOILER/TYPE1/TYPE2):
 *   Engine, Polluter, Zone, Region, Energy, Revenue,
 *   Number of people, Number of parts, Level, Anah availability
 */
export default function TabAnahResults({ contractId, lang }: TabAnahResultsProps) {
  const [results, setResults] = useState<Iso3AnahResultsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!contractId) return

    let cancelled = false

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await iso3ResultsService.getResultsAnaForContract(contractId, lang)

        if (!cancelled) {
          setResults(response.data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error loading ANAH results')
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
  }, [contractId, lang])

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
    return <Alert severity='info'>Aucun pollueur dans le contrat.</Alert>
  }

  // Display errors from the engine
  if (results.errors && results.errors.length > 0) {
    return (
      <Box>
        {results.errors.map((err, i) => (
          <Alert key={i} severity='error' sx={{ mb: 1 }}>{err}</Alert>
        ))}
        <Typography color='text.secondary' sx={{ mt: 1 }}>
          Le moteur a des erreurs.
        </Typography>
      </Box>
    )
  }

  if (!results.anah) {
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
        <TableContainer>
          <Table size='small'>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 500, width: '200px' }}>Moteur</TableCell>
                <TableCell>{anah.engine}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Pollueur</TableCell>
                <TableCell>{anah.polluter_name ? anah.polluter_name.toUpperCase() : 'Aucun pollueur'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Zone:</TableCell>
                <TableCell>{anah.zone ?? '---'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Région:</TableCell>
                <TableCell>{anah.region ?? '---'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Energie:</TableCell>
                <TableCell>{anah.energy ?? '---'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Revenu:</TableCell>
                <TableCell>{formatCurrency(anah.revenue)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Nombre de personnes:</TableCell>
                <TableCell>{formatNumber(anah.number_of_people)}</TableCell>
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
      </CardContent>
    </Card>
  )
}
