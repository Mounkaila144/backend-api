'use client';

import React from 'react';

import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

import type { DeactivationResult } from '../../../types/deactivation.types';
import type { SagaStep } from '../../../types/activation.types';
import { SagaStepsList, getSagaStepsStats } from '../activation/SagaStepsList';
import { deactivationService } from '../../services/deactivationService';

/**
 * Props du composant DeactivationReportView
 */
interface DeactivationReportViewProps {

  /** Résultat de la désactivation */
  result: DeactivationResult;

  /** Nom du module */
  moduleName: string;

  /** Version du module */
  moduleVersion: string;

  /** Nom du tenant */
  tenantName: string;

  /** Afficher en mode compact */
  compact?: boolean;
}

/**
 * Formate une date ISO en date locale lisible
 */
function formatDate(isoDate: string | undefined): string {
  if (!isoDate) return '-';

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

/**
 * Extrait les statistiques détaillées des étapes
 */
function getDetailedStats(steps: SagaStep[]) {
  const stats = getSagaStepsStats(steps);

  // Calculer les détails par type d'étape
  const backupStep = steps.find(s => s.name.toLowerCase().includes('backup'));
  const migrationStep = steps.find(s => s.name.toLowerCase().includes('migration') || s.name.toLowerCase().includes('rollback'));
  const s3Step = steps.find(s => s.name.toLowerCase().includes('s3') || s.name.toLowerCase().includes('storage') || s.name.toLowerCase().includes('delete'));
  const dbStep = steps.find(s => s.name.toLowerCase().includes('database') || s.name.toLowerCase().includes('db') || s.name.toLowerCase().includes('record'));

  return {
    ...stats,
    backup: backupStep ? {
      status: backupStep.status,
      path: backupStep.metadata?.path,
      duration: backupStep.duration,
    } : null,
    migrations: migrationStep ? {
      status: migrationStep.status,
      count: migrationStep.metadata?.count || 0,
      duration: migrationStep.duration,
    } : null,
    storage: s3Step ? {
      status: s3Step.status,
      filesDeleted: s3Step.metadata?.filesDeleted || 0,
      duration: s3Step.duration,
    } : null,
    database: dbStep ? {
      status: dbStep.status,
      duration: dbStep.duration,
    } : null,
  };
}

/**
 * Composant d'affichage détaillé du rapport de désactivation
 * Conforme à Story 4.9 - affiche toutes les informations de la désactivation
 *
 * @example
 * ```tsx
 * <DeactivationReportView
 *   result={deactivationResult}
 *   moduleName="Customer"
 *   moduleVersion="1.0.0"
 *   tenantName="example.com"
 * />
 * ```
 */
export function DeactivationReportView({
  result,
  moduleName,
  moduleVersion,
  tenantName,
  compact = false,
}: DeactivationReportViewProps) {
  const stats = getDetailedStats(result.steps);

  return (
    <Box>
      {/* En-tête du rapport */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: result.success ? 'warning.light' : 'error.light' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: result.success ? 'warning.main' : 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <i className={result.success ? 'tabler-plug-off' : 'tabler-x'} style={{ fontSize: 24 }} />
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" color={result.success ? 'warning.dark' : 'error.dark'}>
              {result.success ? 'Désactivation réussie' : 'Échec de la désactivation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {moduleName} v{moduleVersion} → {tenantName}
            </Typography>
          </Grid>
          {result.duration && (
            <Grid item>
              <Chip
                icon={<i className="tabler-clock" />}
                label={deactivationService.formatDuration(result.duration)}
                size="small"
                variant="outlined"
              />
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Message d'erreur si échec */}
      {!result.success && result.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Erreur</Typography>
          <Typography variant="body2">{result.error}</Typography>
        </Alert>
      )}

      {/* Informations générales */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className="tabler-info-circle" />
          Informations générales
        </Typography>
        <Divider sx={{ my: 1 }} />
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Module</Typography>
            <Typography variant="body2" fontWeight="medium">{moduleName}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Version</Typography>
            <Typography variant="body2" fontWeight="medium">{moduleVersion}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Tenant</Typography>
            <Typography variant="body2" fontWeight="medium">{tenantName}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="caption" color="text.secondary">Date</Typography>
            <Typography variant="body2" fontWeight="medium">
              {formatDate(result.deactivatedAt)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Backup créé */}
      {result.backupPath && (
        <Alert severity="info" sx={{ mb: 2 }} icon={<i className="tabler-archive" />}>
          <Typography variant="subtitle2">Backup créé</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            {result.backupPath}
          </Typography>
        </Alert>
      )}

      {/* Statistiques des étapes */}
      {!compact && result.steps.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-chart-bar" />
            Statistiques
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="primary">{stats.total}</Typography>
                <Typography variant="caption" color="text.secondary">Étapes totales</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">{stats.completed}</Typography>
                <Typography variant="caption" color="text.secondary">Réussies</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main">{stats.failed}</Typography>
                <Typography variant="caption" color="text.secondary">Échouées</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h4" color="warning.main">{stats.rolledBack}</Typography>
                <Typography variant="caption" color="text.secondary">Rollback</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Détails des opérations */}
      {!compact && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-list-details" />
            Détails des opérations
          </Typography>
          <Divider sx={{ my: 1 }} />
          <List dense disablePadding>
            {stats.backup && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-archive" style={{ color: stats.backup.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Backup"
                  secondary={stats.backup.path ? `Sauvegardé: ${stats.backup.path}` : 'Backup créé'}
                />
                <Chip
                  label={stats.backup.status}
                  size="small"
                  color={stats.backup.status === 'completed' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            )}
            {stats.migrations && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-database-off" style={{ color: stats.migrations.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Rollback Migrations"
                  secondary={`${stats.migrations.count} migration(s) annulée(s)`}
                />
                <Chip
                  label={stats.migrations.status}
                  size="small"
                  color={stats.migrations.status === 'completed' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            )}
            {stats.storage && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-cloud-off" style={{ color: stats.storage.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Nettoyage S3"
                  secondary={`${stats.storage.filesDeleted} fichier(s)/dossier(s) supprimé(s)`}
                />
                <Chip
                  label={stats.storage.status}
                  size="small"
                  color={stats.storage.status === 'completed' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            )}
            {stats.database && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-database-export" style={{ color: stats.database.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Base de données"
                  secondary="Enregistrement mis à jour"
                />
                <Chip
                  label={stats.database.status}
                  size="small"
                  color={stats.database.status === 'completed' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      )}

      {/* Liste complète des étapes Saga */}
      {result.steps.length > 0 && (
        <Accordion defaultExpanded={!compact}>
          <AccordionSummary expandIcon={<i className="tabler-chevron-down" />}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i className="tabler-list-check" />
              Étapes d&apos;exécution ({result.steps.length})
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <SagaStepsList
              steps={result.steps}
              showDuration
              showSummary={!compact}
              sideBySideRollback={!result.success}
            />
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
}
