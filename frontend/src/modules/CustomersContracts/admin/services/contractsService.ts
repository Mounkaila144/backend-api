// ============================================================================
// CustomersContracts Module - Service Layer
// ============================================================================
// This service handles all API communication for the CustomersContracts module
// following the repository pattern from the Laravel backend.
// ============================================================================

import { apiClient } from '@/shared/lib/api-client';
import type {
  ContractListResponse,
  ContractDetailResponse,
  ContractStatsResponse,
  ContractHistoryResponse,
  ContractActionResponse,
  ContractFilters,
  CreateContractData,
  UpdateContractData,
  FilterOptionsResponse,
  ContractTabsResponse,
  TabDataResponse,
  ContractProductItem,
  ContractCommentItem,
  ContractEmailItem,
  ContractSmsItem,
  ContractDocumentItem,
  ContractInstallationItem,
  ContractLocalisation,
  ContractBillingItem,
  ContractWhatsAppItem,
  ContractStepsData,
  DocumentCheckerItem,
  ContractRequestItem,
  ContractAssetItem,
} from '../../types';

const CONTRACTS_BASE_URL = '/admin/customerscontracts/contracts';

/**
 * CustomersContracts Service
 * Provides methods to interact with the contracts API
 */
export const contractsService = {
  /**
   * Get paginated list of contracts with optional filters
   * @param filters - Optional filters for search, pagination, sorting, etc.
   * @returns Promise with paginated contracts data
   */
  async getContracts(filters?: ContractFilters): Promise<ContractListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          if (value === undefined || value === null || value === '') continue
          params.append(key, String(value))
        }
      }

      const url = `${CONTRACTS_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get<ContractListResponse>(url);

      
return response.data;
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },

  /**
   * Get single contract by ID with all relations
   * @param id - Contract ID
   * @returns Promise with contract details
   */
  async getContract(id: number): Promise<ContractDetailResponse> {
    try {
      const response = await apiClient.get<ContractDetailResponse>(`${CONTRACTS_BASE_URL}/${id}`);

      
return response.data;
    } catch (error) {
      console.error(`Error fetching contract ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get contract statistics
   * @returns Promise with aggregated statistics
   */
  async getStatistics(): Promise<ContractStatsResponse> {
    try {
      const response = await apiClient.get<ContractStatsResponse>(`${CONTRACTS_BASE_URL}/statistics`);

      
return response.data;
    } catch (error) {
      console.error('Error fetching contract statistics:', error);
      throw error;
    }
  },

  /**
   * Get contract history (change log)
   * @param id - Contract ID
   * @returns Promise with contract history
   */
  async getContractHistory(id: number): Promise<ContractHistoryResponse> {
    try {
      const response = await apiClient.get<ContractHistoryResponse>(`${CONTRACTS_BASE_URL}/${id}/history`);

      
return response.data;
    } catch (error) {
      console.error(`Error fetching contract ${id} history:`, error);
      throw error;
    }
  },

  /**
   * Create new contract
   * @param data - Contract creation data
   * @returns Promise with created contract
   */
  async createContract(data: CreateContractData): Promise<ContractDetailResponse> {
    try {
      const response = await apiClient.post<ContractDetailResponse>(CONTRACTS_BASE_URL, data);

      
return response.data;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  },

  /**
   * Update existing contract
   * @param id - Contract ID
   * @param data - Contract update data
   * @returns Promise with updated contract
   */
  async updateContract(id: number, data: UpdateContractData): Promise<ContractDetailResponse> {
    try {
      const response = await apiClient.put<ContractDetailResponse>(`${CONTRACTS_BASE_URL}/${id}`, data);

      
return response.data;
    } catch (error) {
      console.error(`Error updating contract ${id}:`, error);
      throw error;
    }
  },

  /**
   * Soft delete contract (sets status to DELETE)
   * @param id - Contract ID
   * @returns Promise with success message
   */
  async deleteContract(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `${CONTRACTS_BASE_URL}/${id}`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error deleting contract ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get filter dropdown options (statuses, users, teams, partners, etc.)
   * Matches Symfony's CustomerContractsFormFilter choices.
   */
  async getFilterOptions(lang: string = 'fr'): Promise<FilterOptionsResponse> {
    try {
      const response = await apiClient.get<FilterOptionsResponse>(
        `${CONTRACTS_BASE_URL}/filter-options?lang=${lang}`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching filter options:', error);
      throw error;
    }
  },

  /**
   * Generate unique contract reference
   * @param prefix - Reference prefix (default: 'CONT')
   * @returns Promise with generated reference
   */
  async generateReference(prefix: string = 'CONT'): Promise<{ success: boolean; reference: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; reference: string }>(
        `${CONTRACTS_BASE_URL}/generate-reference`,
        { prefix }
      );

      
return response.data;
    } catch (error) {
      console.error('Error generating contract reference:', error);
      throw error;
    }
  },

  // ─── Contract Action Endpoints ────────────────────────────

  async confirmContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/confirm`);

    
return response.data;
  },

  async unconfirmContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unconfirm`);

    
return response.data;
  },

  async cancelContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/cancel`);

    
return response.data;
  },

  async uncancelContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/uncancel`);

    
return response.data;
  },

  async blowingContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/blowing`);

    
return response.data;
  },

  async unblowingContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unblowing`);

    
return response.data;
  },

  async placementContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/placement`);

    
return response.data;
  },

  async unplacementContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unplacement`);

    
