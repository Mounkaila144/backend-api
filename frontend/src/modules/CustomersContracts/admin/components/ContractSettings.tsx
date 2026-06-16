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

interface ContractSettingsRaw {
  [key: string]: string | number | null | number[]
}

interface SelectOption {
  id: number
  name: string
}

interface SettingsOptions {
  contract_statuses: SelectOption[]
  attributions: SelectOption[]
  companies: SelectOption[]
}

// ─── Helpers ─────────────────────────────────────────────

const isYes = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  
return false
}

// ─── Component ───────────────────────────────────────────

export default function ContractSettings() {
  const t = useConfigTranslations()
  const [settings, setSettings] = useState<ContractSettingsRaw | null>(null)

  const [options, setOptions] = useState<SettingsOptions>({
    contract_statuses: [],
    attributions: [],
    companies: [],
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
        apiClient.get<{ success: boolean; data: ContractSettingsRaw }>('/admin/customerscontracts/settings'),
        apiClient.get<{ success: boolean; data: SettingsOptions }>('/admin/customerscontracts/settings/options'),
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
      const res = await apiClient.put<{ success: boolean; data: ContractSettingsRaw }>(
        '/admin/customerscontracts/settings',
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

  const statusOpts = [{ id: '', name: t.noneOption }, ...options.contract_statuses]
  const attrOpts = [{ id: '', name: t.noneOption }, ...options.attributions]
  const companyOpts = [{ id: '', name: t.noneOption }, ...options.companies]

  const holdStatusIds = Array.isArray(settings.hold_statuses)
    ? (settings.hold_statuses as number[]).map(Number)
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
        {t.contractSettingsTitle}
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

      {/* ─── Options ─────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.sectionOptions}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.defaultStatus}
                value={settings.default_status_id ?? ''}
                onChange={e => update('default_status_id', e.target.value || null)}
              >
                {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.defaultAttribution}
                value={settings.default_attribution_id ?? ''}
                onChange={e => update('default_attribution_id', e.target.value || null)}
              >
                {attrOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={isYes(settings.tax_amount_display)} onChange={e => update('tax_amount_display', e.target.checked ? 'YES' : 'NO')} />}
                label={t.taxAmountDisplay}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={isYes(settings.tax_amount_display_list)} onChange={e => update('tax_amount_display_list', e.target.checked ? 'YES' : 'NO')} />}
                label={t.taxAmountDisplayList}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={isYes(settings.autocomplete_list)} onChange={e => update('autocomplete_list', e.target.checked ? 'YES' : 'NO')} />}
                label={t.autocompleteList}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={isYes(settings.ttc_change_by_tax)} onChange={e => update('ttc_change_by_tax', e.target.checked ? 'YES' : 'NO')} />}
                label={t.ttcChangeByTax}
              />
            </Grid>
            {/* Modèle Email par défaut pour le changement de rapport */}
            <Grid item xs={12} sm={6}>
              <TextField
                select fullWidth
                label={t.changeStateEmailModel}
                value={settings.change_state_email_model_id ?? ''}
                onChange={e => update('change_state_email_model_id', e.target.value || null)}
              >
                {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            {/* Rapports pour le blocage du contrat */}
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={options.contract_statuses}
                getOptionLabel={o => o.name}
                value={options.contract_statuses.filter(s => holdStatusIds.includes(s.id))}
                onChange={(_, newValue) => update('hold_statuses', newValue.map(v => v.id))}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option.name} size='small' {...getTagProps({ index })} key={option.id} />
                  ))
                }
                renderInput={params => <TextField {...params} label={t.holdStatuses} />}
              />
            </Grid>
            {/* Rapport si confirmé / non confirmé / annulation / etc. */}
            {([
              ['status_if_confirmed_id', t.statusConfirmed],
              ['status_if_unconfirmed_id', t.statusUnconfirmed],
              ['status_for_cancel_id', t.statusCancel],
              ['status_for_uncancel_id', t.statusUncancel],
              ['status_for_blowing_id', t.statusBlowing],
              ['status_for_unblowing_id', t.statusUnblowing],
              ['status_for_placement_id', t.statusPlacement],
              ['status_for_unplacement_id', t.statusUnplacement],
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
            {/* Rapports non facturable */}
            <Grid item xs={12}>
              <Typography variant='subtitle2' sx={{ mb: 1 }}>
                {t.statusNoBillable}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                value={settings.default_status1_for_no_billable_contract ?? ''}
                onChange={e => update('default_status1_for_no_billable_contract', e.target.value || null)}
              >
                {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                value={settings.default_status2_for_no_billable_contract ?? ''}
                onChange={e => update('default_status2_for_no_billable_contract', e.target.value || null)}
              >
                {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
            {/* Poseur */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={isYes(settings.has_partner_layer)} onChange={e => update('has_partner_layer', e.target.checked ? 'YES' : 'NO')} />}
                label={t.hasPartnerLayer}
              />
            </Grid>
            {/* Nombre d'attributions */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.numberOfAttributions}
                value={settings.number_of_attributions ?? 500}
                onChange={e => update('number_of_attributions', Number(e.target.value))}
                inputProps={{ min: 10, max: 5000 }}
              />
            </Grid>
            {/* Société par défaut */}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.defaultCompany}
                value={settings.default_company_id ?? ''}
                onChange={e => update('default_company_id', e.target.value || null)}
              >
                {companyOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Formats ─────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.sectionFormats}
          </Typography>
          <TextField
            fullWidth
            label={t.formatId}
            value={settings.format_id ?? ''}
            onChange={e => update('format_id', e.target.value)}
            sx={{ maxWidth: 400 }}
          />
        </CardContent>
      </Card>

      {/* ─── Dates ───────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.sectionDates}
          </Typography>
          <TextField
            fullWidth type='number'
            label={t.numberOfDaysOpc}
            value={settings.number_of_day_for_opc ?? 1}
            onChange={e => update('number_of_day_for_opc', Number(e.target.value))}
            inputProps={{ min: 0, max: 10 }}
            sx={{ maxWidth: 400 }}
          />
        </CardContent>
      </Card>

      {/* ─── Mot à bannir (commentaires auto) ────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.sectionComments}
          </Typography>
          <Grid container spacing={1}>
            {([
              ['comment_sale1', t.commentSale1],
              ['comment_sale2', t.commentSale2],
              ['comment_creation', t.commentCreation],
              ['comment_delete', t.commentDelete],
              ['comment_install_status', t.commentInstallStatus],
              ['comment_opc_status', t.commentOpcStatus],
              ['comment_time_state', t.commentTimeState],
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

      {/* ─── Modèles doc société ─────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.sectionCompanyDocModels}
          </Typography>
          <TextField
            select fullWidth
            label={t.changeStateSalesEmailModel}
            value={settings.change_state_sales_model_email_id ?? ''}
            onChange={e => update('change_state_sales_model_email_id', e.target.value || null)}
            sx={{ maxWidth: 600 }}
          >
            {statusOpts.map(o => <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>)}
          </TextField>
        </CardContent>
      </Card>
    </Box>
  )
}
