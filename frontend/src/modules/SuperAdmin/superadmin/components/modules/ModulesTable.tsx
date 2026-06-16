'use client';

import React, { useMemo } from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import { Chip, Avatar, IconButton, Tooltip, Box, Stack, Typography } from '@mui/material';

import { DataTable, StandardMobileCard } from '@/components/shared/DataTable';
import type { DataTableConfig } from '@/components/shared/DataTable';
import type { Module } from '../../../types/module.types';

/**
 * Props du composant ModulesTable
 */
interface ModulesTableProps {

  /** Liste des modules à afficher */
  modules: Module[];

  /** Indique si les données sont en cours de chargement */
  loading?: boolean;

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
 * Composant tableau de modules avec recherche, tri et pagination
 * Support responsive avec vue carte sur mobile
 *
 * @example
 * ```tsx
 * <ModulesTable
 *   modules={modules}
 *   loading={loading}
 *   onViewDetails={(module) => console.log(module)}
 * />
 * ```
 */
export function ModulesTable({ modules, loading = false, onViewDetails }: ModulesTableProps) {
  // Définition des colonnes
  const columns = useMemo<ColumnDef<Module>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'displayName',
        header: 'Nom',
        cell: ({ row }) => {
          const moduleData = row.original;
          const avatarContent = moduleData.icon || moduleData.displayName.charAt(0).toUpperCase();

          return (
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: moduleData.enabled ? 'primary.main' : 'grey.400',
                  width: 36,
                  height: 36,
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
        cell: ({ getValue }) => (
          <Typography variant="body2" fontFamily="monospace">
            v{getValue() as string}
          </Typography>
        ),
      },
      {
        id: 'status',
        accessorKey: 'enabled',
        header: 'Statut',
        cell: ({ getValue }) => {
          const enabled = getValue() as boolean;

          
return (
            <Chip
              label={enabled ? 'Activé' : 'Désactivé'}
              color={enabled ? 'success' : 'default'}
              size="small"
              variant={enabled ? 'tonal' : 'outlined'}
            />
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
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Tooltip title="Voir les détails">
            <IconButton
              size="small"
              color="primary"
              onClick={() => onViewDetails?.(row.original)}
            >
              <i className="ri-eye-line" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [onViewDetails]
  );

  // Configuration du DataTable
  const tableConfig: DataTableConfig<Module> = {
    columns,
    data: modules,
    loading,
    searchPlaceholder: 'Rechercher un module...',
    emptyMessage: 'Aucun module trouvé',
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

        return (
          <StandardMobileCard
            avatar={
              <Avatar
                sx={{
                  bgcolor: module.enabled ? 'primary.main' : 'grey.400',
                  width: 50,
                  height: 50,
                  fontSize: '1.25rem',
                }}
              >
                {avatarContent}
              </Avatar>
            }
            title={module.displayName}
            subtitle={module.name}
            status={{
              label: module.enabled ? 'Activé' : 'Désactivé',
              color: module.enabled ? 'success' : 'secondary',
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
              {
                icon: 'ri-git-branch-line',
                label: 'Version',
                value: `v${module.version}`,
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
              module.hasConfig
                ? {
                    icon: 'ri-settings-3-line',
                    value: (
                      <Chip
                        label="Configuration"
                        color="warning"
                        size="small"
                        variant="tonal"
                      />
                    ),
                  }
                : { icon: '', value: '', hidden: true },
              module.hasMigrations
                ? {
                    icon: 'ri-database-2-line',
                    value: (
                      <Chip
                        label="Migrations"
                        color="secondary"
                        size="small"
                        variant="tonal"
                      />
                    ),
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
            actions={[
              {
                icon: 'ri-eye-line',
                color: 'primary',
                onClick: () => onViewDetails?.(module),
              },
            ]}
            item={module}
          />
        );
      },
    },
  };

  return <DataTable {...tableConfig} />;
}
