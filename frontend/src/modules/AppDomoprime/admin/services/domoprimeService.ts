// ============================================================================
// AppDomoprime Module - Service Layer
// ============================================================================
// Handles all API communication for the AppDomoprime module
// Matches Laravel backend: Modules/AppDomoprime routes (api/admin/appdomoprime)
// ============================================================================

import { apiClient } from '@/shared/lib/api-client';

import type {
  DomoprimeIsoRequestResponse,
  CreateIsoCustomerRequestData,
  UpdateIsoCustomerRequestData,
  DomoprimeCalculationResponse,
  DomoprimeQuotationResponse,
  DomoprimeQuotationListResponse,
  DomoprimeBillingResponse,
  DomoprimeAssetResponse,
  DomoprimeFilterOptionsResponse,
} from '../../types';

const BASE_URL = '/admin/appdomoprime';

// ============================================================================
// ISO Customer Request Service (t_domoprime_iso_customer_request)
// ============================================================================

export const domoprimeIsoService = {
  /**
   * Get ISO request by contract ID
   */
  async getByContractId(contractId: number): Promise<DomoprimeIsoRequestResponse> {
    try {
      const response = await apiClient.get<DomoprimeIsoRequestResponse>(
        `${BASE_URL}/iso-requests/contract/${contractId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching ISO request for contract ${contractId}:`, error);
      throw error;
    }
  },

  /**
   * Get ISO request by ID
   */
  async getById(id: number): Promise<DomoprimeIsoRequestResponse> {
    try {
      const response = await apiClient.get<DomoprimeIsoRequestResponse>(
        `${BASE_URL}/iso-requests/${id}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching ISO request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create new ISO customer request
   */
  async create(data: CreateIsoCustomerRequestData): Promise<DomoprimeIsoRequestResponse> {
    try {
      const response = await apiClient.post<DomoprimeIsoRequestResponse>(
        `${BASE_URL}/iso-requests`,
        data
      );

      return response.data;
    } catch (error) {
      console.error('Error creating ISO request:', error);
      throw error;
    }
  },

  /**
   * Update ISO customer request
   */
  async update(id: number, data: UpdateIsoCustomerRequestData): Promise<DomoprimeIsoRequestResponse> {
    try {
      const response = await apiClient.put<DomoprimeIsoRequestResponse>(
        `${BASE_URL}/iso-requests/${id}`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error updating ISO request ${id}:`, error);
      throw error;
    }
  },

  /**
   * Auto-save a single field (matches Symfony ajaxAutoSaveRequestForViewContract)
   */
  async autoSaveField(
    contractId: number,
    field: string,
    value: string | number | null
  ): Promise<DomoprimeIsoRequestResponse> {
    try {
      const response = await apiClient.patch<DomoprimeIsoRequestResponse>(
        `${BASE_URL}/iso-requests/contract/${contractId}/field`,
        { field, value }
      );

      return response.data;
    } catch (error) {
      console.error(`Error auto-saving ISO field ${field}:`, error);
      throw error;
    }
  },

  /**
   * Delete ISO customer request
   */
  async delete(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `${BASE_URL}/iso-requests/${id}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error deleting ISO request ${id}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Domoprime Reference Data Service (filter options for dropdowns)
// ============================================================================

export const domoprimeReferenceService = {
  /**
   * Get all filter options for domoprime forms
   */
  async getFilterOptions(): Promise<DomoprimeFilterOptionsResponse> {
    try {
      const response = await apiClient.get<DomoprimeFilterOptionsResponse>(
        `${BASE_URL}/filter-options`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching domoprime filter options:', error);
      throw error;
    }
  },
};

// ============================================================================
// Calculation Service
// ============================================================================

export const domoprimeCalculationService = {
  /**
   * Get calculation for a contract
   */
  async getByContractId(contractId: number): Promise<DomoprimeCalculationResponse> {
    try {
      const response = await apiClient.get<DomoprimeCalculationResponse>(
        `${BASE_URL}/calculations/contract/${contractId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching calculation for contract ${contractId}:`, error);
      throw error;
    }
  },

  /**
   * Run calculation
   */
  async calculate(contractId: number): Promise<DomoprimeCalculationResponse> {
    try {
      const response = await apiClient.post<DomoprimeCalculationResponse>(
        `${BASE_URL}/calculations/contract/${contractId}/calculate`
      );

      return response.data;
    } catch (error) {
      console.error(`Error running calculation for contract ${contractId}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Quotation Service
// ============================================================================

export const domoprimeQuotationService = {
  /**
   * Get quotations for a contract
   */
  async getByContractId(contractId: number): Promise<DomoprimeQuotationListResponse> {
    try {
      const response = await apiClient.get<DomoprimeQuotationListResponse>(
        `${BASE_URL}/quotations/contract/${contractId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching quotations for contract ${contractId}:`, error);
      throw error;
    }
  },

  /**
   * Get single quotation
   */
  async getById(id: number): Promise<DomoprimeQuotationResponse> {
    try {
      const response = await apiClient.get<DomoprimeQuotationResponse>(
        `${BASE_URL}/quotations/${id}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching quotation ${id}:`, error);
      throw error;
    }
  },

  /**
   * Generate quotation from ISO request
   */
  async generateFromRequest(contractId: number): Promise<DomoprimeQuotationResponse> {
    try {
      const response = await apiClient.post<DomoprimeQuotationResponse>(
        `${BASE_URL}/quotations/contract/${contractId}/generate`
      );

      return response.data;
    } catch (error) {
      console.error(`Error generating quotation for contract ${contractId}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Billing Service
// ============================================================================

export const domoprimeBillingService = {
  /**
   * Get billing for a contract
   */
  async getByContractId(contractId: number): Promise<DomoprimeBillingResponse> {
    try {
      const response = await apiClient.get<DomoprimeBillingResponse>(
        `${BASE_URL}/billings/contract/${contractId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching billing for contract ${contractId}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Asset Service
// ============================================================================

export const domoprimeAssetService = {
  /**
   * Get asset for a contract
   */
  async getByContractId(contractId: number): Promise<DomoprimeAssetResponse> {
    try {
      const response = await apiClient.get<DomoprimeAssetResponse>(
        `${BASE_URL}/assets/contract/${contractId}`
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching asset for contract ${contractId}:`, error);
      throw error;
    }
  },
};
