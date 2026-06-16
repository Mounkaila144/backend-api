'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Avatar,
  Button,
  Box,
  Stack,
} from '@mui/material';

import type { Module } from '../../../types/module.types';

/**
 * Props du composant ModuleCard
 */
interface ModuleCardProps {

  /** Module à afficher */
  module: Module;

  /** Callback appelé lors du clic sur "Voir détails" */
  onViewDetails?: (module: Module) => void;
}

/**
 * Obtenir la couleur du chip selon la catégorie
 */
const getCategoryColor = (category: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
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
};

/**
 * Tronquer une chaîne à une longueur maximale
 */
const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  
return text.slice(0, maxLength) + '...';
};

/**
 * Composant carte d'affichage d'un module
 *
 * @example
 * ```tsx
 * <ModuleCard
 *   module={module}
 *   onViewDetails={(m) => console.log('Details:', m)}
 * />
 * ```
 */
export function ModuleCard({ module, onViewDetails }: ModuleCardProps) {
  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(module);
    }
  };

  // Icône ou première lettre du nom
  const avatarContent = module.icon || module.displayName.charAt(0).toUpperCase();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* En-tête avec Avatar */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: module.enabled ? 'primary.main' : 'grey.400',
              width: 48,
              height: 48,
            }}
          >
            {avatarContent}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h6" component="h3" gutterBottom>
              {module.displayName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v{module.version}
            </Typography>
          </Box>
        </Stack>

        {/* Description */}
        <Typography variant="body2" color="text.secondary" mb={2} minHeight={60}>
          {truncate(module.description, 100)}
        </Typography>

        {/* Badges */}
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Chip
            label={module.category}
            color={getCategoryColor(module.category)}
            size="small"
          />
          <Chip
            label={module.enabled ? 'Activé' : 'Désactivé'}
            color={module.enabled ? 'success' : 'default'}
            size="small"
            variant={module.enabled ? 'filled' : 'outlined'}
          />
        </Stack>

        {/* Informations supplémentaires */}
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            {module.dependencies.length > 0
              ? `${module.dependencies.length} dépendance${module.dependencies.length > 1 ? 's' : ''}`
              : 'Aucune dépendance'}
          </Typography>
        </Box>
      </CardContent>

      {/* Actions */}
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button size="small" variant="outlined" onClick={handleViewDetails}>
          Voir détails
        </Button>
      </CardActions>
    </Card>
  );
}
