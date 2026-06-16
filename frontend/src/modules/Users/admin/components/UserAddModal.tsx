'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// Translation Imports
import { useTranslation } from '@/shared/i18n'

// Service Imports
import { userService } from '../services/userService'

// Type Imports
import type {
  UserCreationOptions,
  CreateUserPayload,
  PermissionGroup
} from '../../types/user.types'

// Tenant Imports
import { useTenant } from '@/shared/lib/tenant-context'

interface UserAddModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const UserAddModal = ({ open, onClose, onSuccess }: UserAddModalProps) => {
  const { t } = useTranslation('Users')
  const { tenantId } = useTenant()

  // Loading states
  const [loading, setLoading] = useState(false)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Options from API
  const [options, setOptions] = useState<UserCreationOptions | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateUserPayload>({
    username: '',
    password: '',
    email: '',
    firstname: '',
    lastname: '',
    sex: undefined,
    phone: '',
    mobile: '',
    birthday: '',
    is_active: 'YES',
    application: 'admin',
    callcenter_id: undefined,
    team_id: undefined,
    company_id: undefined,
    group_ids: [],
    function_ids: [],
    profile_ids: [],
    team_ids: [],
    attribution_ids: [],
    permission_ids: []
  })

  // Selected permissions (for UI display)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())

  // Load creation options when modal opens
  useEffect(() => {
    if (open) {
      loadCreationOptions()
    }
  }, [open])

  const loadCreationOptions = async () => {
    try {
      setOptionsLoading(true)
      setError(null)
      const data = await userService.getCreationOptions(tenantId)

      setOptions(data)
    } catch (err) {
      console.error('Error loading creation options:', err)
      setError('Failed to load options')
    } finally {
      setOptionsLoading(false)
    }
  }

  // Handle form field changes
  const handleFieldChange = (field: keyof CreateUserPayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle group selection (with auto-select permissions)
  const handleGroupToggle = (groupId: number) => {
    const group = options?.groups.find(g => g.id === groupId)

    if (!group) return

    const isCurrentlySelected = formData.group_ids?.includes(groupId)

    if (isCurrentlySelected) {
      // Deselect group and its permissions
      setFormData(prev => ({
        ...prev,
        group_ids: prev.group_ids?.filter(id => id !== groupId) || []
      }))

      // Remove group's permissions from selected permissions
      const newSelectedPermissions = new Set(selectedPermissions)

      group.permission_ids.forEach(permId => {
        newSelectedPermissions.delete(permId)
      })
      setSelectedPermissions(newSelectedPermissions)
    } else {
      // Select group and its permissions
      setFormData(prev => ({
        ...prev,
        group_ids: [...(prev.group_ids || []), groupId]
      }))

      // Add group's permissions to selected permissions
      const newSelectedPermissions = new Set(selectedPermissions)

      group.permission_ids.forEach(permId => {
        newSelectedPermissions.add(permId)
      })
      setSelectedPermissions(newSelectedPermissions)
    }
  }

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: number) => {
    const newSelectedPermissions = new Set(selectedPermissions)

    if (newSelectedPermissions.has(permissionId)) {
      newSelectedPermissions.delete(permissionId)
    } else {
      newSelectedPermissions.add(permissionId)
    }

    setSelectedPermissions(newSelectedPermissions)
  }

  // Handle permission group toggle (select/deselect all permissions in a group)
  const handlePermissionGroupToggle = (permissionGroup: PermissionGroup) => {
    const allSelected = permissionGroup.permissions.every(perm => selectedPermissions.has(perm.id))

    const newSelectedPermissions = new Set(selectedPermissions)

    if (allSelected) {
      // Deselect all
      permissionGroup.permissions.forEach(perm => {
        newSelectedPermissions.delete(perm.id)
      })
    } else {
      // Select all
      permissionGroup.permissions.forEach(perm => {
        newSelectedPermissions.add(perm.id)
      })
    }

    setSelectedPermissions(newSelectedPermissions)
  }

