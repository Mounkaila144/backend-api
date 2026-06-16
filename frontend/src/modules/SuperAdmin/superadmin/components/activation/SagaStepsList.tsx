'use client';

import React, { useMemo } from 'react';

import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
} from '@mui/material';

import type { SagaStep, SagaStepStatus } from '../../../types/activation.types';
import { activationService } from '../../services/activationService';

/**
 * Props du composant SagaStepsList
 */
interface SagaStepsListProps {

  /** Liste des étapes Saga à afficher */
  steps: SagaStep[];

  /** Afficher les durées d'exécution */
  showDuration?: boolean;

  /** Afficher le résumé statistique */
  showSummary?: boolean;

  /** Mode d'affichage côte-à-côte pour les rollbacks (si assez d'espace) */
  sideBySideRollback?: boolean;
}

/**
 * Statistiques des étapes Saga
 */
interface SagaStepsStats {
  total: number;
  completed: number;
  failed: number;
  rolledBack: number;
  pending: number;
  running: number;
}

/**
 * Obtient l'icône et la couleur selon le statut
 */
function getStepDisplay(status: SagaStepStatus): {
  icon: React.ReactNode;
  color: string;
  label: string;
} {
  switch (status) {
    case 'pending':
      return {
        icon: <i className="tabler-clock" style={{ fontSize: 20 }} />,
        color: '#9e9e9e', // gris
        label: 'En attente',
      };
    case 'running':
      return {
        icon: <CircularProgress size={20} />,
        color: '#2196f3', // bleu
        label: 'En cours',
      };
    case 'completed':
      return {
        icon: <i className="tabler-circle-check" style={{ fontSize: 20 }} />,
        color: '#4caf50', // vert
        label: 'Terminé',
      };
    case 'failed':
      return {
        icon: <i className="tabler-circle-x" style={{ fontSize: 20 }} />,
        color: '#f44336', // rouge
        label: 'Échec',
      };
    case 'rolled_back':
      return {
        icon: <i className="tabler-arrow-back-up" style={{ fontSize: 20 }} />,
        color: '#ff9800', // orange
        label: 'Annulé',
      };
    default:
      return {
        icon: <i className="tabler-circle" style={{ fontSize: 20 }} />,
        color: '#9e9e9e',
        label: 'Inconnu',
      };
  }
}

/**
 * Composant résumé des statistiques
 */
