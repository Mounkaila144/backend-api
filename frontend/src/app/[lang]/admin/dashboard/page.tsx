// MUI Imports
import Grid from '@mui/material/Grid2'

// Components Imports
import Award from '@views/dashboards/admin/Award'
import ContractsOverview from '@views/dashboards/admin/ContractsOverview'
import LeadsChart from '@views/dashboards/admin/LeadsChart'
import QuotesStatus from '@views/dashboards/admin/QuotesStatus'
import AppointmentsSchedule from '@views/dashboards/admin/AppointmentsSchedule'
import ClientsGrowth from '@views/dashboards/admin/ClientsGrowth'
import MonthlyPerformance from '@views/dashboards/admin/MonthlyPerformance'
import RecentContracts from '@views/dashboards/admin/RecentContracts'
import CardStatVertical from '@components/card-statistics/Vertical'

const AdminDashboard = async ({ params }: { params: Promise<{ lang: string }> }) => {
  await params

  return (
    <Grid container spacing={6}>
      {/* Award Card */}
      <Grid size={{ xs: 12, md: 4 }}>
        <Award />
      </Grid>

      {/* Stats Cards */}
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <CardStatVertical
          stats='245'
          title='Contrats'
          trendNumber='22%'
          chipText='Ce Mois'
          avatarColor='primary'
          avatarIcon='ri-file-text-line'
          avatarSkin='light'
          chipColor='secondary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <CardStatVertical
          stats='120'
          title='Leads Actifs'
          trendNumber='18%'
          chipText='Cette Semaine'
          avatarColor='success'
          avatarIcon='ri-user-add-line'
          avatarSkin='light'
          chipColor='secondary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <CardStatVertical
          stats='385'
          title='Clients'
          trendNumber='12%'
          chipText='Total'
          avatarColor='warning'
          avatarIcon='ri-group-line'
          avatarSkin='light'
          chipColor='secondary'
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 2 }}>
        <CardStatVertical
          stats='42'
          title='Utilisateurs'
          trendNumber='8%'
          chipText='Actifs'
          avatarColor='info'
          avatarIcon='ri-user-settings-line'
          avatarSkin='light'
          chipColor='secondary'
        />
      </Grid>

      {/* Charts Row */}
      <Grid size={{ xs: 12, md: 4 }}>
        <LeadsChart />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <QuotesStatus />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <ClientsGrowth />
      </Grid>

      {/* Contracts Overview */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <ContractsOverview />
      </Grid>

      {/* Monthly Performance */}
      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
        <MonthlyPerformance />
      </Grid>

      {/* Appointments Schedule */}
      <Grid size={{ xs: 12, md: 4 }}>
        <AppointmentsSchedule />
      </Grid>

      {/* Recent Contracts Table */}
      <Grid size={{ xs: 12 }}>
        <RecentContracts />
      </Grid>
    </Grid>
  )
}

export default AdminDashboard
