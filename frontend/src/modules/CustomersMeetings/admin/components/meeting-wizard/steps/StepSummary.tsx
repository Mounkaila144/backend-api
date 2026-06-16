'use client'

import { useMemo } from 'react'

import type { UseFormReturn } from 'react-hook-form'

import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

import type { CustomerFormData, MeetingDetailsFormData, TeamFormData } from '../meetingFormSchema'
import type { MeetingFilterOptions } from '../../../../types'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface StepSummaryProps {
  customerForm: UseFormReturn<CustomerFormData>
  detailsForm: UseFormReturn<MeetingDetailsFormData>
  teamForm: UseFormReturn<TeamFormData>
  filterOptions: MeetingFilterOptions
  t: MeetingTranslations
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

export default function StepSummary({ customerForm, detailsForm, teamForm, filterOptions, t }: StepSummaryProps) {
  const customer = customerForm.getValues()
  const details = detailsForm.getValues()
  const team = teamForm.getValues()

  const dateRows = useMemo(() => {
    const all: [string, string | undefined][] = [
      [t.wizardDateMeeting, details.in_at],
      [t.wizardDateEnd, details.out_at],
      [t.wizardDateCallback, details.callback_at],
      [t.wizardDateOpc, details.opc_at],
      [t.wizardDateCreated, details.created_at],
      [t.wizardDateTreated, details.treated_at],
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
            {customer.customer?.company ? <SummaryRow label={t.wizardCompany} value={customer.customer.company} /> : null}
            <SummaryRow label={t.address} value={customer.customer?.address?.address1} />
            {customer.customer?.address?.address2 ? <SummaryRow label={t.wizardAddress2} value={customer.customer.address.address2} /> : null}
            <SummaryRow label={t.postcode} value={customer.customer?.address?.postcode} />
            <SummaryRow label={t.city} value={customer.customer?.address?.city} />
          </CardContent>
        </Card>
      </Grid>

      {/* Dates & Statuses card */}
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
            {details.state_id ? <SummaryRow label={t.wizardMeetingStatus} value={resolveName(details.state_id, filterOptions.meeting_statuses)} /> : null}
            {details.status_call_id ? <SummaryRow label={t.wizardStatusCall} value={resolveName(details.status_call_id, filterOptions.status_calls)} /> : null}
            {details.status_lead_id ? <SummaryRow label={t.wizardStatusLead} value={resolveName(details.status_lead_id, filterOptions.status_leads)} /> : null}
            {details.opc_range_id ? <SummaryRow label={t.wizardOpcRange} value={resolveName(details.opc_range_id, filterOptions.date_ranges)} /> : null}
            {details.in_at_range_id ? <SummaryRow label={t.wizardInAtRange} value={resolveName(details.in_at_range_id, filterOptions.date_ranges)} /> : null}
          </CardContent>
        </Card>
      </Grid>

      {/* Team & Entities card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-team-line' />
              {t.wizardSummaryTeam}
            </Typography>
            {team.telepro_id ? <SummaryRow label={t.wizardTelepro} value={resolveName(team.telepro_id, filterOptions.users)} /> : null}
            {team.sales_id ? <SummaryRow label={t.wizardSales} value={resolveName(team.sales_id, filterOptions.users)} /> : null}
            {team.sale2_id ? <SummaryRow label={t.wizardSale2} value={resolveName(team.sale2_id, filterOptions.users)} /> : null}
            {team.assistant_id ? <SummaryRow label={t.wizardAssistant} value={resolveName(team.assistant_id, filterOptions.users)} /> : null}
            {team.campaign_id ? <SummaryRow label={t.wizardCampaign} value={resolveName(team.campaign_id, filterOptions.campaigns)} /> : null}
            {team.callcenter_id ? <SummaryRow label={t.wizardCallcenter} value={resolveName(team.callcenter_id, filterOptions.callcenters)} /> : null}
            {team.company_id ? <SummaryRow label={t.wizardCompanyMeeting} value={resolveName(team.company_id, filterOptions.companies)} /> : null}
            {team.polluter_id ? <SummaryRow label={t.wizardPolluter} value={resolveName(team.polluter_id, filterOptions.polluters)} /> : null}
            {team.partner_layer_id ? <SummaryRow label={t.wizardPartnerLayer} value={resolveName(team.partner_layer_id, filterOptions.partner_layers)} /> : null}
          </CardContent>
        </Card>
      </Grid>

      {/* Finance & Flags card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className='ri-money-euro-circle-line' />
              {t.wizardSummaryFinance}
            </Typography>
            {team.turnover != null ? <SummaryRow label={t.wizardTurnover} value={`${team.turnover} EUR`} /> : null}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {team.see_with_mr === 'YES' ? (
                <Chip label={t.wizardSeeWithMr} color='info' size='small' />
              ) : null}
              {team.see_with_mrs === 'YES' ? (
                <Chip label={t.wizardSeeWithMrs} color='info' size='small' />
              ) : null}
              {team.is_qualified === 'YES' ? (
                <Chip label={t.wizardIsQualified} color='success' size='small' />
              ) : null}
              <Chip
                label={team.status === 'ACTIVE' ? t.statusActive : t.statusDeleted}
                color={team.status === 'ACTIVE' ? 'primary' : 'error'}
                size='small'
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Remarks card */}
      {(team.remarks || team.sale_comments) ? (
        <Grid size={12}>
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='subtitle1' gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className='ri-chat-3-line' />
                {t.wizardSummaryRemarks}
              </Typography>
              {team.remarks ? (
                <Box sx={{ mb: 1 }}>
                  <Typography variant='caption' color='text.secondary'>{t.wizardRemarks}</Typography>
                  <Typography variant='body2'>{team.remarks}</Typography>
                </Box>
              ) : null}
              {team.sale_comments ? (
                <Box>
                  <Typography variant='caption' color='text.secondary'>{t.wizardSaleComments}</Typography>
                  <Typography variant='body2'>{team.sale_comments}</Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  )
}
