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
  Tooltip,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import type { TenantModule } from '../../../types/module.types';

/**
 * Props du composant TenantModuleCard
 */
interface TenantModuleCardProps {

  /** Module à afficher avec son statut tenant */
  module: TenantModule;

  /** Callback appelé lors du clic sur "Activer" */
  onActivate?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Désactiver" */
  onDeactivate?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Configurer" */
  onConfigure?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Voir détails" */
  onViewDetails?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur la carte (mode sélection) */
  onClick?: () => void;

  /** Si la carte est sélectionnée (mode batch) */
  selected?: boolean;
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
 * Formater la date d'installation
 */
const formatInstalledDate = (dateString: string | null): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    
return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    
return '';
  }
};

/**
 * Composant carte d'affichage d'un module pour un tenant
 * Affiche les actions conditionnelles selon le statut du module
 *
 * @example
 * ```tsx
 * <TenantModuleCard
 *   module={tenantModule}
 *   onActivate={(m) => console.log('Activate:', m)}
 *   onDeactivate={(m) => console.log('Deactivate:', m)}
 *   onConfigure={(m) => console.log('Configure:', m)}
 * />
 * ```
 */
export function TenantModuleCard({
  module,
  onActivate,
  onDeactivate,
  onConfigure,
  onViewDetails,
  onClick,
  selected = false,
}: TenantModuleCardProps) {
  const { tenantStatus } = module;
  const isActive = tenantStatus.isActive;
  const hasConfig = Object.keys(tenantStatus.config || {}).length > 0;

  // Icône ou première lettre du nom
  const avatarContent = module.icon || module.displayName.charAt(0).toUpperCase();

  return (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
        border: selected ? '2px solid' : isActive ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : isActive ? 'success.main' : 'divider',
        bgcolor: selected ? 'primary.light' : 'background.paper',
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        {/* En-tête avec Avatar */}
        <Stack direction="row" spacing={2} alignItems="center" mb={2}>
          <Avatar
            sx={{
              bgcolor: isActive ? 'success.main' : 'grey.400',
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
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={2}>
          <Chip
            label={module.category}
            color={getCategoryColor(module.category)}
            size="small"
          />
          <Chip
            label={isActive ? 'Actif' : 'Disponible'}
            color={isActive ? 'success' : 'default'}
            size="small"
            variant={isActive ? 'filled' : 'outlined'}
          />
          {isActive && hasConfig && (
            <Chip
              label="Configuré"
              color="info"
              size="small"
              icon={<i className="tabler-settings" style={{ fontSize: 16 }} />}
            />
          )}
        </Stack>

        {/* Informations supplémentaires */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            {module.dependencies.length > 0
              ? `${module.dependencies.length} dépendance${module.dependencies.length > 1 ? 's' : ''}`
              : 'Aucune dépendance'}
          </Typography>

          {isActive && tenantStatus.installedAt && (
            <Typography variant="caption" color="success.main" display="block" mt={0.5}>
              Installé {formatInstalledDate(tenantStatus.installedAt)}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Actions conditionnelles */}
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, gap: 1 }}>
        {onViewDetails && (
          <Tooltip title="Voir les détails">
            <Button size="small" variant="text" onClick={() => onViewDetails(module)}>
              Détails
            </Button>
          </Tooltip>
        )}

        {!isActive && onActivate && (
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => onActivate(module)}
            startIcon={<i className="tabler-plus" />}
          >
            Activer
          </Button>
        )}

        {isActive && (
          <>
            {module.hasConfig && onConfigure && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => onConfigure(module)}
                startIcon={<i className="tabler-settings" />}
              >
                Configurer
              </Button>
            )}

            {onDeactivate && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                onClick={() => onDeactivate(module)}
                startIcon={<i className="tabler-x" />}
              >
                Désactiver
              </Button>
            )}
          </>
        )}
      </CardActions>
    </Card>
  );
}
