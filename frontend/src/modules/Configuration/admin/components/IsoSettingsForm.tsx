'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'
import { usePermissions } from '@/shared/contexts/PermissionsContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SelectOption {
  id: number
  name: string
}

interface SettingsOptions {
  quotation_models: SelectOption[]
  billing_models: SelectOption[]
  asset_models: SelectOption[]
  premeeting_models: SelectOption[]
  afterwork_models: SelectOption[]
  energies: SelectOption[]
  classes: SelectOption[]
  contract_statuses: SelectOption[]
}

interface IsoSettingsRaw {
  [key: string]: string | number | boolean | null | number[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isYes = (val: unknown): boolean => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  return false
}

const toIds = (val: unknown): number[] => {
  if (Array.isArray(val)) return val.map(Number)
  return []
}

const none = (t: { noneOption: string }) => [{ id: 0, name: t.noneOption }]

// ─── Component ────────────────────────────────────────────────────────────────

export default function IsoSettingsForm() {
  const t = useConfigTranslations()
  const { hasCredential } = usePermissions()
  const isSuperadmin = hasCredential([['superadmin']])

  const [settings, setSettings] = useState<IsoSettingsRaw | null>(null)
  const [options, setOptions] = useState<SettingsOptions>({
    quotation_models: [],
    billing_models: [],
    asset_models: [],
    premeeting_models: [],
    afterwork_models: [],
    energies: [],
    classes: [],
    contract_statuses: [],
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // ─── Fetch ──────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const [settingsRes, optionsRes] = await Promise.all([
        apiClient.get<{ success: boolean; data: IsoSettingsRaw }>('/admin/appdomoprime/iso/settings'),
        apiClient.get<{ success: boolean; data: SettingsOptions }>('/admin/appdomoprime/iso/settings/options'),
      ])

      if (settingsRes.data.success) setSettings(settingsRes.data.data)
      if (optionsRes.data.success) setOptions(optionsRes.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [t.settingsLoadError])

  useEffect(() => { fetchData() }, [fetchData])

  // ─── Update helpers ──────────────────────────────────────────────────────

  const update = (key: string, value: unknown) => {
    setSettings(prev => (prev ? { ...prev, [key]: value } : prev))
    setDirty(true)
  }

  const updateBool = (key: string, checked: boolean) => update(key, checked ? 'YES' : 'NO')

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiClient.put<{ success: boolean; data: IsoSettingsRaw }>(
        '/admin/appdomoprime/iso/settings',
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

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading || !settings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const withNone = (list: SelectOption[]) => [{ id: 0, name: t.noneOption }, ...list]
  const energyIds = toIds(settings.energy_filter)
  const classIds = toIds(settings.class_filter)

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
        {t.isoSettingsTitle}
      </Typography>

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

      {/* ─── Modèles par défaut ───────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionModels}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsQuotationModel}
                value={settings.quotation_model_id ?? 0}
                onChange={e => update('quotation_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.quotation_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsBillingModel}
                value={settings.billing_model_id ?? 0}
                onChange={e => update('billing_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.billing_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsAssetModel}
                value={settings.asset_model_id ?? 0}
                onChange={e => update('asset_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.asset_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsPreMeetingModel}
                value={settings.premeeting_model_id ?? 0}
                onChange={e => update('premeeting_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.premeeting_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsAfterWorkModel}
                value={settings.after_work_model_id ?? 0}
                onChange={e => update('after_work_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.afterwork_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsBillingEmailModel}
                value={settings.billing_email_model_id ?? 0}
                onChange={e => update('billing_email_model_id', Number(e.target.value) || null)}
              >
                {withNone(options.billing_models).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Surface (superadmin) ─────────────────────────────────────────── */}
      {isSuperadmin ? (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {t.isoSettingsSectionSurface}
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>{t.isoSettingsAdvNotice}</Alert>
            <Grid container spacing={2}>
              {(
                [
                  ['surface_wall_formfield',  t.isoSettingsSurfaceWallFormfield],
                  ['surface_wall_product',    t.isoSettingsSurfaceWallProduct],
                  ['surface_floor_formfield', t.isoSettingsSurfaceFloorFormfield],
                  ['surface_floor_product',   t.isoSettingsSurfaceFloorProduct],
                  ['surface_top_formfield',   t.isoSettingsSurfaceTopFormfield],
                  ['surface_top_product',     t.isoSettingsSurfaceTopProduct],
                ] as [string, string][]
              ).map(([key, label]) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <TextField
                    fullWidth type='number'
                    label={label}
                    value={settings[key] ?? ''}
                    onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))}
                    inputProps={{ min: 0 }}
                    helperText={`ID (${key})`}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Energies (superadmin) ───────────────────────────────────────── */}
      {isSuperadmin ? (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {t.isoSettingsSectionEnergiesAdv}
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>{t.isoSettingsAdvNotice}</Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth type='number'
                  label={t.isoSettingsEnergyFormfield}
                  value={settings.energy_formfield ?? ''}
                  onChange={e => update('energy_formfield', e.target.value === '' ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                  helperText='ID (energy_formfield)'
                />
              </Grid>
            </Grid>

            {options.energies.length > 0 ? (
              <>
                <Typography variant='body2' sx={{ mt: 3, mb: 1, color: 'text.secondary' }}>
                  {t.isoSettingsEnergyMapping}
                </Typography>
                <Grid container spacing={2}>
                  {options.energies.map(en => {
                    const key = `energy_${en.id}`
                    return (
                      <Grid item xs={12} sm={6} md={4} key={key}>
                        <TextField
                          fullWidth type='number'
                          label={en.name}
                          value={settings[key] ?? ''}
                          onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))}
                          inputProps={{ min: 0 }}
                          helperText={key}
                        />
                      </Grid>
                    )
                  })}
                </Grid>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Occupation (superadmin) ─────────────────────────────────────── */}
      {isSuperadmin ? (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {t.isoSettingsSectionOccupation}
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>{t.isoSettingsAdvNotice}</Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth type='number'
                  label={t.isoSettingsOwnerFormfield}
                  value={settings.owner_formfield ?? ''}
                  onChange={e => update('owner_formfield', e.target.value === '' ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                  helperText='ID (owner_formfield)'
                />
              </Grid>
              {(
                [
                  ['owner_1_formfield_value', t.isoSettingsOwnerValue1],
                  ['owner_2_formfield_value', t.isoSettingsOwnerValue2],
                  ['owner_3_formfield_value', t.isoSettingsOwnerValue3],
                ] as [string, string][]
              ).map(([key, label]) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <TextField
                    fullWidth type='number'
                    label={label}
                    value={settings[key] ?? ''}
                    onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Others (superadmin) ─────────────────────────────────────────── */}
      {isSuperadmin ? (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 1 }}>
              {t.isoSettingsSectionOthers}
            </Typography>
            <Alert severity='info' sx={{ mb: 2 }}>{t.isoSettingsAdvNotice}</Alert>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth type='number'
                  label={t.isoSettingsNumberOfPeopleFormfield}
                  value={settings.number_of_people_formfield ?? ''}
                  onChange={e => update('number_of_people_formfield', e.target.value === '' ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth type='number'
                  label={t.isoSettingsRevenueFormfield}
                  value={settings.revenue_formfield ?? ''}
                  onChange={e => update('revenue_formfield', e.target.value === '' ? null : Number(e.target.value))}
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Report (superadmin) — install_in_progess_status_id ──────────── */}
      {isSuperadmin ? (
        <Card variant='outlined' sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant='h6' sx={{ mb: 2 }}>
              {t.isoSettingsSectionReport}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  select fullWidth
                  label={t.isoSettingsInstallInProgressStatus}
                  value={settings.install_in_progess_status_id ?? 0}
                  onChange={e => update('install_in_progess_status_id', Number(e.target.value) || null)}
                >
                  <MenuItem value={0}>{t.noneOption}</MenuItem>
                  {options.contract_statuses.map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ) : null}

      {/* ─── Filtres ──────────────────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionFilters}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={options.energies}
                getOptionLabel={o => o.name}
                value={options.energies.filter(o => energyIds.includes(o.id))}
                onChange={(_, val) => update('energy_filter', val.map(o => o.id))}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderTags={(val, getProps) =>
                  val.map((o, i) => <Chip key={o.id} label={o.name} size='small' {...getProps({ index: i })} />)
                }
                renderInput={params => (
                  <TextField {...params} label={t.isoSettingsEnergyFilter} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={options.classes}
                getOptionLabel={o => o.name}
                value={options.classes.filter(o => classIds.includes(o.id))}
                onChange={(_, val) => update('class_filter', val.map(o => o.id))}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderTags={(val, getProps) =>
                  val.map((o, i) => <Chip key={o.id} label={o.name} size='small' {...getProps({ index: i })} />)
                }
                renderInput={params => (
                  <TextField {...params} label={t.isoSettingsClassFilter} />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select fullWidth
                label={t.isoSettingsClassicClass}
                value={settings.classic_class ?? 0}
                onChange={e => update('classic_class', Number(e.target.value) || null)}
              >
                {withNone(options.classes).map(o => (
                  <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Paramètres financiers ────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionFinancial}
          </Typography>
          <Grid container spacing={2}>
            {(
              [
                ['rest_in_charge', t.isoSettingsRestInCharge],
                ['fee_file', t.isoSettingsFeeFile],
                ['tax_fee_file', t.isoSettingsTaxFeeFile],
                ['pourcentage_advance', t.isoSettingsPourcentageAdvance],
                ['ana_tax', t.isoSettingsAnaTax],
                ['ana_pack_tax', t.isoSettingsAnaPackTax],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <TextField
                  fullWidth type='number'
                  label={label}
                  value={settings[key] ?? ''}
                  onChange={e => update(key, e.target.value === '' ? null : Number(e.target.value))}
                  inputProps={{ min: 0, step: 'any' }}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.isoSettingsSalesLimit}
                value={settings.sales_limit ?? ''}
                onChange={e => update('sales_limit', e.target.value === '' ? null : Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Formats de référence ─────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionFormats}
          </Typography>
          <Grid container spacing={2}>
            {(
              [
                ['quotation_reference_format', t.isoSettingsQuotationReferenceFormat],
                ['billing_reference_format', t.isoSettingsBillingReferenceFormat],
                ['asset_reference_format', t.isoSettingsAssetReferenceFormat],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Grid item xs={12} sm={4} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  value={settings[key] ?? ''}
                  onChange={e => update(key, e.target.value)}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Paramètres numériques ────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionNumeric}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.isoSettingsQuotationShift}
                value={settings.quotation_shift_for_dated_at ?? ''}
                onChange={e => update('quotation_shift_for_dated_at', e.target.value === '' ? null : Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth type='number'
                label={t.isoSettingsMultipleBillingsMax}
                value={settings.multiple_billings_max ?? ''}
                onChange={e => update('multiple_billings_max', e.target.value === '' ? null : Number(e.target.value))}
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Archivage & Options ──────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionArchiving}
          </Typography>
          <Grid container spacing={1}>
            {(
              [
                ['ah_archivage', t.isoSettingsAhArchivage],
                ['quotation_archivage', t.isoSettingsQuotationArchivage],
                ['billing_archivage', t.isoSettingsBillingArchivage],
                ['multi_documents_archivage', t.isoSettingsMultiDocumentsArchivage],
                ['premeeting_archivage', t.isoSettingsPreMeetingArchivage],
                ['verif_archivage', t.isoSettingsVerifArchivage],
                ['signed_verif_archivage', t.isoSettingsSignedVerifArchivage],
                ['tax_credit', t.isoSettingsTaxCredit],
                ['calculation_on_contrat_save', t.isoSettingsCalcOnContratSave],
                ['calculation_on_meeting_save', t.isoSettingsCalcOnMeetingSave],
                ['quotation_multi_pdf', t.isoSettingsQuotationMultiPdf],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isYes(settings[key])}
                      onChange={e => updateBool(key, e.target.checked)}
                    />
                  }
                  label={label}
                />
              </Grid>
            ))}
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={Boolean(settings.coef_multiples)}
                    onChange={e => update('coef_multiples', e.target.checked)}
                  />
                }
                label={t.isoSettingsCoefMultiples}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* ─── Moteurs de calcul ────────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>
            {t.isoSettingsSectionEngines}
          </Typography>
          <Grid container spacing={2}>
            {(
              [
                ['quotation_engine', t.isoSettingsQuotationEngine],
                ['cumac_engine', t.isoSettingsCumacEngine],
                ['quotation_multi_engine', t.isoSettingsQuotationMultiEngine],
              ] as [string, string][]
            ).map(([key, label]) => (
              <Grid item xs={12} sm={4} key={key}>
                <TextField
                  fullWidth
                  label={label}
                  value={settings[key] ?? ''}
                  onChange={e => update(key, e.target.value)}
                  inputProps={{ maxLength: 64 }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Sticky save bar */}
      {dirty ? (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button variant='contained' onClick={handleSave} disabled={saving}>
            <i className='ri-save-line' style={{ marginRight: 6 }} />
            {saving ? t.saving : t.save}
          </Button>
          <Button variant='outlined' onClick={() => { fetchData(); setDirty(false) }} disabled={saving}>
            {t.cancel}
          </Button>
        </Box>
      ) : null}
    </Box>
  )
}
