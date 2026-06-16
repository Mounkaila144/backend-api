'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Snackbar from '@mui/material/Snackbar'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface ProductOption {
  id: number
  engine: string | null
  reference: string | null
  name: string
}

interface ProductData {
  product_id: number | null
  product_name: string | null
  options: ProductOption[]
}

interface Props {
  polluterId: number
  polluterName: string
  onBack: () => void
}

export default function PolluterProductForm({ polluterId, polluterName, onBack }: Props) {
  const t = useConfigTranslations()

  const baseUrl = `/admin/appdomoprime/iso/polluters/${polluterId}/product`

  const [data, setData] = useState<ProductData | null>(null)
  const [selected, setSelected] = useState<number | ''>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await apiClient.get<{ success: boolean; data: ProductData }>(baseUrl)
      if (res.data.success) {
        setData(res.data.data)
        setSelected(res.data.data.product_id ?? '')
      }
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [baseUrl, t.settingsLoadError])

  useEffect(() => { fetchData() }, [fetchData])

  // Group + filter products by engine for cleaner radio list
  const groupedProducts = useMemo(() => {
    if (!data) return new Map<string, ProductOption[]>()
    const q = search.trim().toLowerCase()
    const filtered = q
      ? data.options.filter(o =>
          (o.engine ?? '').toLowerCase().includes(q) ||
          (o.reference ?? '').toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q),
        )
      : data.options
    const map = new Map<string, ProductOption[]>()
    for (const p of filtered) {
      const key = p.engine ?? '—'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    return map
  }, [data, search])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await apiClient.put<{ success: boolean; data: { product_id: number | null; product_name: string | null } }>(
        baseUrl,
        { product_id: selected === '' ? null : selected },
      )
      if (res.data.success && data) {
        setData({
          ...data,
          product_id: res.data.data.product_id,
          product_name: res.data.data.product_name,
        })
        setSuccessMsg(t.polluterProductSaved)
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
          {t.polluterProductTitle} — <span style={{ fontWeight: 400 }}>{polluterName}</span>
        </Typography>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            {t.polluterProductHelp}
          </Typography>

          {data?.product_name ? (
            <Typography variant='body2' sx={{ mb: 2 }}>
              {t.polluterProductCurrent}: <strong>{data.product_name}</strong>
            </Typography>
          ) : null}

          <TextField
            size='small'
            placeholder={t.polluterProductFilter}
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ mb: 2, maxWidth: 480 }}
            fullWidth
          />

          <FormControl component='fieldset' sx={{ display: 'block' }}>
            <RadioGroup
              value={selected === '' ? '' : String(selected)}
              onChange={e => setSelected(e.target.value === '' ? '' : Number(e.target.value))}
            >
              <FormControlLabel
                value=''
                control={<Radio size='small' />}
                label={t.polluterProductNone}
              />

              {Array.from(groupedProducts.entries()).map(([engine, products]) => (
                <Box key={engine} sx={{ mt: 2 }}>
                  <Typography variant='subtitle2' sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {t.polluterProductEngine}: {engine}
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {products.map(p => (
                      <FormControlLabel
                        key={p.id}
                        value={String(p.id)}
                        control={<Radio size='small' />}
                        label={
                          <Typography variant='body2'>
                            <strong>{p.reference ?? '—'}</strong> — {p.name}
                          </Typography>
                        }
                        sx={{ display: 'block' }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}

              {groupedProducts.size === 0 ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 2, fontStyle: 'italic' }}>
                  —
                </Typography>
              ) : null}
            </RadioGroup>
          </FormControl>

          <Box sx={{ mt: 3 }}>
            <Button variant='contained' onClick={handleSave} disabled={saving}>
              {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <i className='ri-save-line' style={{ marginRight: 6 }} />}
              {t.polluterProductSave}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}
