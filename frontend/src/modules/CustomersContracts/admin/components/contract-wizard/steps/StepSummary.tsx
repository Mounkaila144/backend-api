'use client'

import { useMemo } from 'react'

import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

import type { CustomerFormData, ContractDetailsFormData, TeamFinanceFormData, IsoFormData, VerifFormData } from '../contractFormSchema'
import type { ContractFilterOptions } from '../../../../types'
import type { DomoprimeFilterOptions } from '@/modules/AppDomoprime/types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface StepSummaryProps {
  customerForm: UseFormReturn<CustomerFormData>
  detailsForm: UseFormReturn<ContractDetailsFormData>
  teamFinanceForm: UseFormReturn<TeamFinanceFormData>
  isoForm: UseFormReturn<IsoFormData>
  verifForm: UseFormReturn<VerifFormData>
  filterOptions: ContractFilterOptions
  domoprimeOptions: DomoprimeFilterOptions
  t: ContractTranslations
}

function SummaryRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant='body2' color='text.secondary'>{label}</Typography>
      <Typography variant='body2' fontWeight={500}>{value || '-'}</Typography>
    </Box>
  )
}

function resolveName(id: number | undefined, options: { id: number | string; name: string }[]): string {
  if (!id) return '-'

  const opt = options.find(o => Number(o.id) === id)

  return opt?.name ?? String(id)
}

