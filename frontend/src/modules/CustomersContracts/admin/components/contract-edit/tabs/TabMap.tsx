'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'

import { contractsService } from '../../../services/contractsService'
import type { ContractLocalisation } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabMapProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabMap({ contractId, t }: TabMapProps) {
  const [localisation, setLocalisation] = useState<ContractLocalisation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLocalisation = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractLocalisation(contractId)

      if (response.success) {
        setLocalisation(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchLocalisation()
  }, [fetchLocalisation])

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

  if (!localisation || (!localisation.lat && !localisation.lng)) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        Aucune adresse disponible
      </Typography>
    )
  }

  // OpenStreetMap embed (no API key needed, like Symfony's Géoportail)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${localisation.lng - 0.005}%2C${localisation.lat - 0.003}%2C${localisation.lng + 0.005}%2C${localisation.lat + 0.003}&layer=mapnik&marker=${localisation.lat}%2C${localisation.lng}`

  return (
    <Box>
      {/* Address info */}
      <Paper variant='outlined' sx={{ p: 2, mb: 2 }}>
        <Typography variant='subtitle2' gutterBottom>
          <i className='ri-map-pin-line' style={{ marginRight: 8 }} />
          {localisation.full_address}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {localisation.address1}
          {localisation.address2 ? `, ${localisation.address2}` : ''}
          {' — '}
          {localisation.postcode} {localisation.city}
          {localisation.country ? `, ${localisation.country}` : ''}
        </Typography>
        <Typography variant='caption' color='text.disabled'>
          Lat: {localisation.lat.toFixed(6)}, Lng: {localisation.lng.toFixed(6)}
        </Typography>
      </Paper>

      {/* Map embed */}
      <Paper variant='outlined' sx={{ overflow: 'hidden', borderRadius: 1 }}>
        <iframe
          title='Localisation'
          width='100%'
          height='450'
          style={{ border: 0 }}
          src={mapUrl}
          allowFullScreen
        />
      </Paper>
    </Box>
  )
}
