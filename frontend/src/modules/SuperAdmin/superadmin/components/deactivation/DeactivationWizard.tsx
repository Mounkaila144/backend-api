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
  TextField,
  IconButton,
} from '@mui/material';

import { useModuleDeactivation } from '../../hooks/useModuleDeactivation';
import { ImpactAnalysisView } from './ImpactAnalysisView';
import { SagaStepsList } from '../activation/SagaStepsList';
import { deactivationService } from '../../services/deactivationService';
import type { TenantModule } from '../../../types/module.types';
import type { DeactivationOptions } from '../../../types/deactivation.types';

/**
 * Props du composant DeactivationWizard
 */
interface DeactivationWizardProps {

  /** Contrôle l'ouverture du modal */
  open: boolean;

  /** Callback de fermeture */
  onClose: () => void;

  /** Module à désactiver */
  module: TenantModule;

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant */
  tenantName: string;

  /** Callback appelé après désactivation réussie */
  onSuccess?: () => void;
}

const steps = ['Analyse d\'impact', 'Options', 'Confirmation'];

/**
 * Assistant de désactivation de module (Wizard)
 * Guide l'utilisateur à travers les étapes de désactivation d'un module
 *
 * @example
 * ```tsx
 * <DeactivationWizard
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   module={module}
 *   tenantId={123}
 *   tenantName="example.com"
 *   onSuccess={() => refreshModules()}
 * />
 * ```
 */
