'use client';

import React from 'react';

import { Box, Grid, Skeleton, Alert } from '@mui/material';

import { useSystemHealth } from '../../hooks/useSystemHealth';
import { HealthStatusCard } from './HealthStatusCard';
import { ModuleUsageChart } from './ModuleUsageChart';
import { TenantHealthTable } from './TenantHealthTable';
import { AlertsList } from './AlertsList';
import { ActivityTimeline } from './ActivityTimeline';

/**
 * Props du composant HealthDashboard
 */
interface HealthDashboardProps {

  /** Callback au clic sur un tenant */
  onTenantClick?: (tenantId: number) => void;

  /** Active le rafraîchissement automatique */
  autoRefresh?: boolean;

  /** Intervalle de rafraîchissement en ms */
  refreshInterval?: number;
}

/**
 * Composant skeleton pour le chargement
 */
function DashboardSkeleton() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid item xs={12} md={8}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </Grid>
    </Grid>
  );
}

/**
 * Dashboard de santé globale du système
 * Affiche l'état complet du système avec statistiques, alertes et activité
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <HealthDashboard
 *   onTenantClick={(id) => router.push(`/superadmin/sites/${id}`)}
 *   autoRefresh
 *   refreshInterval={30000}
 * />
 * ```
 */
export function HealthDashboard({
  onTenantClick,
  autoRefresh = true,
  refreshInterval = 60000,
}: HealthDashboardProps) {
  const { health, stats, alerts, isLoading, error, refresh, markAlertAsRead } = useSystemHealth(
    autoRefresh,
    refreshInterval
  );

  // Affichage du chargement initial
  if (isLoading && !health) {
    return <DashboardSkeleton />;
  }

  // Affichage de l'erreur
  if (error && !health) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Erreur lors du chargement des données: {error}
      </Alert>
    );
  }

  // Si pas de données
  if (!health) {
    return (
      <Alert severity="warning">
        Aucune donnée disponible
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Carte de statut principal */}
        <Grid item xs={12}>
          <HealthStatusCard
            status={health.status}
            stats={stats}
            lastUpdated={health.lastUpdated}
            isLoading={isLoading}
            onRefresh={refresh}
          />
        </Grid>

        {/* Alertes et utilisation des modules */}
        <Grid item xs={12} md={6}>
          <AlertsList
            alerts={alerts}
            onDismiss={markAlertAsRead}
            maxAlerts={5}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ModuleUsageChart
            moduleStats={health.moduleStats}
            compact
          />
        </Grid>

        {/* Table des tenants */}
        <Grid item xs={12} md={8}>
          <TenantHealthTable
            tenantStats={health.tenantStats}
            onTenantClick={onTenantClick}
          />
        </Grid>

        {/* Timeline d'activité */}
        <Grid item xs={12} md={4}>
          <ActivityTimeline
            activities={health.recentActivity}
            maxItems={8}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
