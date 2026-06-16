// ============================================================================
// AppDomoprimeISO3 Module - Service Layer
// ============================================================================
// Handles all API communication for the ISO3 module
// Matches Laravel backend: Modules/AppDomoprimeISO3 routes (api/admin/appdomoprime-iso3)
// ============================================================================

import { apiClient } from '@/shared/lib/api-client';

import type {
  Iso3ContractResultsResponse,
  Iso3AnahResultsResponse,
  Iso3TypeDateListResponse,
  Iso3TypeDateSaveResponse,
  SaveTypeDateData,
  Iso3PreviousEnergyListResponse,
  Iso3PreviousEnergyResponse,
  CreatePreviousEnergyData,
  UpdatePreviousEnergyData,
  Iso3PolluterPricingListResponse,
  Iso3PolluterPricingResponse,
  CreatePolluterSectorEnergyData,
  SaveCoefficientData,
  Iso3ImportResponse,
  Iso3MasterProductListResponse,
  Iso3SubventionTypeListResponse,
  Iso3QuotationResponse,
  Iso3QuotationListResponse,
  Iso3BillingListResponse,
  Iso3NewQuotationFormResponse,
  CreateQuotationMode,
  Iso3QuotationEligibilityResponse,
  Iso3SimulationResponse,
  Iso3SimulationInput,
  Iso3CreateQuotationInput,
  Iso3CreateQuotationResponse,
  CreateQuotationMeetingData,
  CreateQuotationContractData,
  UpdateQuotationMeetingData,
  UpdateQuotationContractData,
  CompanyModelListResponse,
  CompanyDocSignatureListResponse,
} from '../../types';

const BASE_URL = '/admin/appdomoprime-iso3';

// ============================================================================
// Contract Results Service (CUMAC results block)
// ============================================================================