  // Handle array field toggle (functions, profiles, teams, attributions)
  const handleArrayFieldToggle = (field: keyof CreateUserPayload, id: number) => {
    const currentArray = (formData[field] as number[]) || []
    const isSelected = currentArray.includes(id)

    if (isSelected) {
      handleFieldChange(
        field,
        currentArray.filter(item => item !== id)
      )
    } else {
      handleFieldChange(field, [...currentArray, id])
    }
  }

  // Handle form submit
  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      // Prepare payload with selected permissions
      const rawPayload: CreateUserPayload = {
        ...formData,
        permission_ids: Array.from(selectedPermissions)
      }

      // Clean payload: remove empty strings and undefined values, keep only filled fields
      const payload: any = {
        username: rawPayload.username,
        password: rawPayload.password,
        email: rawPayload.email,
        application: rawPayload.application,
        is_active: rawPayload.is_active
      }

      // Add optional string fields only if they have values
      if (rawPayload.firstname && rawPayload.firstname.trim() !== '') {
        payload.firstname = rawPayload.firstname.trim()
      }

      if (rawPayload.lastname && rawPayload.lastname.trim() !== '') {
        payload.lastname = rawPayload.lastname.trim()
      }

      if (rawPayload.sex && rawPayload.sex !== '') {
        payload.sex = rawPayload.sex
      }

      if (rawPayload.phone && rawPayload.phone.trim() !== '') {
        payload.phone = rawPayload.phone.trim()
      }

      if (rawPayload.mobile && rawPayload.mobile.trim() !== '') {
        payload.mobile = rawPayload.mobile.trim()
      }

      if (rawPayload.birthday && rawPayload.birthday !== '') {
        payload.birthday = rawPayload.birthday
      }

      // Add optional ID fields only if they have values
      if (rawPayload.callcenter_id) {
        payload.callcenter_id = rawPayload.callcenter_id
      }

      if (rawPayload.team_id) {
        payload.team_id = rawPayload.team_id
      }

      if (rawPayload.company_id) {
        payload.company_id = rawPayload.company_id
      }

      // Add array fields only if they have values
      if (rawPayload.group_ids && rawPayload.group_ids.length > 0) {
        payload.group_ids = rawPayload.group_ids
      }

      if (rawPayload.function_ids && rawPayload.function_ids.length > 0) {
        payload.function_ids = rawPayload.function_ids
      }

      if (rawPayload.profile_ids && rawPayload.profile_ids.length > 0) {
        payload.profile_ids = rawPayload.profile_ids
      }

      if (rawPayload.team_ids && rawPayload.team_ids.length > 0) {
        payload.team_ids = rawPayload.team_ids
      }

      if (rawPayload.attribution_ids && rawPayload.attribution_ids.length > 0) {
        payload.attribution_ids = rawPayload.attribution_ids
      }

      if (rawPayload.permission_ids && rawPayload.permission_ids.length > 0) {
        payload.permission_ids = rawPayload.permission_ids
      }

      // Create user
      await userService.createUser(payload, tenantId)

