'use client';

import React from 'react';

import {
  Alert,
  AlertTitle,
  Box,
  Typography,
  CircularProgress,
  Collapse,
  Chip,
} from '@mui/material';

import type { TestResult } from '../../../types/service-config.types';

/**
 * Props du composant TestResultAlert
 */
interface TestResultAlertProps {

  /** Résultat du test de connexion */
  result: TestResult | null;

  /** Indique si le test est en cours */
  isLoading?: boolean;
}

/**
 * Formate la latence en ms de façon lisible
 */
function formatLatency(latencyMs?: number): string {
  if (latencyMs === undefined) return '';
  if (latencyMs < 1000) return `${Math.round(latencyMs)} ms`;
  
return `${(latencyMs / 1000).toFixed(2)} s`;
}

/**
 * Formate la date du test
 */
function formatCheckedAt(isoDate: string): string {
  try {
    const date = new Date(isoDate);

    
return date.toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return isoDate;
  }
}

/**
 * Composant affichant le résultat d'un test de connexion
 * Affiche une alerte success si healthy, error sinon
 *
 * @example
 * ```tsx
 * <TestResultAlert
 *   result={testResult}
 *   isLoading={isTesting}
 * />
 * ```
 */
export function TestResultAlert({ result, isLoading = false }: TestResultAlertProps) {
  // Afficher un loader pendant le test
  if (isLoading) {
    return (
      <Alert
        severity="info"
        icon={<CircularProgress size={20} />}
        sx={{ mt: 2 }}
      >
        Test de connexion en cours...
      </Alert>
    );
  }

  // Ne rien afficher si pas de résultat
  if (!result) {
    return null;
  }

  const severity = result.healthy ? 'success' : 'error';

  const icon = result.healthy ? (
    <i className="tabler-circle-check" style={{ fontSize: 20 }} />
  ) : (
    <i className="tabler-circle-x" style={{ fontSize: 20 }} />
  );

  return (
    <Collapse in={!!result}>
      <Alert
        severity={severity}
        icon={icon}
        sx={{ mt: 2 }}
      >
        <AlertTitle sx={{ fontWeight: 'bold' }}>
          {result.healthy ? 'Connexion réussie' : 'Échec de connexion'}
        </AlertTitle>

        <Typography variant="body2" sx={{ mb: 1 }}>
          {result.message}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
          {/* Statut */}
          <Chip
            label={result.status}
            size="small"
            color={result.healthy ? 'success' : 'error'}
            variant="outlined"
          />

          {/* Latence */}
          {result.latency_ms !== undefined && (
            <Chip
              icon={<i className="tabler-clock" style={{ fontSize: 14 }} />}
              label={formatLatency(result.latency_ms)}
              size="small"
              variant="outlined"
            />
          )}

          {/* Date du test */}
          <Typography variant="caption" color="text.secondary">
            Testé le {formatCheckedAt(result.checked_at)}
          </Typography>
        </Box>

        {/* Détails supplémentaires si disponibles */}
        {result.details && Object.keys(result.details).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Détails :
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'action.hover',
                p: 1,
                borderRadius: 1,
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: 150,
              }}
            >
              {JSON.stringify(result.details, null, 2)}
            </Box>
          </Box>
        )}
      </Alert>
    </Collapse>
  );
}