export const iso3ResultsService = {
  async getResultsForContract(contractId: number, lang = 'fr'): Promise<Iso3ContractResultsResponse> {
    try {
      const response = await apiClient.get<Iso3ContractResultsResponse>(
        `${BASE_URL}/contracts/${contractId}/results`,
        { params: { lang } }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching ISO3 results for contract ${contractId}:`, error);
      throw error;
    }
  },

  async getResultsAnaForContract(contractId: number, lang = 'fr'): Promise<Iso3AnahResultsResponse> {
    try {
      const response = await apiClient.get<Iso3AnahResultsResponse>(
        `${BASE_URL}/contracts/${contractId}/results-anah`,
        { params: { lang } }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching ANAH results for contract ${contractId}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Settings & Dates Service
// ============================================================================

export const iso3SettingsService = {
  async listDates(): Promise<Iso3TypeDateListResponse> {
    try {
      const response = await apiClient.get<Iso3TypeDateListResponse>(
        `${BASE_URL}/dates`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching ISO3 dates:', error);
      throw error;
    }
  },

  async saveDates(dates: SaveTypeDateData[]): Promise<Iso3TypeDateSaveResponse> {
    try {
      const response = await apiClient.post<Iso3TypeDateSaveResponse>(
        `${BASE_URL}/dates`,
        { dates }
      );

      
return response.data;
    } catch (error) {
      console.error('Error saving ISO3 dates:', error);
      throw error;
    }
  },
};

// ============================================================================
// Previous Energy Service
// ============================================================================

export const iso3PreviousEnergyService = {
  async list(): Promise<Iso3PreviousEnergyListResponse> {
    try {
      const response = await apiClient.get<Iso3PreviousEnergyListResponse>(
        `${BASE_URL}/previous-energies`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching previous energies:', error);
      throw error;
    }
  },

  async store(data: CreatePreviousEnergyData): Promise<Iso3PreviousEnergyResponse> {
    try {
      const response = await apiClient.post<Iso3PreviousEnergyResponse>(
        `${BASE_URL}/previous-energies`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error('Error creating previous energy:', error);
      throw error;
    }
  },

  async update(id: number, data: UpdatePreviousEnergyData): Promise<Iso3PreviousEnergyResponse> {
    try {
      const response = await apiClient.put<Iso3PreviousEnergyResponse>(
        `${BASE_URL}/previous-energies/${id}`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating previous energy ${id}:`, error);
      throw error;
    }
  },

  async destroy(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `${BASE_URL}/previous-energies/${id}`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error deleting previous energy ${id}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// Polluter Pricing Service
// ============================================================================

export const iso3PricingService = {
  async listForPolluter(polluterId: number): Promise<Iso3PolluterPricingListResponse> {
    try {
      const response = await apiClient.get<Iso3PolluterPricingListResponse>(
        `${BASE_URL}/polluters/${polluterId}/pricing`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching pricing for polluter ${polluterId}:`, error);
      throw error;
    }
  },

  async storeForPolluter(
    polluterId: number,
    data: CreatePolluterSectorEnergyData
  ): Promise<Iso3PolluterPricingResponse> {
    try {
      const response = await apiClient.post<Iso3PolluterPricingResponse>(
        `${BASE_URL}/polluters/${polluterId}/pricing`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error(`Error creating pricing for polluter ${polluterId}:`, error);
      throw error;
    }
  },

  async destroy(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `${BASE_URL}/pricing/${id}`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error deleting pricing ${id}:`, error);
      throw error;
    }
  },

  async updateCoefficients(
    priceId: number,
    coefficients: SaveCoefficientData[]
  ): Promise<Iso3PolluterPricingResponse> {
    try {
      const response = await apiClient.post<Iso3PolluterPricingResponse>(
        `${BASE_URL}/pricing/${priceId}/coefficients`,
        { coefficients }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating coefficients for pricing ${priceId}:`, error);
      throw error;
    }
  },

  async importPricing(file: File): Promise<Iso3ImportResponse> {
    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await apiClient.post<Iso3ImportResponse>(
        `${BASE_URL}/pricing/import`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      
return response.data;
    } catch (error) {
      console.error('Error importing pricing:', error);
      throw error;
    }
  },

  async importSurfacePricing(file: File): Promise<Iso3ImportResponse> {
    try {
      const formData = new FormData();

      formData.append('file', file);

      const response = await apiClient.post<Iso3ImportResponse>(
        `${BASE_URL}/pricing/import-surface`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      
return response.data;
    } catch (error) {
      console.error('Error importing surface pricing:', error);
      throw error;
    }
  },
};

// ============================================================================
// Quotation Service
// ============================================================================

export const iso3QuotationService = {
  async checkEligibility(contractId: number): Promise<Iso3QuotationEligibilityResponse> {
    try {
      const response = await apiClient.get<Iso3QuotationEligibilityResponse>(
        `${BASE_URL}/contracts/${contractId}/quotation-eligibility`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error checking quotation eligibility for contract ${contractId}:`, error);
      throw error;
    }
  },

  async getNewForm(
    contractId: number,
    mode: CreateQuotationMode = 'standard'
  ): Promise<Iso3NewQuotationFormResponse> {
    try {
      const response = await apiClient.get<Iso3NewQuotationFormResponse>(
        `${BASE_URL}/quotations/contracts/${contractId}/new-form`,
        { params: { mode } }
      );


return response.data;
    } catch (error) {
      console.error(`Error fetching new quotation form for contract ${contractId}:`, error);
      throw error;
    }
  },

  async getNewFormForMeeting(
    meetingId: number,
    mode: CreateQuotationMode = 'standard'
  ): Promise<Iso3NewQuotationFormResponse> {
    try {
      const response = await apiClient.get<Iso3NewQuotationFormResponse>(
        `${BASE_URL}/quotations/meetings/${meetingId}/new-form`,
        { params: { mode } }
      );

      return response.data;
    } catch (error) {
      console.error(`Error fetching new quotation form for meeting ${meetingId}:`, error);
      throw error;
    }
  },

  async listMasterProducts(): Promise<Iso3MasterProductListResponse> {
    try {
      const response = await apiClient.get<Iso3MasterProductListResponse>(
        `${BASE_URL}/quotations/master-products`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching master products:', error);
      throw error;
    }
  },

  async listSubventionTypes(): Promise<Iso3SubventionTypeListResponse> {
    try {
      const response = await apiClient.get<Iso3SubventionTypeListResponse>(
        `${BASE_URL}/quotations/subvention-types`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching subvention types:', error);
      throw error;
    }
  },

  async listPricing(): Promise<Iso3PolluterPricingListResponse> {
    try {
      const response = await apiClient.get<Iso3PolluterPricingListResponse>(
        `${BASE_URL}/quotations/pricing`
      );

      
return response.data;
    } catch (error) {
      console.error('Error fetching quotation pricing:', error);
      throw error;
    }
  },

  async show(id: number): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.get<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/${id}`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching quotation ${id}:`, error);
      throw error;
    }
  },

  async createForMeeting(data: CreateQuotationMeetingData): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.post<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/meeting`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error('Error creating quotation for meeting:', error);
      throw error;
    }
  },

  async autoCreateForMeeting(data: CreateQuotationMeetingData): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.post<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/meeting/auto`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error('Error auto-creating quotation for meeting:', error);
      throw error;
    }
  },

  async updateForMeeting(id: number, data: UpdateQuotationMeetingData): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.put<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/meeting/${id}`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating meeting quotation ${id}:`, error);
      throw error;
    }
  },

  async createForContract(data: CreateQuotationContractData): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.post<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/contract`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error('Error creating quotation for contract:', error);
      throw error;
    }
  },

  async updateForContract(id: number, data: UpdateQuotationContractData): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.put<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/contract/${id}`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating contract quotation ${id}:`, error);
      throw error;
    }
  },

  async simulate(data: Iso3SimulationInput): Promise<Iso3SimulationResponse> {
    try {
      const response = await apiClient.post<Iso3SimulationResponse>(
        `${BASE_URL}/quotations/simulate`,
        data
      );


return response.data;
    } catch (error) {
      console.error('Error running simulation:', error);
      throw error;
    }
  },

  async simulateForContract(
    contractId: number,
    data: Iso3SimulationInput
  ): Promise<Iso3SimulationResponse> {
    try {
      const response = await apiClient.post<Iso3SimulationResponse>(
        `${BASE_URL}/quotations/contracts/${contractId}/simulate`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error running simulation for contract ${contractId}:`, error);
      throw error;
    }
  },

  async simulateForMeeting(
    meetingId: number,
    data: Iso3SimulationInput
  ): Promise<Iso3SimulationResponse> {
    try {
      const response = await apiClient.post<Iso3SimulationResponse>(
        `${BASE_URL}/quotations/meetings/${meetingId}/simulate`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error running simulation for meeting ${meetingId}:`, error);
      throw error;
    }
  },

  async createQuotationForContract(
    contractId: number,
    data: Iso3CreateQuotationInput
  ): Promise<Iso3CreateQuotationResponse> {
    try {
      const response = await apiClient.post<Iso3CreateQuotationResponse>(
        `${BASE_URL}/quotations/contracts/${contractId}/create`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error creating quotation for contract ${contractId}:`, error);
      throw error;
    }
  },

  async createQuotationForMeeting(
    meetingId: number,
    data: Iso3CreateQuotationInput
  ): Promise<Iso3CreateQuotationResponse> {
    try {
      const response = await apiClient.post<Iso3CreateQuotationResponse>(
        `${BASE_URL}/quotations/meetings/${meetingId}/create`,
        data
      );

      return response.data;
    } catch (error) {
      console.error(`Error creating quotation for meeting ${meetingId}:`, error);
      throw error;
    }
  },

  async getResults(id: number): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.get<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/${id}/results`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching results for quotation ${id}:`, error);
      throw error;
    }
  },

  async listForContract(contractId: number): Promise<Iso3QuotationListResponse> {
    try {
      const response = await apiClient.get<Iso3QuotationListResponse>(
        `${BASE_URL}/contracts/${contractId}/quotations`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching quotations for contract ${contractId}:`, error);
      throw error;
    }
  },

  async listForMeeting(meetingId: number): Promise<Iso3QuotationListResponse> {
    try {
      const response = await apiClient.get<Iso3QuotationListResponse>(
        `${BASE_URL}/meetings/${meetingId}/quotations`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching quotations for meeting ${meetingId}:`, error);
      throw error;
    }
  },

  async listBillingsForContract(contractId: number): Promise<Iso3BillingListResponse> {
    try {
      const response = await apiClient.get<Iso3BillingListResponse>(
        `${BASE_URL}/contracts/${contractId}/billings`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching billings for contract ${contractId}:`, error);
      throw error;
    }
  },

  async updateQuotation(id: number, data: Record<string, unknown>): Promise<Iso3QuotationResponse> {
    try {
      const response = await apiClient.put<Iso3QuotationResponse>(
        `${BASE_URL}/quotations/${id}`,
        data
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating quotation ${id}:`, error);
      throw error;
    }
  },

  async disableQuotation(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `${BASE_URL}/quotations/${id}/disable`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error disabling quotation ${id}:`, error);
      throw error;
    }
  },

  async enableQuotation(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.patch<{ success: boolean }>(
        `${BASE_URL}/quotations/${id}/enable`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error enabling quotation ${id}:`, error);
      throw error;
    }
  },

  async destroyQuotation(id: number): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(
        `${BASE_URL}/quotations/${id}`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error deleting quotation ${id}:`, error);
      throw error;
    }
  },

  async createBillingFromQuotation(
    id: number,
    options: { send_email?: boolean; create_asset?: boolean } = {}
  ): Promise<{ success: boolean; data: unknown }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: unknown }>(
        `${BASE_URL}/quotations/${id}/create-billing`,
        options
      );

      
return response.data;
    } catch (error) {
      console.error(`Error creating billing from quotation ${id}:`, error);
      throw error;
    }
  },

  async updateLastBillingFromQuotation(
    id: number,
    options: { send_email?: boolean } = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${BASE_URL}/quotations/${id}/update-last-billing`,
        options
      );

      
