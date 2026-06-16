'use client';

import React, { useState, useMemo } from 'react';

import {
  Box,
  Typography,
  Skeleton,
  Alert,
  Button,
  Stack,
  Divider,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';

import { useTenantModules } from '../../hooks/useTenantModules';
import { TenantModulesTable } from './TenantModulesTable';
import { ModuleFilters } from './ModuleFilters';
import { ActivationWizard } from '../activation/ActivationWizard';
import { BatchActivationWizard } from '../activation/BatchActivationWizard';
import { DeactivationWizard } from '../deactivation/DeactivationWizard';
import { BatchDeactivationWizard } from '../deactivation/BatchDeactivationWizard';
import type { TenantModule } from '../../../types/module.types';
import type { ModuleFilters as IModuleFilters } from '../../utils/moduleFilters';
import { filterModules, defaultFilters } from '../../utils/moduleFilters';

/**
 * Props du composant TenantModulesView
 */
interface TenantModulesViewProps {

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant (pour l'affichage) */
  tenantName: string;
}

/**
 * Composant principal pour afficher et gérer les modules d'un tenant
 * Sépare les modules actifs et disponibles en deux sections
 *
 * @example
 * ```tsx
 * <TenantModulesView
 *   tenantId={123}
 *   tenantName="example.com"
 * />
 * ```
 */
export function TenantModulesView({ tenantId, tenantName }: TenantModulesViewProps) {
  // État des modules
  const { modules, loading, error, refresh } = useTenantModules(tenantId);

  // État local pour les filtres
  const [filters, setFilters] = useState<IModuleFilters>(defaultFilters);

  // État pour le wizard d'activation
  const [activationWizard, setActivationWizard] = useState<{
    open: boolean;
    module: TenantModule | null;
  }>({
    open: false,
    module: null,
  });

  // État pour le wizard de désactivation
  const [deactivationWizard, setDeactivationWizard] = useState<{
    open: boolean;
    module: TenantModule | null;
  }>({
    open: false,
    module: null,
  });

  // État pour le mode sélection batch
  const [batchMode, setBatchMode] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());

  // État pour le wizard d'activation batch
  const [batchActivationWizard, setBatchActivationWizard] = useState(false);

  // État pour le mode sélection batch désactivation
  const [batchDeactivationMode, setBatchDeactivationMode] = useState(false);
  const [selectedForDeactivation, setSelectedForDeactivation] = useState<Set<string>>(new Set());

  // État pour le wizard de désactivation batch
  const [batchDeactivationWizard, setBatchDeactivationWizard] = useState(false);

  // Filtrage des modules avec la fonction utilitaire
  const filteredModules = useMemo(() => {
    return filterModules(modules, filters);
  }, [modules, filters]);

  // Séparation modules actifs / disponibles (après filtrage)
  const activeModules = useMemo(
    () => filteredModules.filter((m) => m.tenantStatus.isActive),
    [filteredModules]
  );

  const availableModules = useMemo(
    () => filteredModules.filter((m) => !m.tenantStatus.isActive),
    [filteredModules]
  );

  // Handlers pour les actions
  const handleActivate = (module: TenantModule) => {
    setActivationWizard({ open: true, module });
  };

  const handleDeactivate = (module: TenantModule) => {
    setDeactivationWizard({ open: true, module });
  };

  const handleConfigure = (module: TenantModule) => {
    console.log('Configuration à venir:', module.name);

    // TODO: Implémenter configuration
    alert(`Configuration du module "${module.displayName}" à venir`);
  };

  const handleViewDetails = (module: TenantModule) => {
    console.log('Détails du module:', module);

    // TODO: Ouvrir modal ou drawer avec détails
  };

  // Handlers pour le mode batch
  const toggleBatchMode = () => {
    setBatchMode(!batchMode);
    setSelectedForBatch(new Set());
  };

  const toggleModuleSelection = (moduleName: string) => {
    setSelectedForBatch((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }

      
return newSet;
    });
  };

  const selectAllAvailable = () => {
    const allNames = availableModules.map((m) => m.name);

    setSelectedForBatch(new Set(allNames));
  };

  const deselectAll = () => {
    setSelectedForBatch(new Set());
  };

  const handleBatchActivate = () => {
    setBatchActivationWizard(true);
  };

  // Modules sélectionnés pour le batch
  const selectedModulesForBatch = useMemo(
    () => availableModules.filter((m) => selectedForBatch.has(m.name)),
    [availableModules, selectedForBatch]
  );

  // Handlers pour le mode batch désactivation
  const toggleBatchDeactivationMode = () => {
    setBatchDeactivationMode(!batchDeactivationMode);
    setSelectedForDeactivation(new Set());
  };

  const toggleDeactivationSelection = (moduleName: string) => {
    setSelectedForDeactivation((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(moduleName)) {
        newSet.delete(moduleName);
      } else {
        newSet.add(moduleName);
      }

      
return newSet;
    });
  };

  const selectAllActive = () => {
    const allNames = activeModules.map((m) => m.name);

    setSelectedForDeactivation(new Set(allNames));
  };

  const deselectAllDeactivation = () => {
    setSelectedForDeactivation(new Set());
  };

  const handleBatchDeactivate = () => {
    setBatchDeactivationWizard(true);
  };

  // Modules sélectionnés pour la désactivation batch
  const selectedModulesForDeactivation = useMemo(
    () => activeModules.filter((m) => selectedForDeactivation.has(m.name)),
    [activeModules, selectedForDeactivation]
  );

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
      {/* En-tête */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Modules de {tenantName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gérez les modules actifs et disponibles pour ce site
        </Typography>
      </Box>

      {/* Filtres */}
      <ModuleFilters onFilterChange={setFilters} initialFilters={filters} showTenantFilter={true} />

      {/* Compteur de résultats */}
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary">
          {activeModules.length} module{activeModules.length > 1 ? 's' : ''} actif
          {activeModules.length > 1 ? 's' : ''}, {availableModules.length} disponible
          {availableModules.length > 1 ? 's' : ''}
        </Typography>
      </Box>

      {/* Section Modules Actifs */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            Modules Actifs
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${activeModules.length} module${activeModules.length > 1 ? 's' : ''}`}
              color="success"
              variant="outlined"
            />
            {activeModules.length > 1 && (
              <Tooltip title={batchDeactivationMode ? 'Annuler' : 'Désactiver plusieurs modules'}>
                <Button
                  size="small"
                  variant={batchDeactivationMode ? 'contained' : 'outlined'}
                  color="error"
                  onClick={toggleBatchDeactivationMode}
                  startIcon={<i className="ri-stack-line" />}
                >
                  {batchDeactivationMode ? 'Annuler' : 'Batch'}
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Barre d'actions batch désactivation */}
        {batchDeactivationMode && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'error.light' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="error.contrastText">
                  {selectedForDeactivation.size} module(s) sélectionné(s)
                </Typography>
                <Button size="small" variant="text" onClick={selectAllActive} sx={{ color: 'error.contrastText' }}>
                  Tout sélectionner
                </Button>
                {selectedForDeactivation.size > 0 && (
                  <Button size="small" variant="text" onClick={deselectAllDeactivation} sx={{ color: 'error.contrastText' }}>
                    Désélectionner
                  </Button>
                )}
              </Stack>
              <Button
                variant="contained"
                color="error"
                disabled={selectedForDeactivation.size === 0}
                onClick={handleBatchDeactivate}
                startIcon={<i className="ri-delete-bin-line" />}
              >
                Désactiver ({selectedForDeactivation.size})
              </Button>
            </Stack>
          </Paper>
        )}

        {activeModules.length === 0 ? (
          <Alert severity="info">
            {filters.search || filters.category !== 'all' || filters.status !== 'all'
              ? 'Aucun module actif ne correspond aux filtres sélectionnés.'
              : 'Aucun module activé pour ce tenant.'}
          </Alert>
        ) : (
          <TenantModulesTable
            modules={activeModules}
            loading={loading}
            onDeactivate={batchDeactivationMode ? undefined : handleDeactivate}
            onConfigure={handleConfigure}
            onViewDetails={handleViewDetails}
            batchMode={batchDeactivationMode}
            selectedModules={selectedForDeactivation}
            onToggleSelection={toggleDeactivationSelection}
            variant="active"
            emptyMessage="Aucun module actif"
          />
        )}
      </Paper>

      <Divider sx={{ my: 4 }} />

      {/* Section Modules Disponibles */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            Modules Disponibles
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={`${availableModules.length} module${availableModules.length > 1 ? 's' : ''}`}
              color="default"
              variant="outlined"
            />
            {availableModules.length > 1 && (
              <Tooltip title={batchMode ? 'Désactiver le mode batch' : 'Activer plusieurs modules'}>
                <Button
                  size="small"
                  variant={batchMode ? 'contained' : 'outlined'}
                  onClick={toggleBatchMode}
                  startIcon={<i className="ri-stack-line" />}
                >
                  {batchMode ? 'Annuler' : 'Batch'}
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        {/* Barre d'actions batch */}
        {batchMode && (
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <Typography variant="body2" color="primary.contrastText">
                  {selectedForBatch.size} module(s) sélectionné(s)
                </Typography>
                <Button size="small" variant="text" onClick={selectAllAvailable} sx={{ color: 'primary.contrastText' }}>
                  Tout sélectionner
                </Button>
                {selectedForBatch.size > 0 && (
                  <Button size="small" variant="text" onClick={deselectAll} sx={{ color: 'primary.contrastText' }}>
                    Désélectionner
                  </Button>
                )}
              </Stack>
              <Button
                variant="contained"
                color="success"
                disabled={selectedForBatch.size === 0}
                onClick={handleBatchActivate}
                startIcon={<i className="ri-play-circle-line" />}
              >
                Activer ({selectedForBatch.size})
              </Button>
            </Stack>
          </Paper>
        )}

        {availableModules.length === 0 ? (
          <Alert severity="info">
            {filters.search || filters.category !== 'all' || filters.status !== 'all'
              ? 'Aucun module disponible ne correspond aux filtres sélectionnés.'
              : 'Tous les modules sont déjà activés pour ce tenant.'}
          </Alert>
        ) : (
          <TenantModulesTable
            modules={availableModules}
            loading={loading}
            onActivate={batchMode ? undefined : handleActivate}
            onViewDetails={handleViewDetails}
            batchMode={batchMode}
            selectedModules={selectedForBatch}
            onToggleSelection={toggleModuleSelection}
            variant="available"
            emptyMessage="Aucun module disponible"
          />
        )}
      </Paper>

      {/* Wizard d'activation */}
      {activationWizard.module && (
        <ActivationWizard
          open={activationWizard.open}
          onClose={() => setActivationWizard({ open: false, module: null })}
          module={activationWizard.module}
          tenantId={tenantId}
          tenantName={tenantName}
          onSuccess={() => {
            refresh(); // Rafraîchir la liste des modules après activation
          }}
        />
      )}

      {/* Wizard de désactivation */}
      {deactivationWizard.module && (
        <DeactivationWizard
          open={deactivationWizard.open}
          onClose={() => setDeactivationWizard({ open: false, module: null })}
          module={deactivationWizard.module}
          tenantId={tenantId}
          tenantName={tenantName}
          onSuccess={() => {
            refresh(); // Rafraîchir la liste des modules après désactivation
          }}
        />
      )}

      {/* Wizard d'activation batch */}
      <BatchActivationWizard
        open={batchActivationWizard}
        onClose={() => {
          setBatchActivationWizard(false);
          setBatchMode(false);
          setSelectedForBatch(new Set());
        }}
        modules={selectedModulesForBatch}
        tenantId={tenantId}
        tenantName={tenantName}
        onSuccess={() => {
          refresh();
          setBatchMode(false);
          setSelectedForBatch(new Set());
        }}
      />

      {/* Wizard de désactivation batch */}
      <BatchDeactivationWizard
        open={batchDeactivationWizard}
        onClose={() => {
          setBatchDeactivationWizard(false);
          setBatchDeactivationMode(false);
          setSelectedForDeactivation(new Set());
        }}
        modules={selectedModulesForDeactivation}
        tenantId={tenantId}
        tenantName={tenantName}
        onSuccess={() => {
          refresh();
          setBatchDeactivationMode(false);
          setSelectedForDeactivation(new Set());
        }}
      />
    </Box>
  );
}
