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
  FormControlLabel,
  IconButton,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  TextField,
} from '@mui/material';

import { useModuleDeactivation } from '../../hooks/useModuleDeactivation';
import type { TenantModule } from '../../../types/module.types';
import type { DeactivationResult, DeactivationOptions } from '../../../types/deactivation.types';
import { deactivationService } from '../../services/deactivationService';

/**
 * Props du composant BatchDeactivationWizard
 */
interface BatchDeactivationWizardProps {

  /** Contrôle l'ouverture du modal */
  open: boolean;

  /** Callback de fermeture */
  onClose: () => void;

  /** Modules à désactiver */
  modules: TenantModule[];

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant */
  tenantName: string;

  /** Callback appelé après désactivation réussie */
  onSuccess?: () => void;
}

/**
 * État de désactivation d'un module dans le batch
 */
interface ModuleDeactivationState {
  module: TenantModule;
  status: 'pending' | 'deactivating' | 'success' | 'failed' | 'skipped';
  result?: DeactivationResult;
  error?: string;
}

const steps = ['Sélection', 'Options', 'Confirmation', 'Désactivation'];

/**
 * Assistant de désactivation batch de modules (Wizard)
 * Guide l'utilisateur à travers les étapes de désactivation de plusieurs modules
 * Conforme à Story 4.10
 *
 * @example
 * ```tsx
 * <BatchDeactivationWizard
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   modules={selectedModules}
 *   tenantId={123}
 *   tenantName="example.com"
 *   onSuccess={() => refreshModules()}
 * />
 * ```
 */
