'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';

import type { ModuleStats } from '../../../types/health.types';

/**
 * Props du composant ModuleUsageChart
 */
interface ModuleUsageChartProps {

  /** Statistiques des modules */
  moduleStats: ModuleStats[];

  /** Afficher en mode compact */
  compact?: boolean;
}

/**
 * Obtenir la couleur selon le taux d'adoption
 */
function getAdoptionColor(rate: number): 'success' | 'warning' | 'error' | 'info' {
  if (rate >= 70) return 'success';
  if (rate >= 40) return 'info';
  if (rate >= 20) return 'warning';
  
return 'error';
}

/**
 * Obtenir la couleur de la catégorie
 */
function getCategoryColor(category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' {
  switch (category) {
    case 'core':
      return 'primary';
    case 'business':
      return 'success';
    case 'integration':
      return 'info';
    case 'ui':
      return 'secondary';
    case 'utility':
      return 'warning';
    default:
      return 'primary';
  }
}

/**
 * Graphique d'utilisation des modules
 * Affiche le taux d'adoption de chaque module
 * Conforme à l'Epic 6 - Dashboard Santé Globale UI
 *
 * @example
 * ```tsx
 * <ModuleUsageChart moduleStats={health.moduleStats} />
 * ```
 */
export function ModuleUsageChart({ moduleStats, compact = false }: ModuleUsageChartProps) {
  // Trier par taux d'adoption décroissant
  const sortedModules = [...moduleStats].sort((a, b) => b.adoptionRate - a.adoptionRate);

  // En mode compact, limiter à 5 modules
  const displayModules = compact ? sortedModules.slice(0, 5) : sortedModules;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="tabler-chart-bar" />
            <Typography variant="h6">Utilisation des modules</Typography>
          </Box>
        }
        subheader={`${moduleStats.length} modules disponibles`}
      />
      <CardContent>
        {displayModules.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Aucun module disponible
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {displayModules.map((module) => (
              <Box key={module.name}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {module.displayName}
                    </Typography>
                    <Chip
                      label={module.category}
                      size="small"
                      color={getCategoryColor(module.category)}
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {module.activeCount} tenant(s)
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={`${getAdoptionColor(module.adoptionRate)}.main`}
                    >
                      {module.adoptionRate}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={module.adoptionRate}
                  color={getAdoptionColor(module.adoptionRate)}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        )}

        {compact && sortedModules.length > 5 && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2, textAlign: 'center' }}
          >
            +{sortedModules.length - 5} autres modules
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
