'use client';

import { useState, useEffect, useCallback } from 'react';

import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  InputAdornment,
  Badge,
  type SelectChangeEvent,
} from '@mui/material';

import { useDebounce } from '@/hooks/useDebounce';
import type { ModuleCategory } from '../../../types/module.types';
import type { ModuleFilters as IModuleFilters } from '../../utils/moduleFilters';
import { defaultFilters, countActiveFilters } from '../../utils/moduleFilters';

/**
 * Props du composant ModuleFilters
 */
interface ModuleFiltersProps {

  /** Callback appelé quand les filtres changent */
  onFilterChange: (filters: IModuleFilters) => void;

  /** Afficher le filtre de statut tenant (pour la page tenant) */
  showTenantFilter?: boolean;

  /** Valeurs initiales des filtres */
  initialFilters?: Partial<IModuleFilters>;
}

/**
 * Composant de filtres pour les modules
 * Utilisé dans ModulesPage et TenantModulesView
 *
 * @example
 * ```tsx
 * <ModuleFilters
 *   onFilterChange={handleFilterChange}
 *   showTenantFilter={false}
 * />
 * ```
 */
export function ModuleFilters({
  onFilterChange,
  showTenantFilter = false,
  initialFilters = {},
}: ModuleFiltersProps) {
  // État local des filtres
  const [filters, setFilters] = useState<IModuleFilters>({
    ...defaultFilters,
    ...initialFilters,
  });

  // Debounce pour la recherche (300ms)
  const debouncedSearch = useDebounce(filters.search, 300);

  // Notifier le parent quand les filtres changent (avec debounce pour search)
  useEffect(() => {
    onFilterChange({
      ...filters,
      search: debouncedSearch,
    });
  }, [debouncedSearch, filters.category, filters.status, filters.tenantStatus, filters.hasDependencies, onFilterChange]);

  // Handler pour le changement de recherche
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  }, []);

  // Handler pour le changement de catégorie
  const handleCategoryChange = useCallback((e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({ ...prev, category: e.target.value as ModuleCategory | 'all' }));
  }, []);

  // Handler pour le changement de statut global
  const handleStatusChange = useCallback((e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({ ...prev, status: e.target.value as 'all' | 'enabled' | 'disabled' }));
  }, []);

  // Handler pour le changement de statut tenant
  const handleTenantStatusChange = useCallback((e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({ ...prev, tenantStatus: e.target.value as 'all' | 'active' | 'available' }));
  }, []);

  // Handler pour le changement de dépendances
  const handleDependenciesChange = useCallback((e: SelectChangeEvent<string>) => {
    setFilters((prev) => ({ ...prev, hasDependencies: e.target.value as 'all' | 'yes' | 'no' }));
  }, []);

  // Réinitialiser les filtres
  const handleReset = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Compter les filtres actifs
  const activeCount = countActiveFilters(filters);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ flexWrap: 'wrap', alignItems: { xs: 'stretch', sm: 'flex-start' } }}
      >
        {/* Recherche */}
        <TextField
          placeholder="Rechercher un module..."
          value={filters.search}
          onChange={handleSearchChange}
          sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 250 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className="tabler-search" />
              </InputAdornment>
            ),
          }}
        />

        {/* Catégorie */}
        <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel>Catégorie</InputLabel>
          <Select value={filters.category} onChange={handleCategoryChange} label="Catégorie">
            <MenuItem value="all">Toutes les catégories</MenuItem>
            <MenuItem value="core">Core</MenuItem>
            <MenuItem value="business">Business</MenuItem>
            <MenuItem value="integration">Intégration</MenuItem>
            <MenuItem value="ui">Interface</MenuItem>
            <MenuItem value="utility">Utilitaire</MenuItem>
          </Select>
        </FormControl>

        {/* Statut global */}
        <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel>Statut</InputLabel>
          <Select value={filters.status} onChange={handleStatusChange} label="Statut">
            <MenuItem value="all">Tous les statuts</MenuItem>
            <MenuItem value="enabled">Activés</MenuItem>
            <MenuItem value="disabled">Désactivés</MenuItem>
          </Select>
        </FormControl>

        {/* Statut tenant (conditionnel) */}
        {showTenantFilter && (
          <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
            <InputLabel>Statut tenant</InputLabel>
            <Select value={filters.tenantStatus || 'all'} onChange={handleTenantStatusChange} label="Statut tenant">
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="active">Actifs</MenuItem>
              <MenuItem value="available">Disponibles</MenuItem>
            </Select>
          </FormControl>
        )}

        {/* Dépendances */}
        <FormControl sx={{ minWidth: { xs: '100%', sm: 160 } }}>
          <InputLabel>Dépendances</InputLabel>
          <Select value={filters.hasDependencies} onChange={handleDependenciesChange} label="Dépendances">
            <MenuItem value="all">Tous</MenuItem>
            <MenuItem value="yes">Avec dépendances</MenuItem>
            <MenuItem value="no">Sans dépendances</MenuItem>
          </Select>
        </FormControl>

        {/* Bouton Reset */}
        <Badge badgeContent={activeCount} color="primary" sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={activeCount === 0}
            startIcon={<i className="tabler-filter-off" />}
            fullWidth
            sx={{ height: { xs: 56, sm: 'auto' } }}
          >
            Réinitialiser
          </Button>
        </Badge>
      </Stack>
    </Box>
  );
}