return response.data;
    } catch (error) {
      console.error(`Error updating last billing from quotation ${id}:`, error);
      throw error;
    }
  },

  async sendQuotationEmail(
    id: number,
    modelEmailId?: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${BASE_URL}/quotations/${id}/send-email`,
        { model_email_id: modelEmailId }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error sending quotation email ${id}:`, error);
      throw error;
    }
  },

  async refreshQuotationReference(id: number): Promise<{ success: boolean; reference: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; reference: string }>(
        `${BASE_URL}/quotations/${id}/refresh-reference`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error refreshing quotation reference ${id}:`, error);
      throw error;
    }
  },

  async listQuotationEmailModels(contractId: number): Promise<{ success: boolean; data: { id: number; subject: string }[] }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: { id: number; subject: string }[] }>(
        `${BASE_URL}/contracts/${contractId}/quotation-email-models`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching quotation email models for contract ${contractId}:`, error);
      throw error;
    }
  },

  async sendBillingEmail(billingId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        `${BASE_URL}/billings/${billingId}/send-email`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error sending billing email ${billingId}:`, error);
      throw error;
    }
  },

  async createAssetFromBilling(billingId: number): Promise<{ success: boolean; data: unknown }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: unknown }>(
        `${BASE_URL}/billings/${billingId}/create-asset`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error creating asset from billing ${billingId}:`, error);
      throw error;
    }
  },
};

