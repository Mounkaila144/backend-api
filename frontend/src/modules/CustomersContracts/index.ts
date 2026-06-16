// ============================================================================
// CustomersContracts Module - Public API Exports
// ============================================================================
// This file serves as the public API for the CustomersContracts module
// following the barrel export pattern for clean imports
// ============================================================================

// Admin Layer Components
export { default as ContractsList1 } from './admin/components/ContractsList1';

// Admin Layer Services
export { contractsService } from './admin/services/contractsService';

// Admin Layer Hooks
export { useContracts } from './admin/hooks/useContracts';
export { useContract } from './admin/hooks/useContract';
export { useContractTranslations } from './admin/hooks/useContractTranslations';
export { useContractTabs } from './admin/hooks/useContractTabs';

// Type Exports
export type {

  // Main Entities
  CustomerContract,
  ContractStatus,
  ContractAdminStatus,
  ContractInstallStatus,
  ContractProduct,
  ContractContributor,
  ContractHistory,

  // API Response Types
  ContractListResponse,
  ContractDetailResponse,
  ContractStatsResponse,
  ContractHistoryResponse,

  // Filter & Form Types
  ContractFilters,
  CreateContractData,
  UpdateContractData,

  // Tabs
  ContractTab,
  ContractTabsResponse,

  // Utility Types
  ContractSortField,
  ContractStatusType,
  ContractUserApplication,
} from './types';
