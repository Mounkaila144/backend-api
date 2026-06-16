'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import { useTheme } from '@mui/material/styles'

import { tourGeneratorService } from '../../services/tourGeneratorService'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface TourSettings {
  tour_average_meeting_duration: number
  tour_average_speed_kmh: number
  tour_max_total_distance_limit: number
  tour_dbscan_max_eps_km: number
  tour_max_duration_hours: number
  tour_max_duration_minutes: number
  tour_openroute_server_url: string
  tour_openroute_timeout: number
  tour_openroute_api_key: string
  tour_data_gouv_endpoint: string
  tour_data_gouv_timeout: number
  tour_mapbox_access_token: string
  [key: string]: any
}

const DEFAULTS: TourSettings = {
  tour_average_meeting_duration: 45,
  tour_average_speed_kmh: 45,
  tour_max_total_distance_limit: 350,
  tour_dbscan_max_eps_km: 20,
  tour_max_duration_hours: 8,
  tour_max_duration_minutes: 0,
  tour_openroute_server_url: 'https://api.openrouteservice.org',
  tour_openroute_timeout: 10,
  tour_openroute_api_key: '',
  tour_data_gouv_endpoint: 'https://api-adresse.data.gouv.fr',
  tour_data_gouv_timeout: 5,
  tour_mapbox_access_token: '',
}

const SectionHeader = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <Box
      sx={{
        width: 32, height: 32, borderRadius: 1.5, bgcolor: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <i className={icon} style={{ fontSize: 18, color }} />
    </Box>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
  </Box>
)

const TourGeneratorSettings = () => {
  const theme = useTheme()
  const t = useConfigTranslations() as Record<string, string>

  const [settings, setSettings] = useState<TourSettings>(DEFAULTS)
  const [originalSettings, setOriginalSettings] = useState<TourSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const isDirty = JSON.stringify(settings) !== JSON.stringify(originalSettings)

  // Load settings
  useEffect(() => {
    tourGeneratorService.getSettings().then(res => {
      if (res.success) {
        const merged = { ...DEFAULTS, ...res.data }
        setSettings(merged)
        setOriginalSettings(merged)
      }
    }).catch(() => {
      setSnackbar({ open: true, message: t.settingsLoadError || 'Erreur de chargement', severity: 'error' })
    }).finally(() => setLoading(false))
  }, [])

  const handleChange = useCallback((key: keyof TourSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await tourGeneratorService.updateSettings(settings)
      if (res.success) {
        setOriginalSettings({ ...settings })
        setSnackbar({ open: true, message: t.settingsSaved || 'Enregistre', severity: 'success' })
      }
    } catch {
      setSnackbar({ open: true, message: t.settingsSaveError || 'Erreur', severity: 'error' })
    } finally {
      setSaving(false)
    }
  }, [settings, t])

  const handleReset = useCallback(() => {
    setSettings({ ...originalSettings })
  }, [originalSettings])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const totalDuration = (settings.tour_max_duration_hours || 0) + (settings.tour_max_duration_minutes || 0) / 60

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        {t.tourSettingsTitle || 'Parametres du Generateur de Tournees'}
      </Typography>

      {/* Section 1: Base Parameters */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent>
          <SectionHeader icon="ri-settings-4-line" title={t.tourSectionBase || 'Parametres de base'} color="#059669" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t.tourAvgMeetingDuration || 'Duree moyenne RDV (min)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_average_meeting_duration}
                onChange={e => handleChange('tour_average_meeting_duration', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 5, max: 240 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label={t.tourAvgSpeed || 'Vitesse moyenne (km/h)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_average_speed_kmh}
                onChange={e => handleChange('tour_average_speed_kmh', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 10, max: 130 } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 2: Clustering */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent>
          <SectionHeader icon="ri-bubble-chart-line" title={t.tourSectionClustering || 'Clustering DBSCAN'} color="#7C3AED" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={t.tourMaxEpsKm || 'Distance max cluster (km)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_dbscan_max_eps_km}
                onChange={e => handleChange('tour_dbscan_max_eps_km', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 100 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={t.tourMaxDurationHours || 'Duree max (heures)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_max_duration_hours}
                onChange={e => handleChange('tour_max_duration_hours', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 24 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={t.tourMaxDurationMinutes || 'Duree max (minutes)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_max_duration_minutes}
                onChange={e => handleChange('tour_max_duration_minutes', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, max: 59 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label={t.tourMaxTotalDistance || 'Distance totale max (km)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_max_total_distance_limit}
                onChange={e => handleChange('tour_max_total_distance_limit', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 10, max: 1000 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Duree totale : <strong>{totalDuration.toFixed(1)}h</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 3: OpenRouteService API */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent>
          <SectionHeader icon="ri-route-line" title={t.tourSectionOpenRoute || 'API de routage (OpenRouteService)'} color="#2563EB" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label={t.tourOpenRouteUrl || 'URL du serveur'}
                fullWidth
                size="small"
                value={settings.tour_openroute_server_url}
                onChange={e => handleChange('tour_openroute_server_url', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label={t.tourOpenRouteTimeout || 'Timeout (sec)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_openroute_timeout}
                onChange={e => handleChange('tour_openroute_timeout', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 60 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={t.tourOpenRouteApiKey || 'Cle API'}
                fullWidth
                size="small"
                value={settings.tour_openroute_api_key}
                onChange={e => handleChange('tour_openroute_api_key', e.target.value)}
                type="password"
                helperText="Obtenez une cle gratuite sur openrouteservice.org"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 4: Geocoding API */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent>
          <SectionHeader icon="ri-map-pin-line" title={t.tourSectionGeocoding || 'API de geocodage (data.gouv.fr)'} color="#D97706" />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label={t.tourGeocodingEndpoint || 'URL du serveur'}
                fullWidth
                size="small"
                value={settings.tour_data_gouv_endpoint}
                onChange={e => handleChange('tour_data_gouv_endpoint', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label={t.tourGeocodingTimeout || 'Timeout (sec)'}
                type="number"
                fullWidth
                size="small"
                value={settings.tour_data_gouv_timeout}
                onChange={e => handleChange('tour_data_gouv_timeout', Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Section 5: Map */}
      <Card variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
        <CardContent>
          <SectionHeader icon="ri-map-2-line" title={t.tourSectionMap || 'Carte'} color="#0891B2" />
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label={t.tourMapboxToken || 'Token Mapbox'}
                fullWidth
                size="small"
                value={settings.tour_mapbox_access_token}
                onChange={e => handleChange('tour_mapbox_access_token', e.target.value)}
                type="password"
                helperText="Obtenez un token gratuit sur mapbox.com"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Divider sx={{ my: 2 }} />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button variant="outlined" color="inherit" onClick={handleReset} disabled={!isDirty || saving}>
          {t.cancel || 'Annuler'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!isDirty || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <i className="ri-save-line" />}
        >
          {saving ? (t.saving || 'Enregistrement...') : (t.save || 'Enregistrer')}
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default TourGeneratorSettings