return response.data;
  },

  async holdContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/hold`);

    
return response.data;
  },

  async unholdContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unhold`);

    
return response.data;
  },

  async holdAdminContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/hold-admin`);

    
return response.data;
  },

  async unholdAdminContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unhold-admin`);

    
return response.data;
  },

  async holdQuoteContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/hold-quote`);

    
return response.data;
  },

  async unholdQuoteContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/unhold-quote`);

    
return response.data;
  },

  async copyContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.post<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/copy`);

    
return response.data;
  },

  async createDefaultProducts(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.post<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/create-default-products`);

    
return response.data;
  },

  async recycleContract(id: number): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/recycle`);

    
return response.data;
  },

  async toggleField(id: number, field: string): Promise<ContractActionResponse> {
    const response = await apiClient.patch<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/toggle-field`, { field });

    
return response.data;
  },

  // ─── Communication ────────────────────────────────────────

  async sendSms(id: number, data: { message: string }): Promise<ContractActionResponse> {
    const response = await apiClient.post<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/send-sms`, data);

    
return response.data;
  },

  async sendEmail(id: number, data: { subject: string; body: string }): Promise<ContractActionResponse> {
    const response = await apiClient.post<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${id}/send-email`, data);

    
return response.data;
  },

  // ─── Comments ─────────────────────────────────────────────

  async addComment(contractId: number, comment: string): Promise<ContractActionResponse> {
    const response = await apiClient.post<ContractActionResponse>(`${CONTRACTS_BASE_URL}/${contractId}/comments`, { comment });

    
return response.data;
  },

  // ─── Tab Data ───────────────────────────────────────────────

  async getTabs(namespace = 'dashboard-site-customers-contract-view'): Promise<ContractTabsResponse> {
    const response = await apiClient.get<ContractTabsResponse>(`${CONTRACTS_BASE_URL}/tabs`, {
      params: { namespace },
    });

    
return response.data;
  },

  async getContractProducts(contractId: number): Promise<TabDataResponse<ContractProductItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractProductItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/products`);

    
return response.data;
  },

  async getContractComments(contractId: number, status = 'ACTIVE'): Promise<TabDataResponse<ContractCommentItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractCommentItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/tab-comments`, {
      params: { status },
    });

    
return response.data;
  },

  async storeContractComment(contractId: number, comment: string): Promise<TabDataResponse<{ id: number }>> {
    const response = await apiClient.post<TabDataResponse<{ id: number }>>(`${CONTRACTS_BASE_URL}/${contractId}/tab-comments`, { comment });

    
return response.data;
  },

  async deleteContractComment(contractId: number, commentId: number): Promise<TabDataResponse<null>> {
    const response = await apiClient.delete<TabDataResponse<null>>(`${CONTRACTS_BASE_URL}/${contractId}/tab-comments/${commentId}`);

    
return response.data;
  },

  async getContractEmails(contractId: number): Promise<TabDataResponse<ContractEmailItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractEmailItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/emails`);

    
return response.data;
  },

  async getContractSms(contractId: number): Promise<TabDataResponse<ContractSmsItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractSmsItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/sms`);

    
return response.data;
  },

  async getContractDocuments(contractId: number): Promise<TabDataResponse<ContractDocumentItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractDocumentItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/documents`);

    
return response.data;
  },

  async getContractInstallations(contractId: number): Promise<TabDataResponse<ContractInstallationItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractInstallationItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/installations`);

    
return response.data;
  },

  async getContractLocalisation(contractId: number): Promise<TabDataResponse<ContractLocalisation | null>> {
    const response = await apiClient.get<TabDataResponse<ContractLocalisation | null>>(`${CONTRACTS_BASE_URL}/${contractId}/localisation`);

    
return response.data;
  },

  async getContractBilling(contractId: number): Promise<TabDataResponse<ContractBillingItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractBillingItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/billing`);

    
return response.data;
  },

  async getContractWhatsApp(contractId: number): Promise<TabDataResponse<ContractWhatsAppItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractWhatsAppItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/whatsapp`);

    
return response.data;
  },

  async getContractPartnerWhatsApp(contractId: number): Promise<TabDataResponse<ContractWhatsAppItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractWhatsAppItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/partner-whatsapp`);

    
return response.data;
  },

  async getContractDocCheck(contractId: number): Promise<TabDataResponse<DocumentCheckerItem[]>> {
    const response = await apiClient.get<TabDataResponse<DocumentCheckerItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/doc-check`);

    
return response.data;
  },

  async getContractSteps(contractId: number): Promise<TabDataResponse<ContractStepsData>> {
    const response = await apiClient.get<TabDataResponse<ContractStepsData>>(`${CONTRACTS_BASE_URL}/${contractId}/steps`);

    
return response.data;
  },

  async getContractRequests(contractId: number): Promise<TabDataResponse<ContractRequestItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractRequestItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/requests`);

    
return response.data;
  },

  async getContractAssets(contractId: number): Promise<TabDataResponse<ContractAssetItem[]>> {
    const response = await apiClient.get<TabDataResponse<ContractAssetItem[]>>(`${CONTRACTS_BASE_URL}/${contractId}/assets`);

    
return response.data;
  },

  async getContractAttributions(contractId: number): Promise<TabDataResponse<any>> {
    const response = await apiClient.get<TabDataResponse<any>>(`${CONTRACTS_BASE_URL}/${contractId}/attributions`);

    
return response.data;
  },
};
