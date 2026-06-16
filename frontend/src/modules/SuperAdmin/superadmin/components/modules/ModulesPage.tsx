'use client';

import React, { useState, useMemo, useEffect } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Grid,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';

import { useModules } from '../../hooks/useModules';
import { ModuleCard } from './ModuleCard';
import { ModulesTable } from './ModulesTable';
import { ModuleFilters } from './ModuleFilters';
import type { Module } from '../../../types/module.types';
import type { ModuleFilters as IModuleFilters } from '../../utils/moduleFilters';
import { filterModules, defaultFilters, filtersToQueryParams, queryParamsToFilters } from '../../utils/moduleFilters';

/**
 * Type de vue pour l'affichage des modules
 */
type ViewMode = 'grid' | 'table';

/**
 * Composant principal de la page de gestion des modules
 * Affiche la liste des modules avec recherche, filtres et deux modes de vue
 */
export function ModulesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // État des modules
  const { modules, loading, error, refresh } = useModules();

  // État local pour l'UI
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [filters, setFilters] = useState<IModuleFilters>(() => {
    // Restaurer les filtres depuis l'URL au chargement
    return searchParams ? queryParamsToFilters(searchParams) : defaultFilters;
  });

  // Synchroniser les filtres avec l'URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = filtersToQueryParams(filters);
      const queryString = new URLSearchParams(params).toString();
      const newUrl = queryString ? `?${queryString}` : window.location.pathname;

      router.replace(newUrl, { scroll: false });
    }
  }, [filters, router]);

  // Filtrage des modules avec la fonction utilitaire
  const filteredModules = useMemo(() => {
    return filterModules(modules, filters);
  }, [modules, filters]);

  // Handler pour le clic sur "Voir détails"
  const handleViewDetails = (module: Module) => {
    // TODO: Implémenter l'affichage des détails (modal ou navigation)
    console.log('View details for module:', module);
  };

  // Changement de vue
  const handleViewModeChange = (_event: React.SyntheticEvent, newValue: ViewMode) => {
    setViewMode(newValue);
  };

  // Loading state
  if (loading && modules.length === 0) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={refresh}>
            Réessayer
          </Button>
        }
      >
        Une erreur est survenue lors du chargement des modules. {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* En-tête de page */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestion des Modules
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Découvrez et gérez tous les modules disponibles dans le système
        </Typography>
      </Box>

      {/* Filtres */}
      <ModuleFilters onFilterChange={setFilters} initialFilters={filters} showTenantFilter={false} />

      {/* Compteur de résultats */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          {filteredModules.length} module{filteredModules.length > 1 ? 's' : ''} trouvé
          {filteredModules.length > 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Tabs pour changer de vue */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={viewMode} onChange={handleViewModeChange}>
          <Tab label="Vue Grille" value="grid" icon={<i className="tabler-layout-grid" />} iconPosition="start" />
          <Tab label="Vue Tableau" value="table" icon={<i className="tabler-table" />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Contenu selon le mode de vue */}
      {viewMode === 'grid' ? (

        // Vue en grille
        <Grid container spacing={3}>
          {filteredModules.map((module) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={module.name}>
              <ModuleCard module={module} onViewDetails={handleViewDetails} />
            </Grid>
          ))}
          {filteredModules.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">Aucun module trouvé avec les filtres sélectionnés.</Alert>
            </Grid>
          )}
        </Grid>
      ) : (

        // Vue en tableau
        <ModulesTable modules={filteredModules} loading={loading} onViewDetails={handleViewDetails} />
      )}
    </Box>
  );
}