export function BatchDeactivationWizard({
  open,
  onClose,
  modules,
  tenantId,
  tenantName,
  onSuccess,
}: BatchDeactivationWizardProps) {
  // State du wizard
  const [activeStep, setActiveStep] = useState(0);
  const [selectedModules, setSelectedModules] = useState<TenantModule[]>(modules);

  const [options, setOptions] = useState<DeactivationOptions>({
    backup: true,
    force: false,
  });

  const [confirmationText, setConfirmationText] = useState('');
  const [moduleStates, setModuleStates] = useState<ModuleDeactivationState[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(-1);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [batchComplete, setBatchComplete] = useState(false);

  // Hook de désactivation
  const { deactivate, reset } = useModuleDeactivation();

  // Texte de confirmation requis
  const CONFIRMATION_TEXT = 'CONFIRMER';

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSelectedModules(modules);
      setOptions({ backup: true, force: false });
      setConfirmationText('');
      setModuleStates([]);
      setCurrentModuleIndex(-1);
      setIsDeactivating(false);
      setBatchComplete(false);
      reset();
    }
  }, [open, modules, reset]);

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
  }, []);

  // Navigation
  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Désactiver les modules en batch
  const handleDeactivateBatch = useCallback(async () => {
    setIsDeactivating(true);
    setBatchComplete(false);

    // Initialiser les états des modules (ordre inverse des dépendances)
    const initialStates: ModuleDeactivationState[] = selectedModules.map((module) => ({
      module,
      status: 'pending',
    }));

    setModuleStates(initialStates);

    // Désactiver chaque module
    for (let i = 0; i < selectedModules.length; i++) {
      const moduleToDeactivate = selectedModules[i];

      setCurrentModuleIndex(i);

      // Marquer comme "deactivating"
      setModuleStates((prev) =>
        prev.map((state, idx) => (idx === i ? { ...state, status: 'deactivating' } : state))
      );

      try {
        const result = await deactivate({
          tenantId,
          moduleName: moduleToDeactivate.name,
          options,
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

        // Si échec et pas de mode force, arrêter le batch
        if (!result.success && !options.force) {
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
              : !options.force && idx > i
                ? { ...state, status: 'skipped' }
                : state
          )
        );
        if (!options.force) break;
      }
    }

    setIsDeactivating(false);
    setBatchComplete(true);
    setCurrentModuleIndex(-1);
  }, [selectedModules, deactivate, tenantId, options]);

  // Fermer le modal
  const handleClose = useCallback(() => {
    if (!isDeactivating) {
      if (batchComplete && moduleStates.some((s) => s.status === 'success') && onSuccess) {
        onSuccess();
      }

      onClose();
    }
  }, [isDeactivating, batchComplete, moduleStates, onSuccess, onClose]);

  // Statistiques du batch
  const batchStats = useMemo(() => {
    const success = moduleStates.filter((s) => s.status === 'success').length;
    const failed = moduleStates.filter((s) => s.status === 'failed').length;
    const skipped = moduleStates.filter((s) => s.status === 'skipped').length;
    const pending = moduleStates.filter((s) => s.status === 'pending' || s.status === 'deactivating').length;

    
return { success, failed, skipped, pending, total: moduleStates.length };
  }, [moduleStates]);

  // Vérifier si la confirmation est valide
  const isConfirmationValid = confirmationText.toUpperCase() === CONFIRMATION_TEXT;

  // Vérifier si on peut passer au step suivant
  const canProceed = useCallback(() => {
    if (activeStep === 0) {
      return selectedModules.length > 0;
    }

    if (activeStep === 2) {
      return isConfirmationValid;
    }

    
return true;
  }, [activeStep, selectedModules, isConfirmationValid]);

  // Rendu des steps
  const renderStepContent = () => {
    switch (activeStep) {
      // Step 0: Sélection des modules
      case 0:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Sélectionnez les modules à désactiver
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Attention: La désactivation supprimera les données des modules sélectionnés.
            </Alert>

            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {modules.map((module) => {
                  const isSelected = selectedModules.some((m) => m.name === module.name);

                  
return (
                    <ListItem
                      key={module.name}
                      button
                      onClick={() => toggleModuleSelection(module)}
                      sx={{ bgcolor: isSelected ? 'error.light' : 'transparent' }}
                    >
                      <ListItemIcon>
                        <Checkbox checked={isSelected} edge="start" tabIndex={-1} disableRipple color="error" />
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
              <Typography variant="caption" color="error">
                {selectedModules.length} module(s) sélectionné(s) pour désactivation
              </Typography>
            </Box>
          </Box>
        );

      // Step 1: Options
      case 1:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Options de désactivation
            </Typography>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.backup}
                    onChange={(e) => setOptions({ ...options, backup: e.target.checked })}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">Créer un backup avant désactivation</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Les données seront sauvegardées sur S3 et pourront être restaurées
                    </Typography>
                  </Box>
                }
              />

              {!options.backup && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Sans backup, les données seront définitivement supprimées.
                </Alert>
              )}

              <Divider sx={{ my: 3 }} />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={options.force}
                    onChange={(e) => setOptions({ ...options, force: e.target.checked })}
                    color="error"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" color="error">Continuer en cas d&apos;échec</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Si un module échoue, continuer avec les autres modules
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        );

      // Step 2: Confirmation
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Confirmer la désactivation batch
            </Typography>

            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2">Attention - Action irréversible</Typography>
              <Typography variant="caption">
                Vous êtes sur le point de désactiver {selectedModules.length} module(s) pour{' '}
                <strong>{tenantName}</strong>.
              </Typography>
            </Alert>

            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Modules à désactiver ({selectedModules.length})
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List dense disablePadding>
                {selectedModules.map((module) => (
                  <ListItem key={module.name} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <i className="tabler-plug-off" style={{ color: '#f44336' }} />
                    </ListItemIcon>
                    <ListItemText primary={module.displayName} secondary={`v${module.version}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
              <Typography variant="body2">
                <strong>Backup :</strong> {options.backup ? 'Oui' : 'Non'}
              </Typography>
              <Typography variant="body2">
                <strong>Continuer si échec :</strong> {options.force ? 'Oui' : 'Non'}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Pour confirmer, tapez <strong>{CONFIRMATION_TEXT}</strong> ci-dessous :
              </Typography>
              <TextField
                fullWidth
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder={CONFIRMATION_TEXT}
                size="small"
                error={confirmationText.length > 0 && !isConfirmationValid}
                helperText={confirmationText.length > 0 && !isConfirmationValid ? 'Le texte ne correspond pas' : ''}
              />
            </Box>
          </Box>
        );

      // Step 3: Désactivation en cours / Résultats
      case 3:
        return (
          <Box>
            {isDeactivating && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Désactivation en cours...
                </Typography>
                <LinearProgress color="error" sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Module {currentModuleIndex + 1} sur {selectedModules.length}
                </Typography>
              </>
            )}

            {batchComplete && (
              <>
                <Alert severity={batchStats.failed > 0 ? 'error' : 'warning'} sx={{ mb: 3 }}>
                  {batchStats.failed > 0
                    ? `${batchStats.success} module(s) désactivé(s), ${batchStats.failed} échec(s), ${batchStats.skipped} ignoré(s)`
                    : `${batchStats.success} module(s) désactivé(s) avec succès!`}
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
                        state.status === 'deactivating'
                          ? 'action.hover'
                          : state.status === 'success'
                            ? 'warning.light'
                            : state.status === 'failed'
                              ? 'error.light'
                              : 'transparent',
                    }}
                  >
                    <ListItemIcon>
                      {state.status === 'pending' && <i className="tabler-clock" style={{ color: '#9e9e9e' }} />}
                      {state.status === 'deactivating' && <i className="tabler-loader" style={{ color: '#f44336' }} />}
                      {state.status === 'success' && <i className="tabler-circle-check" style={{ color: '#ff9800' }} />}
                      {state.status === 'failed' && <i className="tabler-circle-x" style={{ color: '#f44336' }} />}
                      {state.status === 'skipped' && <i className="tabler-player-skip-forward" style={{ color: '#9e9e9e' }} />}
                    </ListItemIcon>
                    <ListItemText
                      primary={state.module.displayName}
                      secondary={
                        state.status === 'failed'
                          ? state.error || 'Erreur inconnue'
                          : state.status === 'skipped'
                            ? 'Ignoré'
                            : state.status === 'success' && state.result?.duration
                              ? `Désactivé en ${deactivationService.formatDuration(state.result.duration)}`
                              : state.status === 'success' && state.result?.backupPath
                                ? `Backup: ${state.result.backupPath}`
                                : undefined
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={
                          state.status === 'pending'
                            ? 'En attente'
                            : state.status === 'deactivating'
                              ? 'En cours...'
                              : state.status === 'success'
                                ? 'Désactivé'
                                : state.status === 'failed'
                                  ? 'Échec'
                                  : 'Ignoré'
                        }
                        size="small"
                        color={
                          state.status === 'success'
                            ? 'warning'
                            : state.status === 'failed'
                              ? 'error'
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEscapeKeyDown={isDeactivating}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
          <i className="tabler-packages-off" />
          Désactivation batch de modules
        </Box>
        <IconButton onClick={handleClose} disabled={isDeactivating} size="small">
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
            <Button onClick={handleClose} disabled={isDeactivating}>
              Annuler
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBack} disabled={isDeactivating}>
                Retour
              </Button>
            )}
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={!canProceed() || isDeactivating}
              color="error"
            >
              Suivant
            </Button>
          </>
        )}

        {activeStep === 3 && !batchComplete && !isDeactivating && (
          <>
            <Button onClick={handleBack}>Retour</Button>
            <Button onClick={handleDeactivateBatch} variant="contained" color="error">
              Lancer la désactivation
            </Button>
          </>
        )}

        {activeStep === 3 && batchComplete && (
          <Button onClick={handleClose} variant="contained" color={batchStats.failed > 0 ? 'primary' : 'warning'}>
            Fermer
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
