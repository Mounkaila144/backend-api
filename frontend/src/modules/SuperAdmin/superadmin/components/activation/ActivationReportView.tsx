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

import type { ActivationResult, SagaStep } from '../../../types/activation.types';
import { SagaStepsList, getSagaStepsStats } from './SagaStepsList';
import { activationService } from '../../services/activationService';

/**
 * Props du composant ActivationReportView
 */
interface ActivationReportViewProps {

  /** Résultat de l'activation */
  result: ActivationResult;

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
  const migrationStep = steps.find(s => s.name.toLowerCase().includes('migration'));
  const s3Step = steps.find(s => s.name.toLowerCase().includes('s3') || s.name.toLowerCase().includes('storage'));
  const configStep = steps.find(s => s.name.toLowerCase().includes('config'));
  const dbStep = steps.find(s => s.name.toLowerCase().includes('database') || s.name.toLowerCase().includes('db'));

  return {
    ...stats,
    migrations: migrationStep ? {
      status: migrationStep.status,
      count: migrationStep.metadata?.count || 0,
      duration: migrationStep.duration,
    } : null,
    storage: s3Step ? {
      status: s3Step.status,
      filesCreated: s3Step.metadata?.filesCreated || 0,
      duration: s3Step.duration,
    } : null,
    config: configStep ? {
      status: configStep.status,
      duration: configStep.duration,
    } : null,
    database: dbStep ? {
      status: dbStep.status,
      duration: dbStep.duration,
    } : null,
  };
}

/**
 * Composant d'affichage détaillé du rapport d'activation
 * Conforme à Story 3.8 - affiche toutes les informations de l'activation
 *
 * @example
 * ```tsx
 * <ActivationReportView
 *   result={activationResult}
 *   moduleName="Customer"
 *   moduleVersion="1.0.0"
 *   tenantName="example.com"
 * />
 * ```
 */
export function ActivationReportView({
  result,
  moduleName,
  moduleVersion,
  tenantName,
  compact = false,
}: ActivationReportViewProps) {
  const stats = getDetailedStats(result.steps);

  return (
    <Box>
      {/* En-tête du rapport */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: result.success ? 'success.light' : 'error.light' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: result.success ? 'success.main' : 'error.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <i className={result.success ? 'tabler-check' : 'tabler-x'} style={{ fontSize: 24 }} />
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" color={result.success ? 'success.dark' : 'error.dark'}>
              {result.success ? 'Activation réussie' : 'Échec de l\'activation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {moduleName} v{moduleVersion} → {tenantName}
            </Typography>
          </Grid>
          {result.duration && (
            <Grid item>
              <Chip
                icon={<i className="tabler-clock" />}
                label={activationService.formatDuration(result.duration)}
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
              {formatDate(result.activatedAt)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

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
            {stats.migrations && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-database" style={{ color: stats.migrations.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Migrations"
                  secondary={`${stats.migrations.count} migration(s) exécutée(s)`}
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
                  <i className="tabler-cloud" style={{ color: stats.storage.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Structure S3"
                  secondary={`${stats.storage.filesCreated} fichier(s)/dossier(s) créé(s)`}
                />
                <Chip
                  label={stats.storage.status}
                  size="small"
                  color={stats.storage.status === 'completed' ? 'success' : 'error'}
                  variant="outlined"
                />
              </ListItem>
            )}
            {stats.config && (
              <ListItem>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <i className="tabler-settings" style={{ color: stats.config.status === 'completed' ? '#4caf50' : '#f44336' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Configuration"
                  secondary="Fichier de configuration généré"
                />
                <Chip
                  label={stats.config.status}
                  size="small"
                  color={stats.config.status === 'completed' ? 'success' : 'error'}
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
                  secondary="Enregistrement créé"
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

      {/* Avertissements */}
      {result.warnings && result.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Avertissements</Typography>
          <List dense disablePadding>
            {result.warnings.map((warning, index) => (
              <ListItem key={index} disablePadding>
                <ListItemText primary={warning} />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}
    </Box>
  );
}