export default function StepSummary({ customerForm, detailsForm, teamFinanceForm, isoForm, verifForm, filterOptions, domoprimeOptions, t }: StepSummaryProps) {
  const customer = customerForm.getValues()
  const details = detailsForm.getValues()
  const tf = teamFinanceForm.getValues()
  const iso = isoForm.getValues()
  const verif = verifForm.getValues().verif.filter(v => v.reference || v.number)

  const hasIsoData = Object.entries(iso).some(([, v]) => v !== undefined && v !== '')

  const dateRows = useMemo(() => {
    const all: [string, string | undefined][] = [
      [t.wizardDateInstallation, details.sav_at],
      [t.datePreMeeting, details.pre_meeting_at],
      [t.dateQuote, details.quoted_at],
      [t.dateEngagement, details.opened_at],
      [t.dateBilling, details.billing_at],
      [t.dateDoc, details.doc_at],
      [t.dateOpc, details.opc_at],
      [t.datePayment, details.payment_at],
      [t.dateApf, details.apf_at],
      [t.dateClosed, details.closed_at],
    ]

    return all.filter(([, v]) => !!v)
  }, [details, t])

  return (
    <Grid container spacing={3}>
      {/* Customer card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-user-line' />
              {t.wizardSummaryClient}
            </Typography>
            {customer.customer?.gender ? <SummaryRow label={t.wizardGender} value={customer.customer.gender} /> : null}
            <SummaryRow label={t.lastName} value={customer.customer?.lastname} />
            <SummaryRow label={t.firstName} value={customer.customer?.firstname} />
            <SummaryRow label={t.phone} value={customer.customer?.phone} />
            {customer.customer?.email ? <SummaryRow label={t.wizardEmail} value={customer.customer.email} /> : null}
            {customer.customer?.mobile ? <SummaryRow label={t.wizardMobile} value={customer.customer.mobile} /> : null}
            {customer.customer?.mobile2 ? <SummaryRow label={t.wizardMobile2} value={customer.customer.mobile2} /> : null}
            {customer.customer?.company ? <SummaryRow label={t.wizardCustomerCompany} value={customer.customer.company} /> : null}
            <SummaryRow label={t.address} value={customer.customer?.address?.address1} />
            {customer.customer?.address?.address2 ? <SummaryRow label={t.wizardAddress2} value={customer.customer.address.address2} /> : null}
            <SummaryRow label={t.postcode} value={customer.customer?.address?.postcode} />
            <SummaryRow label={t.city} value={customer.customer?.address?.city} />
          </CardContent>
        </Card>
      </Grid>

      {/* Dates card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-calendar-line' />
              {t.wizardSummaryDates}
            </Typography>
            {dateRows.map(([label, value]) => (
              <SummaryRow key={label} label={label} value={value} />
            ))}
            {details.has_tva ? <SummaryRow label={t.wizardHasTva} value={details.has_tva === '1' ? t.wizardHasTvaYes : t.wizardHasTvaNo} /> : null}
          </CardContent>
        </Card>
      </Grid>

      {/* Team card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-team-line' />
              {t.wizardSummaryTeam}
            </Typography>
            <SummaryRow label={t.wizardTelepro} value={resolveName(tf.telepro_id, filterOptions.users)} />
            <SummaryRow label={t.wizardSale1} value={resolveName(tf.sale_1_id, filterOptions.users)} />
            <SummaryRow label={t.wizardSale2} value={resolveName(tf.sale_2_id, filterOptions.users)} />
            <SummaryRow label={t.wizardManager} value={resolveName(tf.manager_id, filterOptions.users)} />
            <SummaryRow label={t.wizardAssistant} value={resolveName(tf.assistant_id, filterOptions.users)} />
            <SummaryRow label={t.wizardInstaller} value={resolveName(tf.installer_user_id, filterOptions.users)} />
            <SummaryRow label={t.wizardTeam} value={resolveName(tf.team_id, filterOptions.teams)} />
            {tf.sous_traitant_id ? <SummaryRow label={t.wizardSousTraitant} value={resolveName(tf.sous_traitant_id, filterOptions.users)} /> : null}
            {tf.polluter_id ? <SummaryRow label={t.wizardWorksType} value={resolveName(tf.polluter_id, filterOptions.polluters)} /> : null}
            {tf.campaign_id ? <SummaryRow label={t.wizardCampaign} value={resolveName(tf.campaign_id, filterOptions.campaigns)} /> : null}
          </CardContent>
        </Card>
      </Grid>

      {/* Other info card */}
      {(tf.rapport_installation || tf.rapport_temps || tf.periode_cee || tf.surface_parcelle) ? (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className='ri-information-line' />
                {t.wizardSummaryOther}
              </Typography>
              {tf.rapport_installation ? <SummaryRow label={t.wizardRapport} value={tf.rapport_installation} /> : null}
              {tf.rapport_temps ? <SummaryRow label={t.wizardRapportSuivie} value={tf.rapport_temps} /> : null}
              {tf.periode_cee ? <SummaryRow label={t.wizardPeriodeCee} value={tf.periode_cee} /> : null}
              {tf.surface_parcelle ? <SummaryRow label={t.wizardSurfaceParcelle} value={tf.surface_parcelle} /> : null}
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {/* Finance & status card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-money-euro-circle-line' />
              {t.wizardSummaryFinanceStatus}
            </Typography>
            <SummaryRow label={t.wizardCompany} value={resolveName(details.company_id, filterOptions.companies)} />
            <SummaryRow label={t.wizardFinancialPartner} value={resolveName(details.financial_partner_id, filterOptions.financial_partners)} />
            {details.partner_layer_id ? <SummaryRow label={t.wizardPartnerLayer} value={resolveName(details.partner_layer_id, filterOptions.partner_layers)} /> : null}
            <SummaryRow label={t.priceHt} value={details.total_price_without_taxe != null ? `${details.total_price_without_taxe} EUR` : '-'} />
            <SummaryRow label={t.priceTtc} value={details.total_price_with_taxe != null ? `${details.total_price_with_taxe} EUR` : '-'} />
            {tf.mensuality != null ? <SummaryRow label={t.wizardMensuality} value={`${tf.mensuality} EUR`} /> : null}
            {tf.advance_payment != null ? <SummaryRow label={t.wizardAdvancePayment} value={`${tf.advance_payment} EUR`} /> : null}
            {details.opc_range_id ? <SummaryRow label={t.wizardOpcRange} value={resolveName(details.opc_range_id, filterOptions.date_ranges)} /> : null}
            {details.sav_at_range_id ? <SummaryRow label={t.wizardSavRange} value={resolveName(details.sav_at_range_id, filterOptions.date_ranges)} /> : null}
            <SummaryRow label={t.wizardContractStatus} value={resolveName(details.state_id, filterOptions.contract_statuses)} />
            <SummaryRow label={t.wizardInstallStatus} value={resolveName(tf.install_state_id, filterOptions.install_statuses)} />
            <SummaryRow label={t.wizardAdminStatus} value={resolveName(tf.admin_status_id, filterOptions.admin_statuses)} />
            {tf.opc_status_id ? <SummaryRow label={t.wizardOpcStatus} value={resolveName(tf.opc_status_id, filterOptions.opc_statuses)} /> : null}
            {tf.time_state_id ? <SummaryRow label={t.wizardTimeStatus} value={resolveName(tf.time_state_id, filterOptions.time_statuses)} /> : null}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                label={tf.is_signed === 'YES' ? t.yes : t.no}
                color={tf.is_signed === 'YES' ? 'success' : 'default'}
                size='small'
              />
              {tf.is_billable ? (
                <Chip
                  label={tf.is_billable === 'YES' ? t.wizardIsBillable : t.chipNotBillable}
                  color={tf.is_billable === 'YES' ? 'info' : 'default'}
                  size='small'
                />
              ) : null}
              <Chip
                label={tf.status === 'ACTIVE' ? t.statusActive : t.statusDeleted}
                color={tf.status === 'ACTIVE' ? 'primary' : 'error'}
                size='small'
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Fiscal et Habitat card */}
      {hasIsoData || verif.length > 0 ? (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className='ri-home-4-line' />
                {t.wizardStepTeamFinance}
              </Typography>
              {verif.map((v, i) => (
                <Box key={i}>
                  {v.number ? <SummaryRow label={`${t.isoFiscalNumber} ${i + 1}`} value={v.number} /> : null}
                  {v.reference ? <SummaryRow label={`${t.isoFiscalReference} ${i + 1}`} value={v.reference} /> : null}
                </Box>
              ))}
              {iso.ana_prime != null ? <SummaryRow label={t.isoAnaPrime} value={`${iso.ana_prime} EUR`} /> : null}
              {iso.number_of_people != null ? <SummaryRow label={t.isoNumberOfPeople} value={String(iso.number_of_people)} /> : null}
              {iso.revenue != null ? <SummaryRow label={t.isoRevenue} value={`${iso.revenue} EUR`} /> : null}
              {iso.number_of_fiscal != null ? <SummaryRow label={t.isoNumberOfFiscal} value={String(iso.number_of_fiscal)} /> : null}
              {iso.declarants ? <SummaryRow label={t.isoDeclarants} value={iso.declarants} /> : null}
              {iso.number_of_parts != null ? <SummaryRow label={t.isoNumberOfParts} value={String(iso.number_of_parts)} /> : null}
              {iso.number_of_children != null ? <SummaryRow label={t.isoNumberOfChildren} value={String(iso.number_of_children)} /> : null}
              {iso.tax_credit_used != null ? <SummaryRow label={t.isoTaxCreditUsed} value={`${iso.tax_credit_used} EUR`} /> : null}
              {iso.pricing_id ? <SummaryRow label={t.isoPricing} value={resolveName(iso.pricing_id, domoprimeOptions.pricings)} /> : null}
              {iso.previous_energy_id ? <SummaryRow label={t.isoPreviousEnergy} value={resolveName(iso.previous_energy_id, domoprimeOptions.previous_energies)} /> : null}
              {iso.energy_id ? <SummaryRow label={t.isoEnergy} value={resolveName(iso.energy_id, domoprimeOptions.energies)} /> : null}
              {iso.occupation_id ? <SummaryRow label={t.isoOccupationType} value={resolveName(iso.occupation_id, domoprimeOptions.occupations)} /> : null}
              {iso.more_2_years ? <SummaryRow label={t.isoMore2Years} value={iso.more_2_years === 'YES' ? t.yes : t.no} /> : null}
              {iso.parcel_reference ? <SummaryRow label={t.isoParcelReference} value={iso.parcel_reference} /> : null}
              {iso.parcel_surface != null ? <SummaryRow label={t.isoParcelSurface} value={`${iso.parcel_surface} m²`} /> : null}
              {iso.layer_type_id ? <SummaryRow label={t.isoLayerType} value={resolveName(iso.layer_type_id, domoprimeOptions.layer_types)} /> : null}
              {iso.surface_top != null ? <SummaryRow label={t.isoSurfaceTop} value={`${iso.surface_top} m²`} /> : null}
              {iso.surface_wall != null ? <SummaryRow label={t.isoSurfaceWall} value={`${iso.surface_wall} m²`} /> : null}
              {iso.surface_floor != null ? <SummaryRow label={t.isoSurfaceFloor} value={`${iso.surface_floor} m²`} /> : null}
              {iso.surface_ite != null ? <SummaryRow label={t.isoSurfaceIte} value={`${iso.surface_ite} m²`} /> : null}
              {iso.boiler_quantity != null ? <SummaryRow label={t.isoBoilerQuantity} value={String(iso.boiler_quantity)} /> : null}
              {iso.pack_quantity != null ? <SummaryRow label={t.isoPackQuantity} value={String(iso.pack_quantity)} /> : null}
              {iso.install_surface_top != null ? <SummaryRow label={t.isoInstallSurfaceTop} value={`${iso.install_surface_top} m²`} /> : null}
              {iso.install_surface_wall != null ? <SummaryRow label={t.isoInstallSurfaceWall} value={`${iso.install_surface_wall} m²`} /> : null}
              {iso.install_surface_floor != null ? <SummaryRow label={t.isoInstallSurfaceFloor} value={`${iso.install_surface_floor} m²`} /> : null}
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      {/* Remarks card (if present) */}
      {details.remarks ? (
        <Grid size={12}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className='ri-chat-3-line' />
                {t.wizardSummaryRemarks}
              </Typography>
              <Typography variant='body2'>{details.remarks}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  )
}
