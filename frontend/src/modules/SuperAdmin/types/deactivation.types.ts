/**
 * Types pour la désactivation de modules
 */

import type { SagaStep } from './activation.types';

/**
 * Analyse d'impact avant désactivation
 */
export interface ImpactAnalysis {

  /** Si la désactivation est possible */
  canDeactivate: boolean;

  /** Modules qui BLOQUENT la désactivation (dépendances actives) */
  blockers: string[];

  /** Avertissements non-bloquants */
  warnings: string[];

  /** Données qui seront affectées */
  affectedData: {

    /** Tables de base de données concernées */
    tables: string[];

    /** Nombre estimé de lignes de données */
    estimatedRows: number;
  };

  /** Modules qui seront affectés (mais ne bloquent pas) */
  dependentModules: string[];

  /** Actions recommandées avant désactivation */
  recommendations: string[];
}

/**
 * Options de désactivation
 */
export interface DeactivationOptions {

  /** Créer un backup S3 avant désactivation */
  backup: boolean;

  /** Forcer la désactivation malgré les blockers */
  force: boolean;
}

/**
 * Requête de désactivation d'un module
 */
export interface DeactivationRequest {

  /** ID du tenant */
  tenantId: number;

  /** Nom du module à désactiver */
  moduleName: string;

  /** Options de désactivation */
  options: DeactivationOptions;
}

/**
 * Résultat de désactivation d'un module
 */
export interface DeactivationResult {

  /** Si la désactivation a réussi */
  success: boolean;

  /** Nom du module désactivé */
  module: string;

  /** Chemin du backup S3 (si créé) */
  backupPath?: string;

  /** Liste des étapes Saga exécutées */
  steps: SagaStep[];

  /** Message d'erreur global (si échec) */
  error?: string;

  /** Durée totale en millisecondes */
  duration?: number;

  /** Date de désactivation (si succès) */
  deactivatedAt?: string;
}

/**
 * Réponse API pour l'analyse d'impact
 */
export interface ImpactAnalysisResponse {
  success: boolean;
  data: ImpactAnalysis;
  message?: string;
}

/**
 * Réponse API pour la désactivation
 */
export interface DeactivationResponse {
  success: boolean;
  data: DeactivationResult;
  message?: string;
}

/**
 * État du wizard de désactivation
 */
export interface DeactivationWizardState {

  /** Étape active du wizard (0-2) */
  activeStep: number;

  /** Analyse d'impact */
  impact: ImpactAnalysis | null;

  /** Options de désactivation */
  options: DeactivationOptions;

  /** Si on analyse l'impact */
  analyzingImpact: boolean;

  /** Résultat de la désactivation */
  result: DeactivationResult | null;

  /** Texte de confirmation */
  confirmationText: string;
}

/**
 * Requête de désactivation batch
 */
export interface BatchDeactivationRequest {

  /** Liste des désactivations à effectuer */
  deactivations: DeactivationRequest[];
}

/**
 * Résultat d'une désactivation dans un batch
 */
export interface BatchDeactivationItemResult {
  tenantId: number;
  module: string;
  success: boolean;
  error?: string;
  backupPath?: string;
  deactivatedAt?: string;
}

/**
 * Résultat d'une désactivation batch
 */
export interface BatchDeactivationResult {

  /** Nombre total de désactivations */
  total: number;

  /** Nombre de désactivations réussies */
  successful: number;

  /** Nombre de désactivations échouées */
  failed: number;

  /** Résultats individuels */
  results: BatchDeactivationItemResult[];
}
