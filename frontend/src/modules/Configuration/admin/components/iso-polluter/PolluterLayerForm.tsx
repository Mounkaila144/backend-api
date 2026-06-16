'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface LayerOption {
  id: number
  name: string
  commercial: string | null
  rge: string | null
  city: string | null
}

interface LayerData {
  layer_id: number | null
  layer_name: string | null
  options: LayerOption[]
}

interface Props {
  polluterId: number
  polluterName: string
  onBack: () => void
}

export default function PolluterLayerForm({ polluterId, polluterName, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/layer`

  const [data, setData] = useState<LayerData | null>(null)
  const [selected, setSelected] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: LayerData }>(baseUrl)
      if (res.data.success) {
        setData(res.data.data)
        setSelected(res.data.data.layer_id ?? '')
      }
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.settingsLoadError])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiClient.put<{ success: boolean; data: { layer_id: number | null; layer_name: string | null } }>(
        baseUrl,
        { layer_id: selected === '' ? null : selected },
      )
      if (res.data.success && data) {
        setData({
          ...data,
          layer_id: res.data.data.layer_id,
          layer_name: res.data.data.layer_name,
        })
        setSuccessMsg(t.polluterLayerSaved)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error ? <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}

      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant='outlined' size='small' onClick={onBack}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.isoPolluterSubBack}
        </Button>
        <Typography variant='h5' sx={{ ml: 1 }}>
          {t.polluterLayerTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t.polluterLayerHelp}
          </Typography>

          {data?.layer_name ? (
            <Typography variant='body2' sx={{ mb: 2 }}>
              {t.polluterLayerCurrent}: <strong>{data.layer_name}</strong>
            </Typography>
          ) : null}

          <TextField
            select
            fullWidth
            label={t.polluterLayerLabel}
            value={selected}
            onChange={e => setSelected(e.target.value === '' ? '' : Number(e.target.value))}
            sx={{ mb: 3, maxWidth: 480 }}
          >
            <MenuItem value=''>{t.polluterLayerNone}</MenuItem>
            {data?.options.map(o => (
              <MenuItem key={o.id} value={o.id}>
                {o.name}
                {o.commercial ? ` (${o.commercial})` : ''}
                {o.rge ? ` — RGE ${o.rge}` : ''}
                {o.city ? ` — ${o.city}` : ''}
              </MenuItem>
            ))}
          </TextField>

          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <i className='ri-save-line' style={{ marginRight: 6 }} />}
            {t.polluterLayerSave}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
