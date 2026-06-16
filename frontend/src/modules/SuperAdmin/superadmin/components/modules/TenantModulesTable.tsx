'use client';

import React, { useMemo } from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import {
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Box,
  Stack,
  Typography,
  Checkbox,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

import { DataTable, StandardMobileCard } from '@/components/shared/DataTable';
import type { DataTableConfig } from '@/components/shared/DataTable';
import type { TenantModule } from '../../../types/module.types';

/**
 * Props du composant TenantModulesTable
 */
interface TenantModulesTableProps {

  /** Liste des modules à afficher */
  modules: TenantModule[];

  /** Indique si les données sont en cours de chargement */
  loading?: boolean;

  /** Callback appelé lors du clic sur "Activer" */
  onActivate?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Désactiver" */
  onDeactivate?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Configurer" */
  onConfigure?: (module: TenantModule) => void;

  /** Callback appelé lors du clic sur "Voir détails" */
  onViewDetails?: (module: TenantModule) => void;

  /** Mode sélection batch activé */
  batchMode?: boolean;

  /** Modules sélectionnés */
  selectedModules?: Set<string>;

  /** Callback pour toggle la sélection */
  onToggleSelection?: (moduleName: string) => void;

  /** Type de tableau (actifs ou disponibles) */
  variant?: 'active' | 'available';

  /** Message si aucun module */
  emptyMessage?: string;
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
 * Obtenir le label traduit de la catégorie
 */
const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'core':
      return 'Coeur';
    case 'business':
      return 'Métier';
    case 'integration':
      return 'Intégration';
    case 'ui':
      return 'Interface';
    case 'utility':
      return 'Utilitaire';
    default:
      return category;
  }
};

/**
 * Formater la date d'installation
 */
const formatInstalledDate = (dateString: string | null): string => {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);

    
return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Error formatting date:', error);
    
return '-';
  }
};

/**
 * Composant tableau de modules tenant avec recherche et pagination
 * Support responsive avec vue carte sur mobile
 */
