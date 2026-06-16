'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

// ─── Types ───────────────────────────────────────────────

interface MeetingSettingsRaw {
  [key: string]: string | number | null | number[] | boolean
}

interface SelectOption {
  id: number
  name: string
}

interface SettingsOptions {
  meeting_statuses: SelectOption[]
  status_calls: SelectOption[]
  status_leads: SelectOption[]
  companies: SelectOption[]
  campaigns: SelectOption[]
}

// ─── Helpers ─────────────────────────────────────────────

const isYes = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  
return false
}

const SETTINGS_URL = '/admin/customersmeetings/settings'

// ─── Component ───────────────────────────────────────────

export default function MeetingSettings() {
  const t = useConfigTranslations()
  const [settings, setSettings] = useState<MeetingSettingsRaw | null>(null)

  const [options, setOptions] = useState<SettingsOptions>({
    meeting_statuses: [],
    status_calls: [],
    status_leads: [],
    companies: [],
    campaigns: [],
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [settingsRes, optionsRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: MeetingSettingsRaw }>(SETTINGS_URL),
        apiClient.get<{ success: boolean; data: SettingsOptions }>(`${SETTINGS_URL}/options`),
      ])

      if (settingsRes.data.success) setSettings(settingsRes.data.data)
      if (optionsRes.data.success) setOptions(optionsRes.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [t.settingsLoadError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)

    try {
      const res = await apiClient.put<{ success: boolean; data: MeetingSettingsRaw }>(
        SETTINGS_URL,
        settings,
      )

      if (res.data.success) {
        setSettings(res.data.data)
        setSuccessMsg(t.settingsSaved)
        setDirty(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }

  const update = (key: string, value: unknown) => {
    setSettings(prev => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }

  if (loading || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const statusOpts = [{ id: '', name: t.noneOption }, ...options.meeting_statuses] as { id: string | number; name: string }[]
  const statusCallOpts = [{ id: '', name: t.noneOption }, ...options.status_calls] as { id: string | number; name: string }[]
  const companyOpts = [{ id: '', name: t.noneOption }, ...options.companies] as { id: string | number; name: string }[]

  const updatedAtStateIds = Array.isArray(settings.updated_at_states)
    ? (settings.updated_at_states as number[]).map(Number)
    : []

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
        {t.meetingSettingsTitle}
      </Typography>

      {/* Save / Cancel */}
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

      {/* ─── Feature Toggles ─────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionFeatures}
          </Typography>
          <Grid container spacing={2}>
            {([
              ['has_assistant', t.meetingHasAssistant],
              ['has_callback', t.meetingHasCallback],
              ['has_callcenter', t.meetingHasCallcenter],
              ['has_campaign', t.meetingHasCampaign],
              ['has_type', t.meetingHasType],
              ['has_callstatus', t.meetingHasCallstatus],
              ['has_qualification', t.meetingHasQualification],
              ['has_lead_status', t.meetingHasLeadStatus],
              ['has_confirmed_at', t.meetingHasConfirmedAt],
              ['has_treated_date', t.meetingHasTreatedDate],
              ['has_lock_management', t.meetingHasLockManagement],
              ['has_registration', t.meetingHasRegistration],
              ['has_polluter', t.meetingHasPolluter],
              ['has_partner_layer', t.meetingHasPartnerLayer],
              ['comment_on_create', t.meetingCommentOnCreate],
              ['autocomplete_list', t.meetingAutocompleteList],
            ] as const).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isYes(settings[key])}
                      onChange={e => update(key, e.target.checked ? 'YES' : 'NO')}
                    />
                  }
                  label={label}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Status Transitions ──────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionStatusTransitions}
          </Typography>
          <Grid container spacing={2}>
            {([
              ['status_by_default_id', t.meetingStatusByDefault],
              ['status_transfer_to_contract_id', t.meetingStatusTransferToContract],
              ['confirm_status_id', t.meetingStatusConfirm],
              ['unconfirm_status_id', t.meetingStatusUnconfirm],
              ['cancel_status_id', t.meetingStatusCancel],
              ['uncancel_status_id', t.meetingStatusUncancel],
            ] as const).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  select fullWidth
                  label={label}
                  value={settings[key] ?? ''}
                  onChange={e => update(key, e.target.value || null)}
                >
                  {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                </TextField>
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.meetingStatusCallByDefault}
                value={settings.status_call_by_default_id ?? ''}
                onChange={e => update('status_call_by_default_id', e.target.value || null)}
              >
                {statusCallOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.meetingFilterScheduleDefaultStatusCall}
                value={settings.filter_schedule_default_status_call_id ?? ''}
                onChange={e => update('filter_schedule_default_status_call_id', e.target.value || null)}
              >
                {statusCallOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Assistant States ────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionAssistant}
          </Typography>
          <Grid container spacing={2}>
            {([
              ['assistant_state1_setting_id', t.meetingAssistantState1],
              ['assistant_state2_setting_id', t.meetingAssistantState2],
              ['assistant_state3_setting_id', t.meetingAssistantState3],
            ] as const).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  select fullWidth
                  label={label}
                  value={settings[key] ?? ''}
                  onChange={e => update(key, e.target.value || null)}
                >
                  {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
                </TextField>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Updated at States ───────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionUpdatedAtStates}
          </Typography>
          <Autocomplete
            multiple
            options={options.meeting_statuses}
            getOptionLabel={o => o.name}
            value={options.meeting_statuses.filter(s => updatedAtStateIds.includes(s.id))}
            onChange={(_, newValue) => update('updated_at_states', newValue.map(v => v.id))}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip label={option.name} size='small' {...getTagProps({ index })} key={option.id} />
              ))
            }
            renderInput={params => <TextField {...params} label={t.meetingUpdatedAtStates} />}
          />
        </CardContent>
      </Card>

      {/* ─── Duplicate Phone ─────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionDuplicatePhone}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isYes(settings.duplicate_phone_forbidden)}
                    onChange={e => update('duplicate_phone_forbidden', e.target.checked ? 'YES' : 'NO')}
                  />
                }
                label={t.meetingDuplicatePhoneForbidden}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isYes(settings.duplicate_phone_forbidden_confirmed)}
                    onChange={e => update('duplicate_phone_forbidden_confirmed', e.target.checked ? 'YES' : 'NO')}
                  />
                }
                label={t.meetingDuplicatePhoneConfirmedForbidden}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isYes(settings.mobile1_required)}
                    onChange={e => update('mobile1_required', e.target.checked)}
                  />
                }
                label={t.meetingMobile1Required}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Numeric Settings ────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionNumeric}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingMaxMultipleSms}
                value={settings.max_multiple_sms ?? 10}
                onChange={e => update('max_multiple_sms', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingMaxMultipleEmail}
                value={settings.max_multiple_email ?? 10}
                onChange={e => update('max_multiple_email', Number(e.target.value))}
                inputProps={{ min: 1, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingCallbackDelay}
                value={settings.callback_delay ?? 10}
                onChange={e => update('callback_delay', Number(e.target.value))}
                inputProps={{ min: 10, max: 180 }}
                helperText={t.meetingCallbackDelayHelp}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingLockTimeOut}
                value={settings.lock_time_out ?? 600}
                onChange={e => update('lock_time_out', Number(e.target.value))}
                inputProps={{ min: 60, max: 3600 }}
                helperText={t.meetingLockTimeOutHelp}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingFilterNumberOfItems}
                value={settings.filter_numberofitems_by_page ?? 100}
                onChange={e => update('filter_numberofitems_by_page', Number(e.target.value))}
                inputProps={{ min: 5, max: 500 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingInputScaleTime}
                value={settings.input_scale_time ?? 15}
                onChange={e => update('input_scale_time', Number(e.target.value))}
                inputProps={{ min: 5, max: 60 }}
                helperText={t.meetingInputScaleTimeHelp}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Schedule ────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionSchedule}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label={t.meetingScheduleStartTime}
                value={settings.schedule_start_time ?? '6:00'}
                onChange={e => update('schedule_start_time', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label={t.meetingScheduleEndTime}
                value={settings.schedule_end_time ?? '23:00'}
                onChange={e => update('schedule_end_time', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Registration ────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionRegistration}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label={t.meetingRegistrationNumberFormat}
                value={settings.registration_number_format ?? '00000000'}
                onChange={e => update('registration_number_format', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.meetingRegistrationNumberStart}
                value={settings.registration_number_start ?? 260}
                onChange={e => update('registration_number_start', Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Default Company ─────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.meetingSectionCompany}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.meetingDefaultCompany}
                value={settings.default_company_id ?? ''}
                onChange={e => update('default_company_id', e.target.value || null)}
              >
                {companyOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