function StepsSummary({ stats }: { stats: SagaStepsStats }) {
  const hasRollback = stats.rolledBack > 0;
  const hasFailed = stats.failed > 0;

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Résumé de l&apos;exécution
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Box sx={{ textAlign: 'center', minWidth: 60 }}>
          <Typography variant="h6" color="success.main">
            {stats.completed}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Réussies
          </Typography>
        </Box>
        {hasFailed && (
          <Box sx={{ textAlign: 'center', minWidth: 60 }}>
            <Typography variant="h6" color="error.main">
              {stats.failed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Échouées
            </Typography>
          </Box>
        )}
        {hasRollback && (
          <Box sx={{ textAlign: 'center', minWidth: 60 }}>
            <Typography variant="h6" color="warning.main">
              {stats.rolledBack}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Annulées
            </Typography>
          </Box>
        )}
        {stats.pending > 0 && (
          <Box sx={{ textAlign: 'center', minWidth: 60 }}>
            <Typography variant="h6" color="text.secondary">
              {stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              En attente
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

/**
 * Composant qui affiche les étapes d'exécution d'un Saga
 * Utilisé dans le wizard d'activation pour montrer la progression en temps réel
 *
 * @example
 * ```tsx
 * <SagaStepsList
 *   steps={activationResult.steps}
 *   showDuration={true}
 *   showSummary={true}
 *   sideBySideRollback={true}
 * />
 * ```
 */
export function SagaStepsList({
  steps,
  showDuration = false,
  showSummary = false,
  sideBySideRollback = false,
}: SagaStepsListProps) {
  // Séparer les steps normaux et ceux qui ont été rolled back
  const normalSteps = steps.filter((s) => s.status !== 'rolled_back');
  const rolledBackSteps = steps.filter((s) => s.status === 'rolled_back');

  // Calculer les statistiques
  const stats = useMemo<SagaStepsStats>(() => {
    return {
      total: steps.length,
      completed: steps.filter((s) => s.status === 'completed').length,
      failed: steps.filter((s) => s.status === 'failed').length,
      rolledBack: steps.filter((s) => s.status === 'rolled_back').length,
      pending: steps.filter((s) => s.status === 'pending').length,
      running: steps.filter((s) => s.status === 'running').length,
    };
  }, [steps]);

  // Trouver l'étape qui a échoué (pour le contexte du rollback)
  const failedStep = steps.find((s) => s.status === 'failed');

  if (steps.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Aucune étape à afficher
        </Typography>
      </Box>
    );
  }

  // Rendu d'une liste de steps
  const renderStepsList = (stepsToRender: SagaStep[], title?: string) => (
    <List sx={{ py: 0 }}>
      {title && (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}
      {stepsToRender.map((step, index) => {
        const display = getStepDisplay(step.status);
        const duration = showDuration ? activationService.getStepDuration(step) : null;

        return (
          <ListItem
            key={index}
            sx={{
              borderLeft: `3px solid ${display.color}`,
              mb: 1,
              bgcolor: step.status === 'failed' ? 'error.lighter' : 'transparent',
              borderRadius: 1,
            }}
          >
            <ListItemIcon sx={{ color: display.color, minWidth: 40 }}>{display.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {step.name}
                  </Typography>
                  <Chip label={display.label} size="small" sx={{ bgcolor: display.color, color: 'white' }} />
                  {duration && (
                    <Typography variant="caption" color="text.secondary">
                      ({activationService.formatDuration(duration)})
                    </Typography>
                  )}
                </Box>
              }
              secondary={
                <>
                  {step.message && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {step.message}
                    </Typography>
                  )}
                  {step.error && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                      Erreur: {step.error}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );

  // Affichage côte-à-côte si rollback et option activée
  const shouldShowSideBySide = sideBySideRollback && rolledBackSteps.length > 0;

  return (
    <Box>
      {/* Résumé statistique */}
      {showSummary && stats.total > 0 && <StepsSummary stats={stats} />}

      {/* Affichage côte-à-côte ou normal */}
      {shouldShowSideBySide ? (
        <Grid container spacing={3}>
          {/* Colonne gauche: Étapes exécutées */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main' }}
              >
                <i className="tabler-list-check" />
                Étapes exécutées ({normalSteps.length})
              </Typography>
              {renderStepsList(normalSteps)}
            </Paper>
          </Grid>

          {/* Flèche centrale */}
          <Grid
            item
            xs={12}
            md="auto"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: 'warning.main',
              }}
            >
              <i className="tabler-arrow-right" style={{ fontSize: 32 }} />
              <Typography variant="caption" color="warning.main" sx={{ mt: 0.5 }}>
                Rollback
              </Typography>
            </Box>
          </Grid>

          {/* Colonne droite: Étapes annulées */}
          <Grid item xs={12} md={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                height: '100%',
                bgcolor: 'warning.lighter',
                borderColor: 'warning.main',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'warning.dark' }}
              >
                <i className="tabler-arrow-back-up" />
                Modifications annulées ({rolledBackSteps.length})
              </Typography>
              {failedStep && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Suite à l&apos;échec de : <strong>{failedStep.name}</strong>
                </Typography>
              )}
              {renderStepsList(rolledBackSteps)}
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <>
          {/* Steps normaux */}
          {renderStepsList(normalSteps)}

          {/* Section Rollback si applicable (affichage normal) */}
          {rolledBackSteps.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <i className="tabler-alert-triangle" />
                Modifications annulées ({rolledBackSteps.length})
              </Typography>
              {failedStep && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Suite à l&apos;échec de : <strong>{failedStep.name}</strong>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Les étapes suivantes ont été annulées pour maintenir la cohérence du système :
              </Typography>
              {renderStepsList(rolledBackSteps)}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

/**
 * Exporter les statistiques pour utilisation externe
 */
export function getSagaStepsStats(steps: SagaStep[]): SagaStepsStats {
  return {
    total: steps.length,
    completed: steps.filter((s) => s.status === 'completed').length,
    failed: steps.filter((s) => s.status === 'failed').length,
    rolledBack: steps.filter((s) => s.status === 'rolled_back').length,
    pending: steps.filter((s) => s.status === 'pending').length,
    running: steps.filter((s) => s.status === 'running').length,
  };
}
