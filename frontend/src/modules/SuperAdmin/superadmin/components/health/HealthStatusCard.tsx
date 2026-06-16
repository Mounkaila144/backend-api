'use client';

import React from 'react';

import { Card, CardContent, Box, Typography, Chip, CircularProgress } from '@mui/material';

import type { HealthStatus, GlobalStats } from '../../../types/health.types';

/**
 * Props du composant HealthStatusCard
 */
interface HealthStatusCardProps {

  /** Statut de santé global */
  status: HealthStatus;

  /** Statistiques globales */
  stats: GlobalStats | null;

  /** Dernière mise à jour */
  lastUpdated?: string;

  /** Indicateur de chargement */
  isLoading?: boolean;

  /** Callback de rafraîchissement */
  onRefresh?: () => void;
}

/**
 * Configuration des couleurs et icônes par statut
 */
const statusConfig: Record<HealthStatus, { color: string; icon: string; label: string; bgcolor: string }> = {
  healthy: {
    color: '#4caf50',
    icon: 'tabler-circle-check',
    label: 'Système opérationnel',
    bgcolor: 'rgba(76, 175, 80, 0.1)',
  },
  warning: {
    color: '#ff9800',
    icon: 'tabler-alert-triangle',
    label: 'Attention requise',
    bgcolor: 'rgba(255, 152, 0, 0.1)',
  },
  critical: {
    color: '#f44336',
    icon: 'tabler-alert-circle',
    label: 'État critique',
    bgcolor: 'rgba(244, 67, 54, 0.1)',
  },
  unknown: {
    color: '#9e9e9e',
    icon: 'tabler-help',
    label: 'État inconnu',
    bgcolor: 'rgba(158, 158, 158, 0.1)',
  },
};

/**
 * Formate une date ISO en format relatif
 */
function formatLastUpdated(isoDate?: string): string {
  if (!isoDate) return 'Jamais';

  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    
return date.toLocaleDateString('fr-FR');
  } catch {
    return 'Inconnu';
  }
}

/**
 * Carte affichant le statut de santé global du système
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <HealthStatusCard
 *   status="healthy"
 *   stats={globalStats}
 *   lastUpdated={new Date().toISOString()}
 *   onRefresh={() => refresh()}
 * />
 * ```
 */
export function HealthStatusCard({
  status,
  stats,
  lastUpdated,
  isLoading = false,
  onRefresh,
}: HealthStatusCardProps) {
  const config = statusConfig[status];

  return (
    <Card
      sx={{
        bgcolor: config.bgcolor,
        border: `2px solid ${config.color}`,
        height: '100%',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isLoading ? (
              <CircularProgress size={48} sx={{ color: config.color }} />
            ) : (
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <i className={config.icon} style={{ fontSize: 32 }} />
              </Box>
            )}
            <Box>
              <Typography variant="h5" sx={{ color: config.color, fontWeight: 'bold' }}>
                {config.label}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dernière mise à jour: {formatLastUpdated(lastUpdated)}
              </Typography>
            </Box>
          </Box>

          {onRefresh && (
            <Chip
              icon={<i className="tabler-refresh" />}
              label="Actualiser"
              onClick={onRefresh}
              variant="outlined"
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          )}
        </Box>

        {stats && (
          <Box sx={{ mt: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalSites}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sites totaux
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                {stats.activeSites}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sites actifs
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                {stats.totalModules}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Modules
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {stats.totalActivations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Activations
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="info.main">
                {stats.moduleUsagePercent}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Utilisation
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