      // Success
      onSuccess()
      handleClose()
    } catch (err: any) {
      console.error('Error creating user:', err)
      setError(err?.response?.data?.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  // Handle close
  const handleClose = () => {
    // Reset form
    setFormData({
      username: '',
      password: '',
      email: '',
      firstname: '',
      lastname: '',
      sex: undefined,
      phone: '',
      mobile: '',
      birthday: '',
      is_active: 'YES',
      application: 'admin',
      callcenter_id: undefined,
      team_id: undefined,
      company_id: undefined,
      group_ids: [],
      function_ids: [],
      profile_ids: [],
      team_ids: [],
      attribution_ids: [],
      permission_ids: []
    })
    setSelectedPermissions(new Set())
    setError(null)
    onClose()
  }

  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.username.trim() !== '' &&
      formData.password.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.application !== ''
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <div>
          <Typography variant='h5'>{t('Add New User')}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {t('Fill in the information to create a new user')}
          </Typography>
        </div>
        <IconButton onClick={handleClose} size='small'>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {optionsLoading ? (
          <Box className='flex justify-center items-center py-8'>
            <CircularProgress />
          </Box>
        ) : (
          <div className='space-y-4'>
            {error && (
              <Alert severity='error' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Basic Information */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>{t('Basic Information')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      label={t('Username')}
                      value={formData.username}
                      onChange={e => handleFieldChange('username', e.target.value)}
                      inputProps={{ maxLength: 16 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type='password'
                      label={t('Password')}
                      value={formData.password}
                      onChange={e => handleFieldChange('password', e.target.value)}
                      inputProps={{ minLength: 6, maxLength: 32 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      required
                      type='email'
                      label={t('Email')}
                      value={formData.email}
                      onChange={e => handleFieldChange('email', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('Application')}</InputLabel>
                      <Select
                        value={formData.application}
                        label={t('Application')}
                        onChange={e => handleFieldChange('application', e.target.value)}
                      >
                        <MenuItem value='admin'>Admin</MenuItem>
                        <MenuItem value='frontend'>Frontend</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>{t('Status')}</InputLabel>
                      <Select
                        value={formData.is_active}
                        label={t('Status')}
                        onChange={e => handleFieldChange('is_active', e.target.value)}
                      >
                        <MenuItem value='YES'>{t('Active')}</MenuItem>
                        <MenuItem value='NO'>{t('Inactive')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Personal Information */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>{t('Personal Information')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Firstname')}
                      value={formData.firstname}
                      onChange={e => handleFieldChange('firstname', e.target.value)}
                      inputProps={{ maxLength: 16 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Lastname')}
                      value={formData.lastname}
                      onChange={e => handleFieldChange('lastname', e.target.value)}
                      inputProps={{ maxLength: 32 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>{t('Gender')}</InputLabel>
                      <Select
                        value={formData.sex || ''}
                        label={t('Gender')}
                        onChange={e => handleFieldChange('sex', e.target.value || undefined)}
                      >
                        <MenuItem value=''>
                          <em>{t('None')}</em>
                        </MenuItem>
                        <MenuItem value='Mr'>{t('Mr')}</MenuItem>
                        <MenuItem value='Ms'>{t('Ms')}</MenuItem>
                        <MenuItem value='Mrs'>{t('Mrs')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      type='date'
                      label={t('Birthday')}
                      value={formData.birthday}
                      onChange={e => handleFieldChange('birthday', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Phone')}
                      value={formData.phone}
                      onChange={e => handleFieldChange('phone', e.target.value)}
                      inputProps={{ maxLength: 20 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t('Mobile')}
                      value={formData.mobile}
                      onChange={e => handleFieldChange('mobile', e.target.value)}
                      inputProps={{ maxLength: 20 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Assignments */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>{t('Assignments')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>{t('Call Center')}</InputLabel>
                      <Select
                        value={formData.callcenter_id || ''}
                        label={t('Call Center')}
                        onChange={e => handleFieldChange('callcenter_id', e.target.value || undefined)}
                      >
                        <MenuItem value=''>
                          <em>{t('None')}</em>
                        </MenuItem>
                        {options?.callcenters.map(cc => (
                          <MenuItem key={cc.id} value={cc.id}>
                            {cc.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>{t('Main Team')}</InputLabel>
                      <Select
                        value={formData.team_id || ''}
                        label={t('Main Team')}
                        onChange={e => handleFieldChange('team_id', e.target.value || undefined)}
                      >
                        <MenuItem value=''>
                          <em>{t('None')}</em>
                        </MenuItem>
                        {options?.teams.map(team => (
                          <MenuItem key={team.id} value={team.id}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Groups */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Groups')} ({formData.group_ids?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='space-y-2'>
                  <Typography variant='body2' color='text.secondary'>
                    {t('Selecting a group will automatically select all its permissions')}
                  </Typography>
                  <div className='grid grid-cols-1 gap-2'>
                    {options?.groups.map(group => (
                      <div
                        key={group.id}
                        className='flex items-center justify-between gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50'
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.group_ids?.includes(group.id) || false}
                              onChange={() => handleGroupToggle(group.id)}
                            />
                          }
                          label={group.name}
                        />
                        <Chip
                          label={`${group.permissions_count} ${t('permissions')}`}
                          size='small'
                          color='info'
                          variant='tonal'
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Functions */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Functions')} ({formData.function_ids?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {options?.functions.map(func => (
                    <FormControlLabel
                      key={func.id}
                      control={
                        <Checkbox
                          checked={formData.function_ids?.includes(func.id) || false}
                          onChange={() => handleArrayFieldToggle('function_ids', func.id)}
                        />
                      }
                      label={func.name}
                    />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Profiles */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Profiles')} ({formData.profile_ids?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {options?.profiles.map(profile => (
                    <FormControlLabel
                      key={profile.id}
                      control={
                        <Checkbox
                          checked={formData.profile_ids?.includes(profile.id) || false}
                          onChange={() => handleArrayFieldToggle('profile_ids', profile.id)}
                        />
                      }
                      label={profile.name}
                    />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Teams (Many-to-Many) */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Teams')} ({formData.team_ids?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {options?.teams.map(team => (
                    <FormControlLabel
                      key={team.id}
                      control={
                        <Checkbox
                          checked={formData.team_ids?.includes(team.id) || false}
                          onChange={() => handleArrayFieldToggle('team_ids', team.id)}
                        />
                      }
                      label={team.name}
                    />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Attributions */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Attributions')} ({formData.attribution_ids?.length || 0})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                  {options?.attributions.map(attr => (
                    <FormControlLabel
                      key={attr.id}
                      control={
                        <Checkbox
                          checked={formData.attribution_ids?.includes(attr.id) || false}
                          onChange={() => handleArrayFieldToggle('attribution_ids', attr.id)}
                        />
                      }
                      label={attr.name}
                    />
                  ))}
                </div>
              </AccordionDetails>
            </Accordion>

            {/* Permissions */}
            <Accordion>
              <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
                <Typography variant='h6'>
                  {t('Permissions')} ({selectedPermissions.size})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <div className='space-y-4'>
                  <Typography variant='body2' color='text.secondary'>
                    {t('Additional permissions beyond those from groups')}
                  </Typography>
                  {options?.permission_groups.map(permGroup => {
                    const allSelected = permGroup.permissions.every(perm => selectedPermissions.has(perm.id))
                    const someSelected = permGroup.permissions.some(perm => selectedPermissions.has(perm.id))

                    return (
                      <div key={permGroup.id} className='space-y-2'>
                        <div className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={allSelected}
                                indeterminate={!allSelected && someSelected}
                                onChange={() => handlePermissionGroupToggle(permGroup)}
                              />
                            }
                            label={<Typography variant='subtitle2'>{permGroup.name}</Typography>}
                          />
                          <Chip
                            label={`${permGroup.permissions.filter(p => selectedPermissions.has(p.id)).length}/${
                              permGroup.permissions.length
                            }`}
                            size='small'
                            variant='outlined'
                          />
                        </div>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6'>
                          {permGroup.permissions.map(perm => (
                            <FormControlLabel
                              key={perm.id}
                              control={
                                <Checkbox
                                  size='small'
                                  checked={selectedPermissions.has(perm.id)}
                                  onChange={() => handlePermissionToggle(perm.id)}
                                />
                              }
                              label={<Typography variant='body2'>{perm.name}</Typography>}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </AccordionDetails>
            </Accordion>
          </div>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={handleClose} variant='outlined' color='secondary' disabled={loading}>
          {t('Cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant='contained'
          color='primary'
          disabled={loading || !isFormValid() || optionsLoading}
          startIcon={loading ? <CircularProgress size={20} color='inherit' /> : <i className='ri-user-add-line' />}
        >
          {loading ? t('Creating...') : t('Create User')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserAddModal
