'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface CompanyItem {
  id: number
  name: string
  commercial: string
  type: string
  is_active: string
  email: string
  web: string
  phone: string
  fax: string
  mobile: string
  address1: string
  address2: string
  postcode: string
  city: string
  country: string
  gender: string
  firstname: string
  lastname: string
  function: string
  firstname1: string
  lastname1: string
  function1: string
  siret: string
  tva: string
  rcs: string
  rge: string
  ape: string
  capital: string
  comments: string
}

interface CompanyFormData {
  name: string
  commercial: string
  type: string
  is_active: string
  email: string
  web: string
  phone: string
  fax: string
  mobile: string
  address1: string
  address2: string
  postcode: string
  city: string
  country: string
  gender: string
  firstname: string
  lastname: string
  function: string
  firstname1: string
  lastname1: string
  function1: string
  siret: string
  tva: string
  rcs: string
  rge: string
  ape: string
  capital: string
  comments: string
}

const emptyForm: CompanyFormData = {
  name: '',
  commercial: '',
  type: '',
  is_active: 'YES',
  email: '',
  web: '',
  phone: '',
  fax: '',
  mobile: '',
  address1: '',
  address2: '',
  postcode: '',
  city: '',
  country: '',
  gender: '',
  firstname: '',
  lastname: '',
  function: '',
  firstname1: '',
  lastname1: '',
  function1: '',
  siret: '',
  tva: '',
  rcs: '',
  rge: '',
  ape: '',
  capital: '',
  comments: '',
}

const typeOptions = ['ISO', 'BOILER', 'PAC', 'ITE']
const genderOptions = ['Mr', 'Ms', 'Mrs']

// ─── Helpers ─────────────────────────────────────────────

const isYes = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  
return false
}

// ─── Component ───────────────────────────────────────────

