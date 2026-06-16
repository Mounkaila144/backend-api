'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Checkbox,
  IconButton,
  Divider,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';

import { useModuleActivation } from '../../hooks/useModuleActivation';
import { dependencyService } from '../../services/dependencyService';
import type { TenantModule } from '../../../types/module.types';
import type { DependencyResolution } from '../../../types/dependency.types';
import type { ActivationResult } from '../../../types/activation.types';
import { activationService } from '../../services/activationService';

/**
 * Props du composant BatchActivationWizard
 */
interface BatchActivationWizardProps {

  /** Contrôle l'ouverture du modal */
  open: boolean;

  /** Callback de fermeture */
  onClose: () => void;

  /** Modules à activer */
  modules: TenantModule[];

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant */
  tenantName: string;

  /** Callback appelé après activation réussie */
  onSuccess?: () => void;
}

/**
 * État d'activation d'un module dans le batch
 */
interface ModuleActivationState {
  module: TenantModule;
  status: 'pending' | 'activating' | 'success' | 'failed' | 'skipped';
  result?: ActivationResult;
  error?: string;
}

const steps = ['Sélection', 'Dépendances', 'Confirmation', 'Activation'];

/**
 * Assistant d'activation batch de modules (Wizard)
 * Guide l'utilisateur à travers les étapes d'activation de plusieurs modules
 * Conforme à Story 3.9
 *
 * @example
 * ```tsx
 * <BatchActivationWizard
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   modules={selectedModules}
 *   tenantId={123}
 *   tenantName="example.com"
 *   onSuccess={() => refreshModules()}
 * />
 * ```
 */
