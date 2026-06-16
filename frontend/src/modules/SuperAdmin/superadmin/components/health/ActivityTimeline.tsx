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
  Chip,
  Divider,
  Avatar,
} from '@mui/material';

import type { RecentActivity } from '../../../types/health.types';

/**
 * Props du composant ActivityTimeline
 */
interface ActivityTimelineProps {

  /** Liste des activités récentes */
  activities: RecentActivity[];

  /** Afficher en mode compact */
  compact?: boolean;

  /** Nombre maximum d'activités à afficher */
  maxItems?: number;
}

/**
 * Configuration des types d'actions
 */
const actionConfig: Record<RecentActivity['action'], { color: 'success' | 'error' | 'warning' | 'info'; icon: string; label: string; bgcolor: string }> = {
  activation: { color: 'success', icon: 'tabler-plug', label: 'Activation', bgcolor: '#e8f5e9' },
  deactivation: { color: 'warning', icon: 'tabler-plug-off', label: 'Désactivation', bgcolor: '#fff3e0' },
  configuration: { color: 'info', icon: 'tabler-settings', label: 'Configuration', bgcolor: '#e3f2fd' },
  error: { color: 'error', icon: 'tabler-alert-circle', label: 'Erreur', bgcolor: '#ffebee' },
};

/**
 * Formate la date de l'activité
 */
function formatActivityTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
    
return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return '-';
  }
}

/**
 * Liste des activités récentes
 * Affiche les dernières actions effectuées sur le système
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <ActivityTimeline activities={health.recentActivity} />
 * ```
 */
export function ActivityTimeline({
  activities,
  maxItems = 10,
}: ActivityTimelineProps) {
  // Limiter le nombre d'activités
  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-history" />
            <Typography variant="h6">Activité récente</Typography>
          </Box>
        }
        subheader={`${activities.length} action(s)`}
      />
      <CardContent sx={{ p: 0 }}>
        {displayActivities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <i className="tabler-clock" style={{ fontSize: 48, color: '#9e9e9e' }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aucune activité récente
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {displayActivities.map((activity, index) => {
              const config = actionConfig[activity.action];
              const isLast = index === displayActivities.length - 1;

              return (
                <React.Fragment key={activity.id}>
                  <ListItem
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 48 }}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: activity.success ? config.bgcolor : '#ffebee',
                        }}
                      >
                        <i
                          className={config.icon}
                          style={{
                            fontSize: 18,
                            color: activity.success
                              ? `var(--mui-palette-${config.color}-main)`
                              : 'var(--mui-palette-error-main)',
                          }}
                        />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                          <Typography variant="body2" fontWeight="medium" noWrap sx={{ flex: 1 }}>
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                            {formatActivityTime(activity.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {activity.tenantDomain}
                          </Typography>
                          {activity.moduleName && (
                            <Chip
                              label={activity.moduleName}
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                          {!activity.success && (
                            <Chip
                              label="Échec"
                              size="small"
                              color="error"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {!isLast && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}

        {activities.length > maxItems && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', p: 2, textAlign: 'center' }}
          >
            +{activities.length - maxItems} autres activités
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
