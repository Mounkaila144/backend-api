'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Grid from '@mui/material/Grid'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Button from '@mui/material/Button'

import { apiClient } from '@/shared/lib/api-client'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabInformationsProps {
  meetingId: number | null
  t: MeetingTranslations
}

interface FormField {
  id: number
  name: string
  label: string
  type: string
  widget: string | null
  default: string | null
  position: number
  choices: string[]
}

interface FormData {
  form: { id: number; name: string } | null
  fields: FormField[]
  values: Record<string, string | null>
}

/**
 * Informations tab - dynamic forms for meetings.
 * Mirrors Symfony: customers_meetings_forms_ajaxSaveForms.tpl
 * Fields are editable and can be saved back to the API.
 */
export default function TabInformations({ meetingId, t }: TabInformationsProps) {
  const [formData, setFormData] = useState<FormData | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const tR = t as Record<string, string>

  const loadForms = useCallback(async () => {
    if (!meetingId) return
    setLoading(true)
    setError(null)

    try {
      const res = await apiClient.get<{ success: boolean; data: FormData }>(
        `/admin/customersmeetingsforms/meetings/${meetingId}/forms`,
      )

      if (res.data.success) {
        setFormData(res.data.data)

        // Initialize values from API response
        const initialValues: Record<string, string> = {}

        if (res.data.data.fields) {
          for (const field of res.data.data.fields) {
            const val = res.data.data.values[field.name]

            initialValues[field.name] = val ?? field.default ?? ''
          }
        }

        setValues(initialValues)
      }
    } catch {
      setError(tR.tabInfoLoadError ?? 'Erreur lors du chargement des informations')
    } finally {
      setLoading(false)
    }
  }, [meetingId, tR.tabInfoLoadError])

  useEffect(() => {
    loadForms()
  }, [loadForms])

  const updateValue = (fieldName: string, newValue: string) => {
    setValues(prev => ({ ...prev, [fieldName]: newValue }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!meetingId || !formData?.form) return
    setSaving(true)
    setError(null)

    try {
      // Build nested structure: { formName: { fieldName: value } }
      const payload: Record<string, Record<string, string>> = {}

      payload[formData.form.name] = { ...values }

      await apiClient.put(
        `/admin/customersmeetingsforms/meetings/${meetingId}/forms`,
        { values: payload },
      )

      setSuccessMsg(tR.tabInfoSaved ?? 'Informations enregistrées')
      setDirty(false)
    } catch {
      setError(tR.tabInfoSaveError ?? 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (!formData?.form || formData.fields.length === 0) {
    return (
      <Alert severity='info'>
        {tR.tabNoForms ?? 'Aucun formulaire configuré.'}
      </Alert>
    )
  }

  return (
    <Box>
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='h6'>{tR.tabInfoTitle ?? 'Informations'}</Typography>
        {dirty ? (
          <Button variant='contained' onClick={handleSave} disabled={saving} size='small'>
            <i className='ri-save-line' style={{ marginRight: 6 }} />
            {saving ? (tR.tabSaving ?? 'Enregistrement...') : (tR.tabSave ?? 'Enregistrer')}
          </Button>
        ) : null}
      </Box>

      <Paper variant='outlined' sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {formData.fields.map(field => {
            const value = values[field.name] ?? ''

            if (field.widget === 'checkbox' || field.type === 'boolean') {
              return (
                <Grid item xs={12} sm={6} md={4} key={field.id}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={value === 'YES' || value === '1' || value === 'true'}
                        onChange={e => updateValue(field.name, e.target.checked ? 'YES' : 'NO')}
                      />
                    }
                    label={field.label}
                  />
                </Grid>
              )
            }

            if (field.choices.length > 0) {
              return (
                <Grid item xs={12} sm={6} md={4} key={field.id}>
                  <TextField
                    select
                    fullWidth
                    label={field.label}
                    value={value}
                    onChange={e => updateValue(field.name, e.target.value)}
                    size='small'
                  >
                    <MenuItem value=''>&nbsp;</MenuItem>
                    {field.choices.map((choice, idx) => (
                      <MenuItem key={idx} value={String(idx)}>{choice}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )
            }

            if (field.widget === 'textarea' || field.widget === 'text') {
              return (
                <Grid item xs={12} key={field.id}>
                  <TextField
                    fullWidth
                    label={field.label}
                    value={value}
                    onChange={e => updateValue(field.name, e.target.value)}
                    multiline
                    rows={3}
                    size='small'
                  />
                </Grid>
              )
            }

            return (
              <Grid item xs={12} sm={6} md={4} key={field.id}>
                <TextField
                  fullWidth
                  label={field.label}
                  value={value}
                  onChange={e => updateValue(field.name, e.target.value)}
                  size='small'
                  type={field.type === 'integer' ? 'number' : 'text'}
                />
              </Grid>
            )
          })}
        </Grid>
      </Paper>

      {dirty ? (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            <i className='ri-save-line' style={{ marginRight: 6 }} />
            {saving ? (tR.tabSaving ?? 'Enregistrement...') : (tR.tabSave ?? 'Enregistrer')}
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}