export function BatchActivationWizard({
  open,
  onClose,
  modules,
  tenantId,
  tenantName,
  onSuccess,
}: BatchActivationWizardProps) {
  // State du wizard
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<TenantModule[]>(modules);
  const [dependencies, setDependencies] = useState<DependencyResolution | null>(null);
  const [checkingDeps, setCheckingDeps] = useState(false);
  const [installOrder, setInstallOrder] = useState<string[]>([]);
  const [moduleStates, setModuleStates] = useState<ModuleActivationState[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(-1);
  const [isActivating, setIsActivating] = useState(false);
  const [batchComplete, setBatchComplete] = useState(false);

  // Hook d'activation (pour un seul module)
  const { activate, reset } = useModuleActivation();

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedModules(modules);
      setDependencies(null);
      setInstallOrder([]);
      setModuleStates([]);
      setCurrentModuleIndex(-1);
      setIsActivating(false);
      setBatchComplete(false);
      reset();
    }
  }, [open, modules, reset]);

  // Vérifier les dépendances automatiquement au step 1
  useEffect(() => {
    if (open && activeStep === 1 && !dependencies && !checkingDeps && selectedModules.length > 0) {
      checkDependencies();
    }
  }, [open, activeStep, dependencies, checkingDeps, selectedModules]);

  // Vérifier les dépendances
  const checkDependencies = useCallback(async () => {
    setCheckingDeps(true);

    try {
      const moduleNames = selectedModules.map((m) => m.name);

      // Passer tous les modules disponibles pour le fallback local
      const resolution = await dependencyService.resolveDependencies(moduleNames, modules);

      setDependencies(resolution);
      setInstallOrder(resolution.installOrder);
    } catch (err) {
      console.error('Error checking dependencies:', err);
    } finally {
      setCheckingDeps(false);
    }
  }, [selectedModules, modules]);

  // Toggle sélection d'un module
  const toggleModuleSelection = useCallback((module: TenantModule) => {
    setSelectedModules((prev) => {
      const isSelected = prev.some((m) => m.name === module.name);

      if (isSelected) {
        return prev.filter((m) => m.name !== module.name);
      } else {
        return [...prev, module];
      }
    });

    // Reset dependencies quand la sélection change
    setDependencies(null);
  }, []);

  // Navigation
  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Activer les modules en batch
  const handleActivateBatch = useCallback(async () => {
    setIsActivating(true);
    setBatchComplete(false);

    // Initialiser les états des modules
    const initialStates: ModuleActivationState[] = installOrder.map((name) => ({
      module: selectedModules.find((m) => m.name === name) || modules.find((m) => m.name === name)!,
      status: 'pending',
    }));

    setModuleStates(initialStates);

    // Activer chaque module dans l'ordre
    for (let i = 0; i < installOrder.length; i++) {
      const moduleName = installOrder[i];
      const moduleToActivate = selectedModules.find((m) => m.name === moduleName);

      if (!moduleToActivate) continue;

      setCurrentModuleIndex(i);

      // Marquer comme "activating"
      setModuleStates((prev) =>
        prev.map((state, idx) => (idx === i ? { ...state, status: 'activating' } : state))
      );

      try {
        const result = await activate({
          tenantId,
          moduleName: moduleToActivate.name,
          config: {},
        });

        // Mettre à jour le statut
        setModuleStates((prev) =>
          prev.map((state, idx) =>
            idx === i
              ? {
                  ...state,
                  status: result.success ? 'success' : 'failed',
                  result,
                  error: result.error,
                }
              : state
          )
        );

        // Si échec, arrêter le batch et marquer les modules suivants comme "skipped"
        if (!result.success) {
          setModuleStates((prev) =>
            prev.map((state, idx) => (idx > i ? { ...state, status: 'skipped' } : state))
          );
          break;
        }
      } catch (err: any) {
        setModuleStates((prev) =>
          prev.map((state, idx) =>
            idx === i
              ? { ...state, status: 'failed', error: err.message }
              : idx > i
                ? { ...state, status: 'skipped' }
                : state
          )
        );
        break;
      }
    }

    setIsActivating(false);
    setBatchComplete(true);
    setCurrentModuleIndex(-1);
  }, [installOrder, selectedModules, modules, activate, tenantId]);

  // Fermer le modal
  const handleClose = useCallback(() => {
    if (!isActivating) {
      if (batchComplete && moduleStates.some((s) => s.status === 'success') && onSuccess) {
        onSuccess();
      }

      onClose();
    }
  }, [isActivating, batchComplete, moduleStates, onSuccess, onClose]);

  // Statistiques du batch
  const batchStats = useMemo(() => {
    const success = moduleStates.filter((s) => s.status === 'success').length;
    const failed = moduleStates.filter((s) => s.status === 'failed').length;
    const skipped = moduleStates.filter((s) => s.status === 'skipped').length;
    const pending = moduleStates.filter((s) => s.status === 'pending' || s.status === 'activating').length;

    
return { success, failed, skipped, pending, total: moduleStates.length };
  }, [moduleStates]);

  // Vérifier si on peut passer au step suivant
  const canProceed = useCallback(() => {
    if (activeStep === 0) {
      return selectedModules.length > 0;
    }

    if (activeStep === 1) {
      return !checkingDeps && dependencies && dependencies.canInstall;
    }

    
return true;
  }, [activeStep, selectedModules, checkingDeps, dependencies]);

  // Rendu des steps
  const renderStepContent = () => {
    switch (activeStep) {
      // Step 0: Sélection des modules
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Sélectionnez les modules à activer
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Les modules seront activés dans l&apos;ordre de leurs dépendances.
            </Typography>

            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {modules.map((module) => {
                  const isSelected = selectedModules.some((m) => m.name === module.name);

                  
return (
                    <ListItem
                      key={module.name}
                      button
                      onClick={() => toggleModuleSelection(module)}
                      sx={{ bgcolor: isSelected ? 'action.selected' : 'transparent' }}
                    >
                      <ListItemIcon>
                        <Checkbox checked={isSelected} edge="start" tabIndex={-1} disableRipple />
                      </ListItemIcon>
                      <ListItemText
                        primary={module.displayName}
                        secondary={`v${module.version} - ${module.description}`}
                      />
                      <ListItemSecondaryAction>
                        <Chip label={module.category} size="small" variant="outlined" />
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </Paper>

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                {selectedModules.length} module(s) sélectionné(s)
              </Typography>
            </Box>
          </Box>
        );

      // Step 1: Vérification des dépendances
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Vérification des dépendances
            </Typography>

            {checkingDeps && (
              <Box sx={{ my: 3 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Analyse des dépendances en cours...
                </Typography>
              </Box>
            )}

            {!checkingDeps && dependencies && (
              <Box>
                {dependencies.canInstall ? (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Toutes les dépendances sont satisfaites. Les modules peuvent être activés.
                  </Alert>
                ) : (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Impossible de résoudre les dépendances. Certains modules requis sont manquants.
                  </Alert>
                )}

                {/* Dépendances manquantes */}
                {dependencies.missingDependencies.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                      Dépendances manquantes
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {dependencies.missingDependencies.map((dep) => (
                        <Chip key={dep} label={dep} size="small" color="error" />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Ordre d'installation */}
                {installOrder.length > 0 && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Ordre d&apos;installation
                    </Typography>
                    <Stack spacing={1}>
                      {installOrder.map((name, index) => (
                        <Box key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={index + 1}
                            size="small"
                            color="primary"
                            sx={{ minWidth: 28 }}
                          />
                          <Typography variant="body2">{name}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      // Step 2: Confirmation
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Confirmer l&apos;activation batch
            </Typography>

            <Alert severity="warning" sx={{ mb: 3 }}>
              Vous êtes sur le point d&apos;activer {installOrder.length} module(s) pour <strong>{tenantName}</strong>.
              Cette action lancera les migrations de base de données pour chaque module.
            </Alert>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Modules à activer ({installOrder.length})
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List dense disablePadding>
                {installOrder.map((name, index) => {
                  const mod = selectedModules.find((m) => m.name === name) || modules.find((m) => m.name === name);

                  
return (
                    <ListItem key={name} disablePadding sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Typography variant="caption" color="text.secondary">
                          {index + 1}.
                        </Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={mod?.displayName || name}
                        secondary={`v${mod?.version || '?'}`}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Paper>
          </Box>
        );

      // Step 3: Activation en cours / Résultats
      case 3:
        return (
          <Box>
            {isActivating && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Activation en cours...
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Module {currentModuleIndex + 1} sur {installOrder.length}
                </Typography>
              </>
            )}

            {batchComplete && (
              <>
                <Alert
                  severity={batchStats.failed > 0 ? 'warning' : 'success'}
                  sx={{ mb: 3 }}
                >
                  {batchStats.failed > 0
                    ? `${batchStats.success} module(s) activé(s), ${batchStats.failed} échec(s), ${batchStats.skipped} ignoré(s)`
                    : `${batchStats.success} module(s) activé(s) avec succès!`}
                </Alert>
              </>
            )}

            {/* Liste des modules avec leur statut */}
            <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
              <List dense>
                {moduleStates.map((state) => (
                  <ListItem
                    key={state.module.name}
                    sx={{
                      bgcolor:
                        state.status === 'activating'
                          ? 'action.hover'
                          : state.status === 'success'
                            ? 'success.light'
                            : state.status === 'failed'
                              ? 'error.light'
                              : 'transparent',
                    }}
                  >
                    <ListItemIcon>
                      {state.status === 'pending' && <i className="tabler-clock" style={{ color: '#9e9e9e' }} />}
                      {state.status === 'activating' && <i className="tabler-loader" style={{ color: '#1976d2' }} />}
                      {state.status === 'success' && <i className="tabler-circle-check" style={{ color: '#4caf50' }} />}
                      {state.status === 'failed' && <i className="tabler-circle-x" style={{ color: '#f44336' }} />}
                      {state.status === 'skipped' && <i className="tabler-player-skip-forward" style={{ color: '#ff9800' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={state.module.displayName}
                      secondary={
                        state.status === 'failed'
                          ? state.error || 'Erreur inconnue'
                          : state.status === 'skipped'
                            ? 'Ignoré (module précédent en échec)'
                            : state.status === 'success' && state.result?.duration
                              ? `Activé en ${activationService.formatDuration(state.result.duration)}`
                              : undefined
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={
                          state.status === 'pending'
                            ? 'En attente'
                            : state.status === 'activating'
                              ? 'En cours...'
                              : state.status === 'success'
                                ? 'Succès'
                                : state.status === 'failed'
                                  ? 'Échec'
                                  : 'Ignoré'
                        }
                        size="small"
                        color={
                          state.status === 'success'
                            ? 'success'
                            : state.status === 'failed'
                              ? 'error'
                              : state.status === 'skipped'
                                ? 'warning'
                                : 'default'
                        }
                        variant="outlined"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEscapeKeyDown={isActivating}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className="tabler-packages" />
          Activation batch de modules
        </Box>
        <IconButton onClick={handleClose} disabled={isActivating} size="small">
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        {activeStep < 3 && (
          <>
            <Button onClick={handleClose} disabled={isActivating}>
              Annuler
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={isActivating}>
                Retour
              </Button>
            )}
            <Button onClick={handleNext} variant="contained" disabled={!canProceed() || isActivating}>
              Suivant
            </Button>
          </>
        )}

        {activeStep === 3 && !batchComplete && !isActivating && (
          <>
            <Button onClick={handleBack}>Retour</Button>
            <Button onClick={handleActivateBatch} variant="contained" color="primary">
              Lancer l&apos;activation
            </Button>
          </>
        )}

        {activeStep === 3 && batchComplete && (
          <Button onClick={handleClose} variant="contained" color={batchStats.failed > 0 ? 'primary' : 'success'}>
            Fermer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