// ============================================================================
// PDF Export Service
// ============================================================================

export const iso3ExportService = {
  async exportPdf(quotationId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/export/quotation/${quotationId}/pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting PDF for quotation ${quotationId}:`, error);
      throw error;
    }
  },

  async exportAllPdf(quotationId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/export/quotation/${quotationId}/all-pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting all PDFs for quotation ${quotationId}:`, error);
      throw error;
    }
  },

  async exportSignedPdf(quotationId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/export/quotation/${quotationId}/signed-pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting signed PDF for quotation ${quotationId}:`, error);
      throw error;
    }
  },

  async exportBillingPdf(billingId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/export/billing/${billingId}/pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting billing PDF ${billingId}:`, error);
      throw error;
    }
  },

  async exportPreMeetingPdf(contractId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/contracts/${contractId}/export/premeeting-pdf`,
        { responseType: 'blob' }
      );


return response.data;
    } catch (error) {
      console.error(`Error exporting pre-meeting PDF for contract ${contractId}:`, error);
      throw error;
    }
  },

  async exportPreMeetingPdfForMeeting(meetingId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/meetings/${meetingId}/export/premeeting-pdf`,
        { responseType: 'blob' }
      );

      return response.data;
    } catch (error) {
      console.error(`Error exporting pre-meeting PDF for meeting ${meetingId}:`, error);
      throw error;
    }
  },

  async exportAfterWorkPdf(contractId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/contracts/${contractId}/export/afterwork-pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting after-work PDF for contract ${contractId}:`, error);
      throw error;
    }
  },

  async exportAllDocumentsByContractPdf(contractId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/contracts/${contractId}/export/all-documents-pdf`,
        { responseType: 'blob' }
      );

      