export function TenantModulesTable({
  modules,
  loading = false,
  onActivate,
  onDeactivate,
  onConfigure,
  onViewDetails,
  batchMode = false,
  selectedModules = new Set(),
  onToggleSelection,
  variant = 'available',
  emptyMessage = 'Aucun module trouvé',
}: TenantModulesTableProps) {
  // Définition des colonnes
  const columns = useMemo<ColumnDef<TenantModule>[]>(() => {
    const cols: ColumnDef<TenantModule>[] = [];

    // Colonne de sélection batch
    if (batchMode && onToggleSelection) {
      cols.push({
        id: 'select',
        header: () => null,
        cell: ({ row }) => (
          <Checkbox
            checked={selectedModules.has(row.original.name)}
            onChange={() => onToggleSelection(row.original.name)}
            color={variant === 'active' ? 'error' : 'primary'}
            onClick={(e) => e.stopPropagation()}
          />
        ),
        size: 50,
      });
    }

    // Colonnes principales
    cols.push(
      {
        id: 'name',
        accessorKey: 'displayName',
        header: 'Module',
        cell: ({ row }) => {
          const moduleData = row.original;
          const avatarContent = moduleData.icon || moduleData.displayName.charAt(0).toUpperCase();
          const isActive = moduleData.tenantStatus.isActive;

          return (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: isActive ? 'success.main' : 'grey.400',
                  width: 40,
                  height: 40,
                }}
              >
                {avatarContent}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {moduleData.displayName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {moduleData.name}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: 'Catégorie',
        cell: ({ row }) => (
          <Chip
            label={getCategoryLabel(row.original.category)}
            color={getCategoryColor(row.original.category)}
            size="small"
            variant="tonal"
          />
        ),
      },
      {
        id: 'version',
        accessorKey: 'version',
        header: 'Version',
        cell: ({ row }) => {
          const moduleVersion = row.original.version;
          const installedVersion = row.original.tenantStatus?.installedVersion;
          const displayVersion = installedVersion || moduleVersion;

          return (
            <Stack spacing={0}>
              <Typography variant="body2" fontFamily="monospace">
                v{displayVersion}
              </Typography>
              {installedVersion && installedVersion !== moduleVersion && (
                <Typography variant="caption" color="text.secondary">
                  (base: {moduleVersion})
                </Typography>
              )}
            </Stack>
          );
        },
      },
      {
        id: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const isActive = row.original.tenantStatus.isActive;
          const hasConfig = Object.keys(row.original.tenantStatus.config || {}).length > 0;

          return (
            <Stack direction="row" spacing={0.5} flexWrap="wrap">
              <Chip
                label={isActive ? 'Actif' : 'Disponible'}
                color={isActive ? 'success' : 'default'}
                size="small"
                variant={isActive ? 'tonal' : 'outlined'}
              />
              {isActive && hasConfig && (
                <Chip
                  label="Configuré"
                  color="info"
                  size="small"
                  variant="tonal"
                />
              )}
            </Stack>
          );
        },
      },
      {
        id: 'dependencies',
        accessorKey: 'dependencies',
        header: 'Dépendances',
        cell: ({ getValue }) => {
          const deps = getValue() as string[];

          
return deps.length > 0 ? (
            <Chip
              label={`${deps.length} dép.`}
              color="info"
              size="small"
              variant="tonal"
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Aucune
            </Typography>
          );
        },
      }
    );

    // Colonne date d'installation (uniquement pour les modules actifs)
    if (variant === 'active') {
      cols.push({
        id: 'installedAt',
        header: 'Installé',
        cell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {formatInstalledDate(row.original.tenantStatus.installedAt)}
          </Typography>
        ),
      });
    }

    // Colonne actions
    cols.push({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const moduleData = row.original;
        const isActive = moduleData.tenantStatus.isActive;

        // En mode batch, pas d'actions individuelles
        if (batchMode) {
          return null;
        }

        return (
          <Stack direction="row" spacing={0.5}>
            {onViewDetails && (
              <Tooltip title="Voir les détails">
                <IconButton
                  size="small"
                  color="default"
                  onClick={() => onViewDetails(moduleData)}
                >
                  <i className="ri-eye-line" />
                </IconButton>
              </Tooltip>
            )}

            {!isActive && onActivate && (
              <Tooltip title="Activer ce module">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => onActivate(moduleData)}
                >
                  <i className="ri-play-circle-line" />
                </IconButton>
              </Tooltip>
            )}

            {isActive && (
              <>
                {moduleData.hasConfig && onConfigure && (
                  <Tooltip title="Configurer">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onConfigure(moduleData)}
                    >
                      <i className="ri-settings-3-line" />
                    </IconButton>
                  </Tooltip>
                )}

                {onDeactivate && (
                  <Tooltip title="Désactiver ce module">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onDeactivate(moduleData)}
                    >
                      <i className="ri-stop-circle-line" />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Stack>
        );
      },
    });

    return cols;
  }, [batchMode, selectedModules, onToggleSelection, variant, onActivate, onDeactivate, onConfigure, onViewDetails]);

  // Configuration du DataTable
  const tableConfig: DataTableConfig<TenantModule> = {
    columns,
    data: modules,
    loading,
    searchPlaceholder: 'Rechercher un module...',
    emptyMessage,
    rowsPerPageOptions: [10, 25, 50],
    pagination: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: modules.length,
    },

    // Configuration de la carte mobile responsive
    mobileCard: {
      renderCard: (module) => {
        const avatarContent = module.icon || module.displayName.charAt(0).toUpperCase();
        const depsCount = module.dependencies.length;
        const isActive = module.tenantStatus.isActive;
        const hasConfig = Object.keys(module.tenantStatus.config || {}).length > 0;

        return (
          <Box sx={{ position: 'relative' }}>
            {/* Checkbox en mode batch */}
            {batchMode && onToggleSelection && (
              <Checkbox
                checked={selectedModules.has(module.name)}
                onChange={() => onToggleSelection(module.name)}
                color={variant === 'active' ? 'error' : 'primary'}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              />
            )}

            <StandardMobileCard
              avatar={
                <Avatar
                  sx={{
                    bgcolor: isActive ? 'success.main' : 'grey.400',
                    width: 50,
                    height: 50,
                    fontSize: '1.25rem',
                  }}
                >
                  {avatarContent}
                </Avatar>
              }
              title={module.displayName}
              subtitle={`${module.name} • v${module.tenantStatus?.installedVersion || module.version}`}
              status={{
                label: isActive ? 'Actif' : 'Disponible',
                color: isActive ? 'success' : 'secondary',
              }}
              fields={[
                {
                  icon: 'ri-price-tag-3-line',
                  label: 'Catégorie',
                  value: (
                    <Chip
                      label={getCategoryLabel(module.category)}
                      color={getCategoryColor(module.category)}
                      size="small"
                      variant="tonal"
                    />
                  ),
                },
                depsCount > 0
                  ? {
                      icon: 'ri-links-line',
                      label: 'Dépendances',
                      value: (
                        <Chip
                          label={`${depsCount} module${depsCount > 1 ? 's' : ''}`}
                          color="info"
                          size="small"
                          variant="tonal"
                        />
                      ),
                    }
                  : { icon: '', value: '', hidden: true },
                isActive && hasConfig
                  ? {
                      icon: 'ri-settings-3-line',
                      value: (
                        <Chip
                          label="Configuré"
                          color="info"
                          size="small"
                          variant="tonal"
                        />
                      ),
                    }
                  : { icon: '', value: '', hidden: true },
                isActive && module.tenantStatus.installedAt
                  ? {
                      icon: 'ri-calendar-check-line',
                      label: 'Installé',
                      value: formatInstalledDate(module.tenantStatus.installedAt),
                    }
                  : { icon: '', value: '', hidden: true },
                {
                  icon: 'ri-file-text-line',
                  value: (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {module.description}
                    </Typography>
                  ),
                },
              ]}
              actions={
                batchMode
                  ? []
                  : [
                      ...(onViewDetails
                        ? [
                            {
                              icon: 'ri-eye-line',
                              color: 'default' as const,
                              onClick: () => onViewDetails(module),
                            },
                          ]
                        : []),
                      ...(!isActive && onActivate
                        ? [
                            {
                              icon: 'ri-play-circle-line',
                              color: 'success' as const,
                              onClick: () => onActivate(module),
                            },
                          ]
                        : []),
                      ...(isActive && module.hasConfig && onConfigure
                        ? [
                            {
                              icon: 'ri-settings-3-line',
                              color: 'primary' as const,
                              onClick: () => onConfigure(module),
                            },
                          ]
                        : []),
                      ...(isActive && onDeactivate
                        ? [
                            {
                              icon: 'ri-stop-circle-line',
                              color: 'error' as const,
                              onClick: () => onDeactivate(module),
                            },
                          ]
                        : []),
                    ]
              }
              item={module}
            />
          </Box>
        );
      },
    },
  };

  return <DataTable {...tableConfig} />;
}
