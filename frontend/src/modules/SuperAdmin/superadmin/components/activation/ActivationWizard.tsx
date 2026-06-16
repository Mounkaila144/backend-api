'use client';

import React, { useState, useEffect, useCallback } from 'react';

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
  Stack,
} from '@mui/material';

import { useModuleActivation } from '../../hooks/useModuleActivation';
import { dependencyService } from '../../services/dependencyService';
import { SagaStepsList } from './SagaStepsList';
import type { TenantModule } from '../../../types/module.types';
import type { DependencyResolution } from '../../../types/dependency.types';
import type { ActivationConfig } from '../../../types/activation.types';
import { activationService } from '../../services/activationService';

/**
 * Props du composant ActivationWizard
 */
interface ActivationWizardProps {

  /** Contrôle l'ouverture du modal */
  open: boolean;

  /** Callback de fermeture */
  onClose: () => void;

  /** Module à activer */
  module: TenantModule;

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant */
  tenantName: string;

  /** Callback appelé après activation réussie */
  onSuccess?: () => void;
}

const steps = ['Informations', 'Dépendances', 'Configuration', 'Activation'];

/**
 * Assistant d'activation de module (Wizard)
 * Guide l'utilisateur à travers les étapes d'activation d'un module
 *
 * @example
 * ```tsx
 * <ActivationWizard
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   module={module}
 *   tenantId={123}
 *   tenantName="example.com"
 *   onSuccess={() => refreshModules()}
 * />
 * ```
 */
