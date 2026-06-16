/**
 * Types pour l'activation et la désactivation de modules
 */

/**
 * Requête d'activation d'un module pour un tenant
 */
export interface ActivationRequest {

  /** ID du tenant */
  tenantId: number;

  /** Nom du module à activer */
  moduleName: string;

  /** Configuration optionnelle du module */
  config?: Record<string, any>;
}

/**
 * Statut d'une étape Saga
 */
export type SagaStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';

/**
 * Étape d'exécution Saga
 */
export interface SagaStep {

  /** Nom de l'étape */
  name: string;

  /** Statut actuel de l'étape */
  status: SagaStepStatus;

  /** Date de début d'exécution */
  startedAt?: string;

  /** Date de fin d'exécution */
  completedAt?: string;

  /** Message d'erreur si échec */
  error?: string;

  /** Message informatif */
  message?: string;

  /** Durée en ms */
  duration?: number;

  /** Métadonnées additionnelles (count, filesCreated, etc.) */
  metadata?: Record<string, any>;
}

/**
 * Résultat d'activation d'un module
 */
export interface ActivationResult {

  /** Si l'activation a réussi */
  success: boolean;

  /** Nom du module activé */
  module: string;

  /** Liste des étapes Saga exécutées */
  steps: SagaStep[];

  /** Date d'installation (si succès) */
  installedAt?: string;

  /** Date d'activation (alias pour compatibilité API) */
  activatedAt?: string;

  /** Message d'erreur global (si échec) */
  error?: string;

  /** Durée totale en millisecondes */
  duration?: number;

  /** Avertissements (warnings) */
  warnings?: string[];
}

/**
 * Configuration d'activation d'un module
 * Structure générique qui peut contenir n'importe quelle configuration
 */
export type ActivationConfig = Record<string, any>;

/**
 * Réponse API pour l'activation d'un module
 */
export interface ActivationResponse {
  success: boolean;
  data: ActivationResult;
  message?: string;
}

/**
 * Information de rollback en cas d'échec
 */
export interface RollbackInfo {

  /** Nom de l'étape qui a échoué */
  originalStep: string;

  /** Liste des étapes qui ont été annulées */
  rolledBackSteps: string[];

  /** Raison de l'échec */
  reason: string;
}

/**
 * État du wizard d'activation
 */
export interface ActivationWizardState {

  /** Étape active du wizard (0-3) */
  activeStep: number;

  /** Résolution des dépendances */
  dependencies: any | null; // DependencyResolution type
  /** Configuration du module */
  config: ActivationConfig;

  /** Si on vérifie les dépendances */
  checkingDeps: boolean;

  /** Si on installe automatiquement les dépendances */
  autoInstallDeps: boolean;

  /** Résultat de l'activation */
  result: ActivationResult | null;
}

/**
 * Props communes pour les composants d'activation
 */
export interface ActivationComponentProps {

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant (pour affichage) */
  tenantName: string;

  /** Nom du module à activer */
  moduleName: string;
}
