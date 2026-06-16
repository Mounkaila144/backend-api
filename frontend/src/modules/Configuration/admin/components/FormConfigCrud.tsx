'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '../hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface FormTemplate {
  id: number
  name: string
  value: string
  position: number
  is_active: string
}

interface FormField {
  id?: number
  name: string
  label: string
  type: string
  widget: string | null
  default: string | null
  position: number
  is_visible: string
  is_exportable: string
  choices: string[]
}

const FIELD_TYPES = ['string', 'integer', 'text', 'choice', 'boolean']
const BASE_URL = '/admin/customersmeetingsforms/config/forms'

// ─── Component ───────────────────────────────────────────

export default function FormConfigCrud() {
  const t = useConfigTranslations()
  const tR = t as Record<string, string>

  const [forms, setForms] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form create/edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formValue, setFormValue] = useState('')
  const [saving, setSaving] = useState(false)

  // Fields editor
  const [fieldsFormId, setFieldsFormId] = useState<number | null>(null)
  const [fieldsFormName, setFieldsFormName] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [fieldsLoading, setFieldsLoading] = useState(false)
  const [fieldsDirty, setFieldsDirty] = useState(false)

  // ─── Load forms ─────────────────────────────────────────

  const loadForms = useCallback(async () => {
    setLoading(true)

    try {
      const res = await apiClient.get<{ success: boolean; data: FormTemplate[] }>(BASE_URL)

      if (res.data.success) setForms(res.data.data)
    } catch {
      setError('Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadForms()
  }, [loadForms])

  // ─── Form CRUD ──────────────────────────────────────────

  const openCreate = () => {
    setEditId(null)
    setFormName('')
    setFormValue('')
    setDialogOpen(true)
  }

  const openEdit = (form: FormTemplate) => {
    setEditId(form.id)
    setFormName(form.name)
    setFormValue(form.value)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)

    try {
      if (editId) {
        await apiClient.put(`${BASE_URL}/${editId}`, { name: formName, value: formValue })
      } else {
        await apiClient.post(BASE_URL, { name: formName, value: formValue })
      }

      setDialogOpen(false)
      setSuccessMsg(editId ? 'Formulaire modifié' : 'Formulaire créé')
      await loadForms()
    } catch {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce formulaire et tous ses champs ?')) return

    try {
      await apiClient.delete(`${BASE_URL}/${id}`)
      setSuccessMsg('Formulaire supprimé')
      if (fieldsFormId === id) setFieldsFormId(null)
      await loadForms()
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  // ─── Fields editor ──────────────────────────────────────

  const openFields = async (form: FormTemplate) => {
    setFieldsFormId(form.id)
    setFieldsFormName(form.name)
    setFieldsLoading(true)
    setFieldsDirty(false)

    try {
      const res = await apiClient.get<{ success: boolean; data: FormField[] }>(`${BASE_URL}/${form.id}/fields`)

      if (res.data.success) setFields(res.data.data)
    } catch {
      setError('Erreur lors du chargement des champs')
    } finally {
      setFieldsLoading(false)
    }
  }

  const addField = () => {
    setFields(prev => [
      ...prev,
      {
        name: '',
        label: '',
        type: 'string',
        widget: null,
        default: null,
        position: prev.length,
        is_visible: 'YES',
        is_exportable: 'NO',
        choices: [],
      },
    ])
    setFieldsDirty(true)
  }

  const updateField = (index: number, key: keyof FormField, value: unknown) => {
    setFields(prev => {
      const updated = [...prev]

      updated[index] = { ...updated[index], [key]: value }

      return updated
    })
    setFieldsDirty(true)
  }

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index))
    setFieldsDirty(true)
  }

  const saveFields = async () => {
    if (!fieldsFormId) return
    setSaving(true)

    try {
      await apiClient.put(`${BASE_URL}/${fieldsFormId}/fields`, { fields })
      setSuccessMsg('Champs enregistrés')
      setFieldsDirty(false)
    } catch {
      setError('Erreur lors de la sauvegarde des champs')
    } finally {
      setSaving(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  // If fields editor is open, show it
  if (fieldsFormId !== null) {
    return (
      <Box>
        {error ? <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}
        <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
        </Snackbar>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button variant='outlined' size='small' onClick={() => setFieldsFormId(null)}>
              <i className='ri-arrow-left-line' style={{ marginRight: 4 }} />
              {tR.statusCrudBack ?? 'Retour'}
            </Button>
            <Typography variant='h5'>
              Champs : {fieldsFormName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant='outlined' onClick={addField} size='small'>
              <i className='ri-add-line' style={{ marginRight: 4 }} />
              Ajouter un champ
            </Button>
            {fieldsDirty ? (
              <Button variant='contained' onClick={saveFields} disabled={saving} size='small'>
                <i className='ri-save-line' style={{ marginRight: 4 }} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            ) : null}
          </Box>
        </Box>

        {fieldsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : fields.length === 0 ? (
          <Alert severity='info'>Aucun champ. Cliquez sur &quot;Ajouter un champ&quot; pour commencer.</Alert>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id ?? `new-${index}`} variant='outlined' sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant='subtitle2' color='text.secondary'>
                    Champ #{index + 1} - {field.type}
                  </Typography>
                  <IconButton size='small' color='error' onClick={() => removeField(index)} title='Supprimer'>
                    <i className='ri-delete-bin-line' style={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                <Grid container spacing={2}>
                  {/* Type selector */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select fullWidth size='small'
                      label='Type'
                      value={field.type}
                      onChange={e => updateField(index, 'type', e.target.value)}
                    >
                      {FIELD_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </TextField>
                  </Grid>

                  {/* Name (identifier) */}
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth size='small'
                      label='Nom (identifiant)'
                      value={field.name}
                      onChange={e => updateField(index, 'name', e.target.value)}
                    />
                  </Grid>

                  {/* Label (i18n) */}
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth size='small'
                      label='Libellé'
                      value={field.label}
                      onChange={e => updateField(index, 'label', e.target.value)}
                    />
                  </Grid>

                  {/* Default value */}
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth size='small'
                      label='Valeur par défaut'
                      value={field.default ?? ''}
                      onChange={e => updateField(index, 'default', e.target.value)}
                    />
                  </Grid>

                  {/* Visibility & exportable */}
                  <Grid item xs={6} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.is_visible === 'YES'}
                          onChange={e => updateField(index, 'is_visible', e.target.checked ? 'YES' : 'NO')}
                          size='small'
                        />
                      }
                      label='Visible'
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.is_exportable === 'YES'}
                          onChange={e => updateField(index, 'is_exportable', e.target.checked ? 'YES' : 'NO')}
                          size='small'
                        />
                      }
                      label='Exportable'
                    />
                  </Grid>

                  {/* Choice-specific: widget + choices */}
                  {field.type === 'choice' ? (
                    <>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          select fullWidth size='small'
                          label='Widget'
                          value={field.widget ?? 'select'}
                          onChange={e => updateField(index, 'widget', e.target.value)}
                        >
                          <MenuItem value='select'>select</MenuItem>
                          <MenuItem value='checkbox'>checkbox</MenuItem>
                        </TextField>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth size='small'
                          label='Choix (séparés par |)'
                          value={(field.choices ?? []).join('|')}
                          onChange={e => updateField(index, 'choices', e.target.value.split('|'))}
                          helperText='Ex: Oui|Non|Peut-être'
                        />
                      </Grid>
                    </>
                  ) : null}
                </Grid>
              </CardContent>
            </Card>
          ))
        )}

        {fields.length > 0 && fieldsDirty ? (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant='contained' onClick={saveFields} disabled={saving}>
              <i className='ri-save-line' style={{ marginRight: 6 }} />
              {saving ? 'Enregistrement...' : 'Enregistrer les champs'}
            </Button>
          </Box>
        ) : null}
      </Box>
    )
  }

  // ─── Forms list ─────────────────────────────────────────

  return (
    <Box>
      {error ? <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h5'>
          {tR.formConfigTitle ?? 'Formulaires dynamiques'}
        </Typography>
        <Button variant='contained' onClick={openCreate} size='small'>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {tR.formAdd ?? 'Ajouter'}
        </Button>
      </Box>

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.formName ?? 'Nom'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.formValue ?? 'Valeur (i18n)'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.formActive ?? 'Actif'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {forms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                  {tR.formEmpty ?? 'Aucun formulaire'}
                </TableCell>
              </TableRow>
            ) : (
              forms.map((form, index) => (
                <TableRow key={form.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{form.id}</TableCell>
                  <TableCell>{form.name}</TableCell>
                  <TableCell>{form.value || '---'}</TableCell>
                  <TableCell>
                    <Chip
                      label={form.is_active === 'Y' ? 'Oui' : 'Non'}
                      color={form.is_active === 'Y' ? 'success' : 'default'}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size='small' onClick={() => openEdit(form)} title='Modifier'>
                      <i className='ri-edit-line' style={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size='small' onClick={() => openFields(form)} title='Gérer les champs' color='primary'>
                      <i className='ri-list-settings-line' style={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size='small' onClick={() => handleDelete(form.id)} title='Supprimer' color='error'>
                      <i className='ri-delete-bin-line' style={{ fontSize: 16 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editId ? (tR.formEdit ?? 'Modifier le formulaire') : (tR.formCreate ?? 'Nouveau formulaire')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus fullWidth
            label={tR.formName ?? 'Nom (identifiant)'}
            value={formName}
            onChange={e => setFormName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label={tR.formValue ?? 'Libellé (i18n)'}
            value={formValue}
            onChange={e => setFormValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving || !formName.trim()}>
            {saving ? <CircularProgress size={20} /> : t.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