export function ActivationWizard({
  open,
  onClose,
  module,
  tenantId,
  tenantName,
  onSuccess,
}: ActivationWizardProps) {
  // State du wizard
  const [activeStep, setActiveStep] = useState(0);
  const [dependencies, setDependencies] = useState<DependencyResolution | null>(null);
  const [checkingDeps, setCheckingDeps] = useState(false);
  const [autoInstallDeps, setAutoInstallDeps] = useState(false);
  const [config, setConfig] = useState<ActivationConfig>({});

  // Hook d'activation
  const { activate, isActivating, result, reset } = useModuleActivation();

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setDependencies(null);
      setAutoInstallDeps(false);
      setConfig({});
      reset();
    }
  }, [open, reset]);

  // Vérifier les dépendances automatiquement au step 1
  useEffect(() => {
    if (open && activeStep === 1 && !dependencies && !checkingDeps) {
      checkDependencies();
    }
  }, [open, activeStep, dependencies, checkingDeps]);

  // Vérifier les dépendances
  const checkDependencies = useCallback(async () => {
    setCheckingDeps(true);

    try {
      const resolution = await dependencyService.resolveDependencies([module.name]);

      setDependencies(resolution);
    } catch (err) {
      console.error('Error checking dependencies:', err);
    } finally {
      setCheckingDeps(false);
    }
  }, [module.name]);

  // Navigation
  const handleNext = useCallback(() => {
    // Skip configuration step si le module n'a pas de config
    if (activeStep === 1 && !module.hasConfig) {
      setActiveStep(3); // Aller directement à l'activation
    } else {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }, [activeStep, module.hasConfig]);

  const handleBack = useCallback(() => {
    // Skip configuration step si le module n'a pas de config
    if (activeStep === 3 && !module.hasConfig) {
      setActiveStep(1); // Retourner aux dépendances
    } else {
      setActiveStep((prev) => Math.max(prev - 1, 0));
    }
  }, [activeStep, module.hasConfig]);

  // Activer le module
  const handleActivate = useCallback(async () => {
    const activationResult = await activate({
      tenantId,
      moduleName: module.name,
      config,
    });

    if (activationResult.success && onSuccess) {
      // Attendre un peu pour que l'utilisateur voit le résultat
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  }, [activate, tenantId, module.name, config, onSuccess, onClose]);

  // Fermer le modal
  const handleClose = useCallback(() => {
    if (!isActivating) {
      onClose();
    }
  }, [isActivating, onClose]);

  // Vérifier si on peut passer au step suivant
  const canProceed = useCallback(() => {
    if (activeStep === 1) {
      // Step des dépendances
      if (!dependencies) return false;

      if (dependencies.missingDependencies.length > 0 && !autoInstallDeps) {
        return false;
      }
    }

    
return true;
  }, [activeStep, dependencies, autoInstallDeps]);

  // Rendu des steps
  const renderStepContent = () => {
    switch (activeStep) {
      // Step 0: Informations
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {module.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {module.description}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Chip label={`Version ${module.version}`} size="small" />
              <Chip label={module.category} size="small" color="primary" variant="outlined" />
              {module.dependencies.length > 0 && (
                <Chip label={`${module.dependencies.length} dépendances`} size="small" variant="outlined" />
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Tenant cible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tenantName}
            </Typography>
          </Box>
        );

      // Step 1: Vérification dépendances
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
                  Vérification en cours...
                </Typography>
              </Box>
            )}

            {!checkingDeps && dependencies && (
              <Box>
                {/* Dépendances OK */}
                {dependencies.canInstall && dependencies.missingDependencies.length === 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Toutes les dépendances sont satisfaites. Le module peut être activé.
                  </Alert>
                )}

                {/* Modules requis (déjà installés) */}
                {dependencies.requiredModules.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <i className="tabler-circle-check" style={{ color: '#4caf50' }} />
                      Dépendances installées
                    </Typography>
                    <Stack spacing={0.5}>
                      {dependencies.requiredModules.map((dep) => (
                        <Chip key={dep} label={dep} size="small" color="success" variant="outlined" />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Dépendances manquantes */}
                {dependencies.missingDependencies.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Certaines dépendances doivent être installées en premier
                    </Alert>
                    <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <i className="tabler-alert-triangle" style={{ color: '#ff9800' }} />
                      Modules requis
                    </Typography>
                    <Stack spacing={0.5} sx={{ mb: 2 }}>
                      {dependencies.missingDependencies.map((dep) => (
                        <Chip key={dep} label={dep} size="small" color="warning" />
                      ))}
                    </Stack>
                    <FormControlLabel
                      control={<Checkbox checked={autoInstallDeps} onChange={(e) => setAutoInstallDeps(e.target.checked)} />}
                      label="Installer automatiquement les dépendances manquantes"
                    />
                  </Box>
                )}

                {/* Ordre d'installation */}
                {dependencies.installOrder.length > 1 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Ordre d&apos;installation recommandé :
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {dependencies.installOrder.map((mod, index) => (
                        <React.Fragment key={mod}>
                          {index > 0 && <Typography variant="caption">→</Typography>}
                          <Chip label={mod} size="small" variant={mod === module.name ? 'filled' : 'outlined'} />
                        </React.Fragment>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        );

      // Step 2: Configuration (optionnel)
      case 2:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Configuration du module
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              La configuration avancée des modules sera disponible dans une prochaine version.
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Le module sera activé avec la configuration par défaut.
            </Typography>
          </Box>
        );

      // Step 3: Confirmation et Activation
      case 3:
        return (
          <Box>
            {!isActivating && !result && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Confirmer l&apos;activation
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Module :</strong> {module.displayName} (v{module.version})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tenant :</strong> {tenantName}
                  </Typography>
                  {dependencies && dependencies.missingDependencies.length > 0 && autoInstallDeps && (
                    <Typography variant="body2">
                      <strong>Dépendances à installer :</strong> {dependencies.missingDependencies.length}
                    </Typography>
                  )}
                </Box>
                <Alert severity="warning">
                  Êtes-vous sûr de vouloir activer ce module ? Cette action lancera les migrations de base de données.
                </Alert>
              </>
            )}

            {isActivating && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Activation en cours...
                </Typography>
                <LinearProgress sx={{ mb: 3 }} />
                {result && <SagaStepsList steps={result.steps} showDuration />}
              </Box>
            )}

            {!isActivating && result && (
              <Box>
                {result.success ? (
                  <>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2">Module activé avec succès!</Typography>
                      <Typography variant="caption">
                        Le module {module.displayName} est maintenant actif pour {tenantName}.
                      </Typography>
                    </Alert>
                    {result.steps.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Étapes d&apos;activation
                        </Typography>
                        <SagaStepsList steps={result.steps} showDuration showSummary />
                      </Box>
                    )}
                    {result.duration && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Durée totale : {activationService.formatDuration(result.duration)}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    <Alert severity="error" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2">Échec de l&apos;activation</Typography>
                      <Typography variant="caption" component="div">
                        {result.error || 'Une erreur est survenue lors de l\'activation du module.'}
                      </Typography>
                    </Alert>
                    {result.steps.length > 0 && (
                      <Box>
                        <SagaStepsList steps={result.steps} showDuration showSummary sideBySideRollback />
                      </Box>
                    )}
                    {result.duration && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Durée avant échec : {activationService.formatDuration(result.duration)}
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEscapeKeyDown={isActivating}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>Activation de module</Box>
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
              {activeStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
            </Button>
          </>
        )}

        {activeStep === 3 && !result && (
          <>
            <Button onClick={handleBack} disabled={isActivating}>
              Retour
            </Button>
            <Button onClick={handleActivate} variant="contained" disabled={isActivating} color="primary">
              {isActivating ? 'Activation...' : 'Confirmer l\'activation'}
            </Button>
          </>
        )}

        {activeStep === 3 && result && (
          <>
            {!result.success && (
              <Button
                onClick={() => {
                  reset();
                  setActiveStep(1); // Retour aux dépendances
                }}
                variant="outlined"
                color="primary"
              >
                Réessayer
              </Button>
            )}
            <Button onClick={handleClose} variant="contained" color={result.success ? 'success' : 'primary'}>
              Fermer
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
