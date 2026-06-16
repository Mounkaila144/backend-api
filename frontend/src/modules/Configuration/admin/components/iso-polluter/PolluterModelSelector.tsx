'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

export type ModelType = 'quotation' | 'billing' | 'premeeting' | 'afterwork'

interface ModelOption {
  id: number
  name: string
}

interface ModelData {
  type: ModelType
  fields: string[]
  values: Record<string, number | null>
  options: ModelOption[]
}

interface Props {
  polluterId: number
  polluterName: string
  modelType: ModelType
  onBack: () => void
}

const FIELD_LABELS: Record<string, keyof ReturnType<typeof useConfigTranslations>> = {
  model_id: 'polluterModelMain',
  pre_model_id: 'polluterModelPre',
  post_company_model_id: 'polluterModelPost',
}

export default function PolluterModelSelector({ polluterId, polluterName, modelType, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/model/${modelType}`

  const [data, setData] = useState<ModelData | null>(null)
  const [values, setValues] = useState<Record<string, number | ''>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: ModelData }>(baseUrl, { params: { lang: 'fr' } })
      if (res.data.success) {
        setData(res.data.data)
        const initial: Record<string, number | ''> = {}
        for (const f of res.data.data.fields) {
          initial[f] = res.data.data.values[f] ?? ''
        }
        setValues(initial)
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
      const payload: Record<string, number | null> = {}
      for (const [k, v] of Object.entries(values)) {
        payload[k] = v === '' ? null : Number(v)
      }
      const res = await apiClient.put<{ success: boolean }>(baseUrl, payload)
      if (res.data.success) {
        setSuccessMsg(t.polluterModelSaved)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  const title = (() => {
    switch (modelType) {
      case 'quotation': return t.polluterModelTitleQuotation
      case 'billing':   return t.polluterModelTitleBilling
      case 'premeeting': return t.polluterModelTitlePreMeeting
      case 'afterwork': return t.polluterModelTitleAfterWork
    }
  })()

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
          {title} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t.polluterModelHelp}
          </Typography>

          <Grid container spacing={2} sx={{ maxWidth: 720 }}>
            {data?.fields.map(field => {
              const labelKey = FIELD_LABELS[field]
              const label = labelKey ? (t as Record<string, string>)[labelKey] : field
              return (
                <Grid item xs={12} key={field}>
                  <TextField
                    select
                    fullWidth
                    label={label}
                    value={values[field] ?? ''}
                    onChange={e =>
                      setValues(prev => ({
                        ...prev,
                        [field]: e.target.value === '' ? '' : Number(e.target.value),
                      }))
                    }
                  >
                    <MenuItem value=''>{t.polluterModelNone}</MenuItem>
                    {data.options.map(o => (
                      <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )
            })}
          </Grid>

          <Button variant='contained' onClick={handleSave} disabled={saving} sx={{ mt: 3 }}>
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <i className='ri-save-line' style={{ marginRight: 6 }} />}
            {t.polluterModelSave}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
