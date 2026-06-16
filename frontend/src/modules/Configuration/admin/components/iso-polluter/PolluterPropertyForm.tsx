'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface PropertyData {
  id: number | null
  prime: string | null
  pack_prime: string | null
  ite_prime: string | null
  ana_prime: string | null
  home_prime: string | null
}

type FormData = {
  prime: string
  pack_prime: string
  ite_prime: string
  ana_prime: string
  home_prime: string
}

const empty: FormData = {
  prime: '',
  pack_prime: '',
  ite_prime: '',
  ana_prime: '',
  home_prime: '',
}

interface Props {
  polluterId: number
  polluterName: string
  polluterType: string | null
  onBack: () => void
}

export default function PolluterPropertyForm({ polluterId, polluterName, polluterType, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/property`

  const [formData, setFormData] = useState<FormData>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const isITEType = ['ITE', 'TYPE1', 'TYPE2'].includes((polluterType ?? '').toUpperCase())

  const set = (key: keyof FormData, value: string) => setFormData(prev => ({ ...prev, [key]: value }))

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: PropertyData }>(baseUrl)
      if (res.data.success) {
        setFormData({
          prime: res.data.data.prime ?? '',
          pack_prime: res.data.data.pack_prime ?? '',
          ite_prime: res.data.data.ite_prime ?? '',
          ana_prime: res.data.data.ana_prime ?? '',
          home_prime: res.data.data.home_prime ?? '',
        })
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
      for (const [k, v] of Object.entries(formData)) {
        payload[k] = v === '' ? null : Number(v)
      }
      const res = await apiClient.put<{ success: boolean }>(baseUrl, payload)
      if (res.data.success) {
        setSuccessMsg(t.polluterPropertySaved)
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
          {t.polluterPropertyTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t.polluterPropertyHelp}
          </Typography>

          <Grid container spacing={2} sx={{ maxWidth: 720 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type='number' label={t.polluterPropertyPrime} value={formData.prime} onChange={e => set('prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type='number' label={t.polluterPropertyPackPrime} value={formData.pack_prime} onChange={e => set('pack_prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type='number' label={t.polluterPropertyHomePrime} value={formData.home_prime} onChange={e => set('home_prime', e.target.value)} inputProps={{ step: 'any' }} />
            </Grid>
            {isITEType ? (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type='number' label={t.polluterPropertyItePrime} value={formData.ite_prime} onChange={e => set('ite_prime', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type='number' label={t.polluterPropertyAnaPrime} value={formData.ana_prime} onChange={e => set('ana_prime', e.target.value)} inputProps={{ step: 'any' }} />
                </Grid>
              </>
            ) : null}
          </Grid>

          <Button variant='contained' onClick={handleSave} disabled={saving} sx={{ mt: 3 }}>
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <i className='ri-save-line' style={{ marginRight: 6 }} />}
            {t.polluterPropertySave}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
