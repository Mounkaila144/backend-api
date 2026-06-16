/**
 * SuperAdmin Module - Barrel Export
 * Point d'entrée central pour tous les exports du module SuperAdmin
 */

// ============================================================================
// Types
// ============================================================================
export type {
  Module,
  ModuleCategory,
  ApiResponse,
  TenantModule,
  TenantModuleStatus,
} from './types/module.types';

export type {
  DependencyNode,
  DependencyEdge,
  DependencyGraph,
  DependencyResolution,
  ResolveDependenciesRequest,
} from './types/dependency.types';

export type {
  ActivationRequest,
  ActivationResult,
  ActivationConfig,
  SagaStep,
  SagaStepStatus,
  RollbackInfo,
  ActivationWizardState,
  ActivationComponentProps,
} from './types/activation.types';

export type {
  ImpactAnalysis,
  DeactivationOptions,
  DeactivationRequest,
  DeactivationResult,
  DeactivationWizardState,
  BatchDeactivationRequest,
  BatchDeactivationResult,
} from './types/deactivation.types';

export type {
  ServiceType,
  S3Config,
  ResendConfig,
  MeilisearchConfig,
  ServiceConfig,
  TestResult,
  ConfigResponse,
  TestResponse,
} from './types/service-config.types';

export {
  SERVICE_EDITABLE,
  SERVICE_LABELS,
  SERVICE_DESCRIPTIONS,
} from './types/service-config.types';

// ============================================================================
// Services
// ============================================================================
export { moduleService } from './superadmin/services/moduleService';
export { dependencyService } from './superadmin/services/dependencyService';
export { activationService } from './superadmin/services/activationService';
export { deactivationService } from './superadmin/services/deactivationService';
export { serviceConfigService } from './superadmin/services/serviceConfigService';

// ============================================================================
// Hooks
// ============================================================================
export { useModules } from './superadmin/hooks/useModules';
export { useTenantModules } from './superadmin/hooks/useTenantModules';
export { useModuleActivation } from './superadmin/hooks/useModuleActivation';
export { useModuleDeactivation } from './superadmin/hooks/useModuleDeactivation';
export { useServiceConfig } from './superadmin/hooks/useServiceConfig';
export type { UseServiceConfigReturn } from './superadmin/hooks/useServiceConfig';

// ============================================================================
// Components
// ============================================================================
export { ModuleCard } from './superadmin/components/modules/ModuleCard';
export { ModulesTable } from './superadmin/components/modules/ModulesTable';
export { ModulesPage } from './superadmin/components/modules/ModulesPage';
export { TenantModuleCard } from './superadmin/components/modules/TenantModuleCard';
export { TenantModulesView } from './superadmin/components/modules/TenantModulesView';
export { TenantModulesModal } from './superadmin/components/modules/TenantModulesModal';
export { ModuleFilters } from './superadmin/components/modules/ModuleFilters';
export { SagaStepsList, getSagaStepsStats } from './superadmin/components/activation/SagaStepsList';
export { ActivationWizard } from './superadmin/components/activation/ActivationWizard';
export { ActivationReportView } from './superadmin/components/activation/ActivationReportView';
export { BatchActivationWizard } from './superadmin/components/activation/BatchActivationWizard';
export { ImpactAnalysisView } from './superadmin/components/deactivation/ImpactAnalysisView';
export { DeactivationWizard } from './superadmin/components/deactivation/DeactivationWizard';
export { DeactivationReportView } from './superadmin/components/deactivation/DeactivationReportView';
export { BatchDeactivationWizard } from './superadmin/components/deactivation/BatchDeactivationWizard';

// Service Configuration Components
export { ServiceConfigLayout } from './superadmin/components/services/ServiceConfigLayout';
export { TestResultAlert } from './superadmin/components/services/TestResultAlert';
export { S3ConfigForm } from './superadmin/components/services/S3ConfigForm';

// Service Configuration Pages
export { ServicesPage } from './superadmin/components/services/ServicesPage';
export { S3ConfigPage } from './superadmin/components/services/S3ConfigPage';
export { MeilisearchConfigPage } from './superadmin/components/services/MeilisearchConfigPage';
export { ResendConfigPage } from './superadmin/components/services/ResendConfigPage';

// ============================================================================
// Utils
// ============================================================================
export {
  filterModules,
  defaultFilters,
  countActiveFilters,
  filtersToQueryParams,
  queryParamsToFilters,
} from './superadmin/utils/moduleFilters';
export type { ModuleFilters as ModuleFiltersType } from './superadmin/utils/moduleFilters';

// ============================================================================
// Menu Configuration
// ============================================================================
export { default as superAdminMenuConfig } from './menu.config';
