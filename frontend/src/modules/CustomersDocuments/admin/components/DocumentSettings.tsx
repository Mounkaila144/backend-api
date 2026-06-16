'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

interface DocumentSettingsData {
  max_files_by_archive: number
}

export default function DocumentSettings() {
  const t = useConfigTranslations()
  const [settings, setSettings] = useState<DocumentSettingsData>({ max_files_by_archive: 20 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)

      const response = await apiClient.get<{ success: boolean; data: DocumentSettingsData }>(
        '/admin/customersdocuments/settings',
      )

      if (response.data.success) {
        setSettings(response.data.data)
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      await apiClient.put('/admin/customersdocuments/settings', { settings })
      setSuccessMsg(t.settingsSaved)
      setDirty(false)
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
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>
          {successMsg}
        </Alert>
      </Snackbar>

      <Typography variant='h5' sx={{ mb: 3 }}>{t.documentSettingsTitle}</Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {dirty ? (
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            <i className='ri-save-line' style={{ marginRight: 6 }} />
            {saving ? t.saving : t.save}
          </Button>
        ) : null}
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-close-line' style={{ marginRight: 6 }} />
          {t.cancel}
        </Button>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>{t.sectionLimits}</Typography>
          <TextField
            label={t.maxFilesByArchive}
            type='number'
            value={settings.max_files_by_archive}
            onChange={(e) => {
              setSettings((prev) => ({ ...prev, max_files_by_archive: Number(e.target.value) }))
              setDirty(true)
            }}
            helperText={t.maxFilesByArchiveHelp}
            sx={{ width: 300 }}
          />
        </CardContent>
      </Card>
    </Box>
  )
}
