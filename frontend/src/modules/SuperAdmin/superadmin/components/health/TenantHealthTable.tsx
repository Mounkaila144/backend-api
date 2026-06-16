'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';

import type { TenantStats, HealthStatus } from '../../../types/health.types';

/**
 * Props du composant TenantHealthTable
 */
interface TenantHealthTableProps {

  /** Statistiques des tenants */
  tenantStats: TenantStats[];

  /** Callback au clic sur un tenant */
  onTenantClick?: (tenantId: number) => void;

  /** Afficher en mode compact */
  compact?: boolean;
}

/**
 * Configuration des statuts de santé
 */
const healthConfig: Record<HealthStatus, { color: 'success' | 'warning' | 'error' | 'default'; icon: string; label: string }> = {
  healthy: { color: 'success', icon: 'tabler-circle-check', label: 'OK' },
  warning: { color: 'warning', icon: 'tabler-alert-triangle', label: 'Attention' },
  critical: { color: 'error', icon: 'tabler-alert-circle', label: 'Critique' },
  unknown: { color: 'default', icon: 'tabler-help', label: 'Inconnu' },
};

/**
 * Formate la date d'activité
 */
function formatActivity(dateString?: string): string {
  if (!dateString) return 'Jamais';

  try {
    const date = new Date(dateString);

    
return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Inconnu';
  }
}

/**
 * Tableau de santé des tenants
 * Affiche l'état de chaque tenant avec ses modules
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <TenantHealthTable
 *   tenantStats={health.tenantStats}
 *   onTenantClick={(id) => navigate(`/tenant/${id}`)}
 * />
 * ```
 */
export function TenantHealthTable({
  tenantStats,
  onTenantClick,
  compact = false,
}: TenantHealthTableProps) {
  // Trier par état de santé (critique en premier)
  const sortedTenants = [...tenantStats].sort((a, b) => {
    const order = { critical: 0, warning: 1, unknown: 2, healthy: 3 };

    
return order[a.health] - order[b.health];
  });

  // En mode compact, limiter à 5 tenants
  const displayTenants = compact ? sortedTenants.slice(0, 5) : sortedTenants;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-server" />
            <Typography variant="h6">Santé des tenants</Typography>
          </Box>
        }
        subheader={`${tenantStats.length} tenant(s)`}
      />
      <CardContent sx={{ p: 0 }}>
        {displayTenants.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Aucun tenant
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Domaine</TableCell>
                  <TableCell align="center">Statut</TableCell>
                  <TableCell align="center">Modules</TableCell>
                  <TableCell align="center">Santé</TableCell>
                  {!compact && <TableCell>Dernière activité</TableCell>}
                  {onTenantClick && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {displayTenants.map((tenant) => {
                  const config = healthConfig[tenant.health];

                  const modulePercent = tenant.totalModules > 0
                    ? Math.round((tenant.activeModules / tenant.totalModules) * 100)
                    : 0;

                  return (
                    <TableRow
                      key={tenant.id}
                      hover
                      sx={{
                        cursor: onTenantClick ? 'pointer' : 'default',
                        '&:hover': onTenantClick ? { bgcolor: 'action.hover' } : {},
                      }}
                      onClick={() => onTenantClick?.(tenant.id)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {tenant.domain}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={tenant.status === 'active' ? 'Actif' : tenant.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                          color={tenant.status === 'active' ? 'success' : tenant.status === 'suspended' ? 'error' : 'default'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ flex: 1, minWidth: 60 }}>
                            <LinearProgress
                              variant="determinate"
                              value={modulePercent}
                              color={modulePercent > 50 ? 'success' : modulePercent > 20 ? 'warning' : 'error'}
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                          <Typography variant="caption" sx={{ minWidth: 40 }}>
                            {tenant.activeModules}/{tenant.totalModules}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          icon={<i className={config.icon} style={{ fontSize: 14 }} />}
                          label={config.label}
                          color={config.color}
                          size="small"
                        />
                      </TableCell>
                      {!compact && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatActivity(tenant.lastActivity)}
                          </Typography>
                        </TableCell>
                      )}
                      {onTenantClick && (
                        <TableCell align="right">
                          <Tooltip title="Gérer les modules">
                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onTenantClick(tenant.id); }}>
                              <i className="tabler-settings" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {compact && sortedTenants.length > 5 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', p: 2, textAlign: 'center' }}
          >
            +{sortedTenants.length - 5} autres tenants
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
