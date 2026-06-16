'use client';

import React from 'react';

import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Stack,
} from '@mui/material';

import type { ImpactAnalysis } from '../../../types/deactivation.types';
import { deactivationService } from '../../services/deactivationService';

/**
 * Props du composant ImpactAnalysisView
 */
interface ImpactAnalysisViewProps {

  /** Analyse d'impact à afficher */
  impact: ImpactAnalysis;

  /** Mode compact (moins de détails) */
  compact?: boolean;
}

/**
 * Obtient la couleur et l'icône selon la sévérité
 */
function getSeverityDisplay(severity: 'low' | 'medium' | 'high' | 'critical') {
  switch (severity) {
    case 'low':
      return {
        color: 'success' as const,
        icon: 'tabler-circle-check',
        label: 'Impact faible',
        bgcolor: 'success.lighter',
      };
    case 'medium':
      return {
        color: 'info' as const,
        icon: 'tabler-info-circle',
        label: 'Impact modéré',
        bgcolor: 'info.lighter',
      };
    case 'high':
      return {
        color: 'warning' as const,
        icon: 'tabler-alert-triangle',
        label: 'Impact important',
        bgcolor: 'warning.lighter',
      };
    case 'critical':
      return {
        color: 'error' as const,
        icon: 'tabler-alert-octagon',
        label: 'Désactivation bloquée',
        bgcolor: 'error.lighter',
      };
  }
}

/**
 * Composant qui affiche l'analyse d'impact avant désactivation
 * Montre les blockers, warnings, données affectées et recommandations
 *
 * @example
 * ```tsx
 * <ImpactAnalysisView impact={impactAnalysis} />
 * ```
 */
export function ImpactAnalysisView({ impact, compact = false }: ImpactAnalysisViewProps) {
  const severity = deactivationService.getImpactSeverity(impact);
  const display = getSeverityDisplay(severity);
  const stats = deactivationService.getImpactStatistics(impact);

  return (
    <Box>
      {/* En-tête avec statut global */}
      <Alert
        severity={display.color}
        sx={{ mb: 3 }}
        icon={<i className={display.icon} style={{ fontSize: 24 }} />}
      >
        <Typography variant="subtitle2">{display.label}</Typography>
        {impact.canDeactivate ? (
          <Typography variant="caption">
            La désactivation est possible {stats.totalWarnings > 0 && 'mais nécessite votre attention'}.
          </Typography>
        ) : (
          <Typography variant="caption">
            La désactivation est bloquée. Résolvez d&apos;abord les problèmes ci-dessous.
          </Typography>
        )}
      </Alert>

      {/* Section Blockers */}
      {impact.blockers.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'error.main', bgcolor: 'error.lighter' }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'error.dark' }}
          >
            <i className="tabler-lock" />
            Blockers ({impact.blockers.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Ces modules dépendent de celui-ci et doivent être désactivés en premier :
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {impact.blockers.map((blocker) => (
              <Chip key={blocker} label={blocker} color="error" size="small" />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Section Modules Dépendants (non bloquants) */}
      {impact.dependentModules.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderColor: 'warning.main', bgcolor: 'warning.lighter' }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}
          >
            <i className="tabler-link" />
            Modules liés ({impact.dependentModules.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Ces modules seront affectés mais ne bloquent pas la désactivation :
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {impact.dependentModules.map((module) => (
              <Chip key={module} label={module} color="warning" size="small" variant="outlined" />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Section Données Affectées */}
      {!compact && (stats.totalTables > 0 || stats.totalRows > 0) && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <i className="tabler-database" />
            Données affectées
          </Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="h5" color="text.primary">
                {stats.totalTables}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                table{stats.totalTables > 1 ? 's' : ''}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" color="text.primary">
                {stats.totalRows.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                lignes estimées
              </Typography>
            </Box>
          </Box>
          {impact.affectedData.tables.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Tables concernées :
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                {impact.affectedData.tables.join(', ')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Section Avertissements */}
      {impact.warnings.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}
          >
            <i className="tabler-alert-triangle" />
            Avertissements ({impact.warnings.length})
          </Typography>
          <List dense sx={{ py: 0 }}>
            {impact.warnings.map((warning, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <i className="tabler-point" style={{ color: '#ff9800' }} />
                </ListItemIcon>
                <ListItemText
                  primary={warning}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Section Recommandations */}
      {!compact && impact.recommendations.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, color: 'info.main' }}
          >
            <i className="tabler-bulb" />
            Recommandations ({impact.recommendations.length})
          </Typography>
          <List dense sx={{ py: 0 }}>
            {impact.recommendations.map((recommendation, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <i className="tabler-check" style={{ color: '#2196f3' }} />
                </ListItemIcon>
                <ListItemText
                  primary={recommendation}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
