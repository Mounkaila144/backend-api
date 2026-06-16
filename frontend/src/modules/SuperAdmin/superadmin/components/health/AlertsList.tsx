'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Chip,
} from '@mui/material';

import type { SystemAlert } from '../../../types/health.types';

/**
 * Props du composant AlertsList
 */
interface AlertsListProps {

  /** Liste des alertes */
  alerts: SystemAlert[];

  /** Callback pour marquer une alerte comme lue */
  onDismiss?: (alertId: string) => void;

  /** Afficher en mode compact */
  compact?: boolean;

  /** Nombre maximum d'alertes à afficher */
  maxAlerts?: number;
}

/**
 * Configuration des types d'alertes
 */
const alertConfig: Record<SystemAlert['type'], { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  error: { color: 'error', icon: 'tabler-alert-circle' },
  warning: { color: 'warning', icon: 'tabler-alert-triangle' },
  info: { color: 'info', icon: 'tabler-info-circle' },
  success: { color: 'success', icon: 'tabler-circle-check' },
};

/**
 * Formate la date de l'alerte
 */
function formatAlertTime(isoDate: string): string {
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
 * Liste des alertes système
 * Affiche les alertes actives avec possibilité de les ignorer
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <AlertsList
 *   alerts={health.alerts}
 *   onDismiss={(id) => markAlertAsRead(id)}
 * />
 * ```
 */
export function AlertsList({
  alerts,
  onDismiss,
  compact = false,
  maxAlerts = 5,
}: AlertsListProps) {
  // Filtrer les alertes non lues et trier par type (erreur en premier)
  const activeAlerts = alerts
    .filter((a) => !a.read)
    .sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2, success: 3 };

      
return order[a.type] - order[b.type];
    });

  // Limiter si nécessaire
  const displayAlerts = activeAlerts.slice(0, maxAlerts);

  // Compter par type
  const errorCount = activeAlerts.filter((a) => a.type === 'error').length;
  const warningCount = activeAlerts.filter((a) => a.type === 'warning').length;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-bell" />
            <Typography variant="h6">Alertes</Typography>
            {errorCount > 0 && (
              <Chip label={errorCount} color="error" size="small" />
            )}
            {warningCount > 0 && (
              <Chip label={warningCount} color="warning" size="small" />
            )}
          </Box>
        }
        subheader={`${activeAlerts.length} alerte(s) active(s)`}
      />
      <CardContent sx={{ p: 0 }}>
        {displayAlerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            <i className="tabler-check" style={{ fontSize: 48, color: '#4caf50' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aucune alerte active
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayAlerts.map((alert, index) => {
              const config = alertConfig[alert.type];

              
return (
                <ListItem
                  key={alert.id}
                  divider={index < displayAlerts.length - 1}
                  sx={{
                    bgcolor: `${config.color}.light`,
                    '&:hover': { bgcolor: `${config.color}.main`, '& .MuiListItemText-primary': { color: 'white' } },
                  }}
                  secondaryAction={
                    onDismiss && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => onDismiss(alert.id)}
                        title="Ignorer"
                      >
                        <i className="tabler-x" />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <i className={config.icon} style={{ fontSize: 24, color: `var(--mui-palette-${config.color}-main)` }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {alert.title}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {compact ? alert.message.slice(0, 50) + (alert.message.length > 50 ? '...' : '') : alert.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatAlertTime(alert.timestamp)}
                          {alert.tenantId && ` • Tenant #${alert.tenantId}`}
                          {alert.moduleName && ` • ${alert.moduleName}`}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}

        {activeAlerts.length > maxAlerts && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', p: 2, textAlign: 'center' }}
          >
            +{activeAlerts.length - maxAlerts} autres alertes
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
