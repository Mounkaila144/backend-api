'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

import Snackbar from '@mui/material/Snackbar'

import { apiClient } from '@/shared/lib/api-client'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface FormField {
  id: number
  name: string
  label: string
  type: string
  widget: string
  default: string | null
  position: number
  choices: string[]
}

interface MeetingFormsData {
  form: { id: number; name: string } | null
  fields: FormField[]
  values: Record<string, string | number | boolean>
  is_hold: string
}

interface TabMeetingFormsProps {
  contractId: number | null
  t: ContractTranslations
}

/**
 * Dynamic meeting forms tab - "Informations"
 *
 * Reproduces Symfony's customers_meetings_forms_ajaxSaveFormsForContract.tpl:
 * - Renders all form fields dynamically based on widget type
 * - Widget types: input, text (textarea), select, boolean (checkbox), checkbox (radio group)
 * - Labels come from t_customers_meeting_formfield_i18n
 * - Choices for select/checkbox come from PHP-serialized parameters
 */
export default function TabMeetingForms({ contractId, t }: TabMeetingFormsProps) {
  const [data, setData] = useState<MeetingFormsData | null>(null)
  const [values, setValues] = useState<Record<string, string | number | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchForms = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)

      const response = await apiClient.get<{ success: boolean; data: MeetingFormsData }>(
        `/admin/customersmeetingsforms/contracts/${contractId}/forms`,
      )

      if (response.data.success) {
        setData(response.data.data)
        setValues(response.data.data.values as Record<string, string | number | boolean>)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchForms()
  }, [fetchForms])

  const handleChange = (fieldName: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }))
    setDirty(true)
  }

  const handleSave = async () => {
    if (!contractId) return

    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      await apiClient.put(`/admin/customersmeetingsforms/contracts/${contractId}/forms`, { values })
      setDirty(false)
      setSuccessMsg('Formulaire enregistré avec succès')
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (!data || !data.form || data.fields.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        Aucun formulaire configuré
      </Typography>
    )
  }

  return (
    <Box>
      {/* Error message */}
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {/* Success snackbar */}
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

      {dirty ? (
        <Box sx={{ mb: 2, textAlign: 'right' }}>
          <Button variant='contained' onClick={handleSave} disabled={saving} size='small'>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      ) : null}

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableBody>
            {data.fields.map((field) => {
              // Get saved value, or default, or empty
              let val = values[field.name] ?? field.default ?? ''

              // Symfony behavior: checkbox/select with choices default to index "0" (first choice)
              // when no value is saved. This is how mfValidatorChoice works.
              if ((val === '' || val === null) && field.choices.length > 0 && field.widget === 'checkbox') {
                val = '0'
              }

              return (
                <TableRow key={field.id}>
                  <TableCell sx={{ fontWeight: 500, width: '280px', verticalAlign: 'top', pt: 2 }}>
                    {field.label}
                  </TableCell>
                  <TableCell>
                    {renderField(field, val, handleChange)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {dirty ? (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}

function renderField(
  field: FormField,
  value: string | number | boolean,
  onChange: (name: string, value: string | number | boolean) => void,
) {
  const strVal = String(value ?? '')

  switch (field.widget) {
    // Textarea
    case 'text':
      return (
        <TextField
          multiline
          minRows={2}
          maxRows={6}
          fullWidth
          size='small'
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )

    // Boolean checkbox (single yes/no)
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={strVal === '1' || strVal === 'YES' || strVal === 'true'}
              onChange={(e) => onChange(field.name, e.target.checked ? '1' : '0')}
            />
          }
          label=''
        />
      )

    // Select dropdown - values stored as indices (0, 1, 2...) matching choices array positions
    case 'select':
      if (field.choices.length > 0) {
        return (
          <TextField
            select
            fullWidth
            size='small'
            value={strVal}
            onChange={(e) => onChange(field.name, e.target.value)}
          >
            <MenuItem value=''>—</MenuItem>
            {field.choices.map((choice, idx) => (
              <MenuItem key={idx} value={String(idx)}>{choice || '—'}</MenuItem>
            ))}
          </TextField>
        )
      }

      return (
        <TextField
          select
          fullWidth
          size='small'
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <MenuItem value=''>—</MenuItem>
          <MenuItem value='YES'>Oui</MenuItem>
          <MenuItem value='NO'>Non</MenuItem>
        </TextField>
      )

    // Checkbox group (displayed as radio buttons like Symfony)
    // Values stored as indices (0, 1, 2...) matching choices array positions
    case 'checkbox':
      if (field.choices.length > 0) {
        return (
          <RadioGroup
            row
            value={strVal}
            onChange={(e) => onChange(field.name, e.target.value)}
          >
            {field.choices.map((choice, idx) => (
              <FormControlLabel
                key={idx}
                value={String(idx)}
                control={<Radio size='small' />}
                label={choice}
              />
            ))}
          </RadioGroup>
        )
      }

      return (
        <RadioGroup
          row
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
        >
          <FormControlLabel value='Oui' control={<Radio size='small' />} label='Oui' />
          <FormControlLabel value='Non' control={<Radio size='small' />} label='Non' />
        </RadioGroup>
      )

    // Input (default)
    case 'input':
    default:
      return (
        <TextField
          fullWidth
          size='small'
          value={strVal}
          onChange={(e) => onChange(field.name, e.target.value)}
          type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
        />
      )
  }
}