export default function CompanyConfigCrud() {
  const t = useConfigTranslations()

  const [items, setItems] = useState<CompanyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<CompanyItem | null>(null)
  const [formData, setFormData] = useState<CompanyFormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CompanyItem | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const res = await apiClient.get<{ success: boolean; data: CompanyItem[] }>(
        '/admin/customerscontracts/config/companies',
      )

      if (res.data.success) setItems(res.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [t.settingsLoadError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Form field updater ─────────────────────────────────

  const updateField = (key: keyof CompanyFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  // ─── Dialog handlers ────────────────────────────────────

  const openCreateDialog = () => {
    setEditItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: CompanyItem) => {
    setEditItem(item)
    setFormData({
      name: item.name,
      commercial: item.commercial,
      type: item.type,
      is_active: item.is_active,
      email: item.email,
      web: item.web,
      phone: item.phone,
      fax: item.fax,
      mobile: item.mobile,
      address1: item.address1,
      address2: item.address2,
      postcode: item.postcode,
      city: item.city,
      country: item.country,
      gender: item.gender,
      firstname: item.firstname,
      lastname: item.lastname,
      function: item.function,
      firstname1: item.firstname1,
      lastname1: item.lastname1,
      function1: item.function1,
      siret: item.siret,
      tva: item.tva,
      rcs: item.rcs,
      rge: item.rge,
      ape: item.ape,
      capital: item.capital,
      comments: item.comments,
    })
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditItem(null)
    setFormData(emptyForm)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      if (editItem) {
        const res = await apiClient.put<{ success: boolean; data: CompanyItem }>(
          `/admin/customerscontracts/config/companies/${editItem.id}`,
          formData,
        )

        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: CompanyItem }>(
          '/admin/customerscontracts/config/companies',
          formData,
        )

        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.settingsSaved)
        }
      }

      closeDialog()
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  // ─── Toggle active ─────────────────────────────────────

  const handleToggleActive = async (item: CompanyItem) => {
    try {
      const res = await apiClient.patch<{ success: boolean; data: CompanyItem }>(
        `/admin/customerscontracts/config/companies/${item.id}/toggle-active`,
      )

      if (res.data.success) {
        setItems(prev => prev.map(i => (i.id === item.id ? res.data.data : i)))
        setSuccessMsg(t.settingsSaved)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    }
  }

  // ─── Delete handlers ───────────────────────────────────

  const openDeleteDialog = (item: CompanyItem) => {
    setDeleteTarget(item)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      await apiClient.delete(`/admin/customerscontracts/config/companies/${deleteTarget.id}`)
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
      setSuccessMsg(t.settingsSaved)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleteDialogOpen(false)
      setDeleteTarget(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────

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

      <Typography variant='h5' sx={{ mb: 3 }}>
        {t.companyTitle}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button variant='contained' onClick={openCreateDialog}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.companyAdd}
        </Button>
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.cancel}
        </Button>
      </Box>

      {/* ─── Table ──────────────────────────────────────────── */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>{t.companyName}</TableCell>
              <TableCell>{t.companyEmail}</TableCell>
              <TableCell>{t.companyPhone}</TableCell>
              <TableCell>{t.companyType}</TableCell>
              <TableCell>{t.companyActive}</TableCell>
              <TableCell align='right'>{t.companyActions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  {t.companyEmpty}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>
                    <Switch
                      size='small'
                      checked={isYes(item.is_active)}
                      onChange={() => handleToggleActive(item)}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton size='small' onClick={() => openEditDialog(item)}>
                      <i className='ri-pencil-line' />
                    </IconButton>
                    <IconButton size='small' color='error' onClick={() => openDeleteDialog(item)}>
                      <i className='ri-delete-bin-line' />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── Create / Edit Dialog ───────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth='md' fullWidth>
        <DialogTitle>{editItem ? t.companyEdit : t.companyCreate}</DialogTitle>
        <DialogContent>
          {/* ── General ───────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mt: 1, mb: 2 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionGeneral}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.companyName}
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.companyCommercial}
                    value={formData.commercial}
                    onChange={e => updateField('commercial', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label={t.companyType}
                    value={formData.type}
                    onChange={e => updateField('type', e.target.value)}
                  >
                    <MenuItem value=''>--</MenuItem>
                    {typeOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isYes(formData.is_active)}
                        onChange={e => updateField('is_active', e.target.checked ? 'YES' : 'NO')}
                      />
                    }
                    label={t.companyActive}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Contact ───────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionContact}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.companyEmail}
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t.companyWeb}
                    value={formData.web}
                    onChange={e => updateField('web', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyPhone}
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyFax}
                    value={formData.fax}
                    onChange={e => updateField('fax', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyMobile}
                    value={formData.mobile}
                    onChange={e => updateField('mobile', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Address ───────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionAddress}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.companyAddress1}
                    value={formData.address1}
                    onChange={e => updateField('address1', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t.companyAddress2}
                    value={formData.address2}
                    onChange={e => updateField('address2', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyPostcode}
                    value={formData.postcode}
                    onChange={e => updateField('postcode', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyCity}
                    value={formData.city}
                    onChange={e => updateField('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyCountry}
                    value={formData.country}
                    onChange={e => updateField('country', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Person 1 ──────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionPerson1}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label={t.companyGender}
                    value={formData.gender}
                    onChange={e => updateField('gender', e.target.value)}
                  >
                    <MenuItem value=''>--</MenuItem>
                    {genderOptions.map(opt => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label={t.companyFirstname}
                    value={formData.firstname}
                    onChange={e => updateField('firstname', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label={t.companyLastname}
                    value={formData.lastname}
                    onChange={e => updateField('lastname', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label={t.companyFunction}
                    value={formData.function}
                    onChange={e => updateField('function', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Person 2 ──────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionPerson2}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyFirstname1}
                    value={formData.firstname1}
                    onChange={e => updateField('firstname1', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyLastname1}
                    value={formData.lastname1}
                    onChange={e => updateField('lastname1', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyFunction1}
                    value={formData.function1}
                    onChange={e => updateField('function1', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* ── Business ──────────────────────────────────────── */}
          <Card variant='outlined' sx={{ mb: 1 }}>
            <CardContent>
              <Typography variant='subtitle1' fontWeight={600} sx={{ mb: 2 }}>
                {t.companySectionBusiness}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companySiret}
                    value={formData.siret}
                    onChange={e => updateField('siret', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyTva}
                    value={formData.tva}
                    onChange={e => updateField('tva', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyRcs}
                    value={formData.rcs}
                    onChange={e => updateField('rcs', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyRge}
                    value={formData.rge}
                    onChange={e => updateField('rge', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyApe}
                    value={formData.ape}
                    onChange={e => updateField('ape', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label={t.companyCapital}
                    value={formData.capital}
                    onChange={e => updateField('capital', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label={t.companyComments}
                    value={formData.comments}
                    onChange={e => updateField('comments', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t.cancel}</Button>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            {saving ? t.saving : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>{t.companyDeleteTitle}</DialogTitle>
        <DialogContent>
          <Typography>{t.companyDeleteConfirm}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>{t.cancel}</Button>
          <Button variant='contained' color='error' onClick={handleDelete}>
            {t.companyDeleteBtn}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