export function DeactivationWizard({
  open,
  onClose,
  module,
  tenantId,
  tenantName,
  onSuccess,
}: DeactivationWizardProps) {
  // State du wizard
  const [activeStep, setActiveStep] = useState(0);

  const [options, setOptions] = useState<DeactivationOptions>({
    backup: true,
    force: false,
  });

  const [confirmationText, setConfirmationText] = useState('');

  // Hook de désactivation
  const {
    analyzeImpact,
    deactivate,
    isAnalyzing,
    isDeactivating,
    impact,
    result,
    reset,
  } = useModuleDeactivation();

  // Texte de confirmation requis
  const CONFIRMATION_TEXT = 'CONFIRMER';

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setOptions({ backup: true, force: false });
      setConfirmationText('');
      reset();

      // Lancer l'analyse d'impact automatiquement
      analyzeImpact(tenantId, module.name);
    }
  }, [open, reset, analyzeImpact, tenantId, module.name]);

  // Navigation
  const handleNext = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Désactiver le module
  const handleDeactivate = useCallback(async () => {
    const deactivationResult = await deactivate({
      tenantId,
      moduleName: module.name,
      options,
    });

    if (deactivationResult.success && onSuccess) {
      // Attendre un peu pour que l'utilisateur voit le résultat
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    }
  }, [deactivate, tenantId, module.name, options, onSuccess, onClose]);

  // Fermer le modal
  const handleClose = useCallback(() => {
    if (!isDeactivating) {
      onClose();
    }
  }, [isDeactivating, onClose]);

  // Vérifier si on peut passer au step suivant
  const canProceed = useCallback(() => {
    if (activeStep === 0) {
      // Step analyse d'impact
      if (!impact || isAnalyzing) return false;

      // Bloquer si non désactivable et force pas coché
      if (!impact.canDeactivate && !options.force) return false;
    }

    if (activeStep === 1) {
      // Step options - toujours pouvoir continuer
      return true;
    }

    
return true;
  }, [activeStep, impact, isAnalyzing, options.force]);

  // Vérifier si la confirmation est valide
  const isConfirmationValid = confirmationText.toUpperCase() === CONFIRMATION_TEXT;

  // Rendu des steps
  const renderStepContent = () => {
    switch (activeStep) {
      // Step 0: Analyse d'impact
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              {module.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Analyse de l&apos;impact de la désactivation de ce module pour <strong>{tenantName}</strong>.
            </Typography>

            {isAnalyzing && (
              <Box sx={{ my: 3 }}>
                <LinearProgress />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Analyse en cours...
                </Typography>
              </Box>
            )}

            {!isAnalyzing && impact && <ImpactAnalysisView impact={impact} />}

            {!isAnalyzing && impact && !impact.canDeactivate && (
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={options.force}
                      onChange={(e) => setOptions({ ...options, force: e.target.checked })}
                      color="error"
                    />
                  }
                  label={
                    <Typography variant="body2" color="error">
                      Forcer la désactivation (non recommandé)
                    </Typography>
                  }
                />
                {options.force && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    Forcer la désactivation peut entraîner des problèmes avec les modules dépendants.
                  </Alert>
                )}
              </Box>
            )}
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

              {options.backup && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Un backup des données du module sera créé avant la désactivation. Cette opération peut
                  prendre plus de temps selon la quantité de données.
                </Alert>
              )}

              {!options.backup && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Sans backup, les données du module seront définitivement supprimées et ne pourront pas
                  être récupérées.
                </Alert>
              )}
            </Box>
          </Box>
        );

      // Step 2: Confirmation
      case 2:
        return (
          <Box>
            {!isDeactivating && !result && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Confirmer la désactivation
                </Typography>

                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2">Attention - Action irréversible</Typography>
                  <Typography variant="caption">
                    La désactivation du module supprimera ses fonctionnalités pour ce tenant.
                  </Typography>
                </Alert>

                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Module :</strong> {module.displayName} (v{module.version})
                  </Typography>
                  <Typography variant="body2">
                    <strong>Tenant :</strong> {tenantName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Backup :</strong> {options.backup ? 'Oui' : 'Non'}
                  </Typography>
                  {options.force && (
                    <Typography variant="body2" color="error">
                      <strong>Mode forcé :</strong> Oui
                    </Typography>
                  )}
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
                    helperText={
                      confirmationText.length > 0 && !isConfirmationValid
                        ? 'Le texte ne correspond pas'
                        : ''
                    }
                  />
                </Box>
              </>
            )}

            {isDeactivating && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Désactivation en cours...
                </Typography>
                <LinearProgress color="error" sx={{ mb: 3 }} />
                {result && <SagaStepsList steps={result.steps} showDuration />}
              </Box>
            )}

            {!isDeactivating && result && (
              <Box>
                {result.success ? (
                  <>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2">Module désactivé avec succès!</Typography>
                      <Typography variant="caption">
                        Le module {module.displayName} a été désactivé pour {tenantName}.
                      </Typography>
                    </Alert>
                    {result.backupPath && (
                      <Alert severity="info" sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">Backup créé</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {result.backupPath}
                        </Typography>
                      </Alert>
                    )}
                    {result.steps.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Étapes de désactivation
                        </Typography>
                        <SagaStepsList steps={result.steps} showDuration showSummary />
                      </Box>
                    )}
                    {result.duration && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Durée totale : {deactivationService.formatDuration(result.duration)}
                      </Typography>
                    )}
                  </>
                ) : (
                  <>
                    <Alert severity="error" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2">Échec de la désactivation</Typography>
                      <Typography variant="caption" component="div">
                        {result.error || 'Une erreur est survenue lors de la désactivation.'}
                      </Typography>
                    </Alert>
                    {result.steps.length > 0 && (
                      <Box>
                        <SagaStepsList steps={result.steps} showDuration showSummary sideBySideRollback />
                      </Box>
                    )}
                    {result.duration && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Durée avant échec : {deactivationService.formatDuration(result.duration)}
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth disableEscapeKeyDown={isDeactivating}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className="tabler-plug-off" style={{ color: '#f44336' }} />
          Désactivation de module
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
        {activeStep < 2 && (
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

        {activeStep === 2 && !result && (
          <>
            <Button onClick={handleBack} disabled={isDeactivating}>
              Retour
            </Button>
            <Button
              onClick={handleDeactivate}
              variant="contained"
              disabled={isDeactivating || !isConfirmationValid}
              color="error"
            >
              {isDeactivating ? 'Désactivation...' : 'Désactiver le module'}
            </Button>
          </>
        )}

        {activeStep === 2 && result && (
          <>
            {!result.success && (
              <Button
                onClick={() => {
                  reset();
                  setActiveStep(0);
                  setConfirmationText('');
                  analyzeImpact(tenantId, module.name);
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