return response.data;
    } catch (error) {
      console.error(`Error exporting all documents PDF for contract ${contractId}:`, error);
      throw error;
    }
  },

  async exportAllSignedByContractPdf(contractId: number): Promise<Blob> {
    try {
      const response = await apiClient.get(
        `${BASE_URL}/contracts/${contractId}/export/all-signed-pdf`,
        { responseType: 'blob' }
      );


return response.data;
    } catch (error) {
      console.error(`Error exporting all signed PDF for contract ${contractId}:`, error);
      throw error;
    }
  },

  // Official ITE AH document — single signed quotation PDF (Symfony documentITEForViewContract)
  async exportIteAhQuotationPdf(contractId: number): Promise<Blob> {
    const response = await apiClient.get(
      `${BASE_URL}/contracts/${contractId}/export/ite-ah-quotation-pdf`,
      { responseType: 'blob' }
    );

    return response.data;
  },

  // Official ITE AH billing — single signed billing PDF (Symfony documentITEBillingForViewContract)
  async exportIteAhBillingPdf(contractId: number): Promise<Blob> {
    const response = await apiClient.get(
      `${BASE_URL}/contracts/${contractId}/export/ite-ah-billing-pdf`,
      { responseType: 'blob' }
    );

    return response.data;
  },
};

// ============================================================================
// Company Models & Document Signatures Service
// ============================================================================

export const iso3CompanyDocsService = {
  async listCompanyModels(contractId: number): Promise<CompanyModelListResponse> {
    try {
      const response = await apiClient.get<CompanyModelListResponse>(
        `${BASE_URL}/contracts/${contractId}/company-models`
      );

      
return response.data;
    } catch (error) {
      console.error(`Error fetching company models for contract ${contractId}:`, error);
      throw error;
    }
  },

  async listCompanyDocSignatures(contractId: number): Promise<CompanyDocSignatureListResponse> {
    try {
      const response = await apiClient.get<CompanyDocSignatureListResponse>(
        `${BASE_URL}/contracts/${contractId}/company-doc-signatures`
      );


return response.data;
    } catch (error) {
      console.error(`Error fetching company doc signatures for contract ${contractId}:`, error);
      throw error;
    }
  },

  async exportCompanyModelPdf(contractId: number, modelId: number): Promise<Blob> {
    const response = await apiClient.get(
      `${BASE_URL}/contracts/${contractId}/company-models/${modelId}/export`,
      { responseType: 'blob' }
    );

    return response.data;
  },
};
