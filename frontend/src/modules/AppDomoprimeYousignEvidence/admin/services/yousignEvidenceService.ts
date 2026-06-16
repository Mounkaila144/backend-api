// ============================================================================
// AppDomoprimeYousignEvidence — Service Layer
// ============================================================================
// Backend prefix: /api/admin/appdomoprime-yousign-evidence
// ============================================================================

import { apiClient } from '@/shared/lib/api-client';

import type {
  YousignEvidenceContractResponse,
  YousignEvidenceStatusResponse,
} from '../../types';

const BASE_URL = '/admin/appdomoprime-yousign-evidence';

// -----------------------------------------------------------------------------
// Phase A — Read-only signature status
// -----------------------------------------------------------------------------

export const yousignEvidenceService = {
  async getQuotationSignatureStatus(quotationId: number): Promise<YousignEvidenceStatusResponse> {
    const response = await apiClient.get<YousignEvidenceStatusResponse>(
      `${BASE_URL}/quotations/${quotationId}/signature-status`,
    );

    return response.data;
  },

  async getBillingSignatureStatus(billingId: number): Promise<YousignEvidenceStatusResponse> {
    const response = await apiClient.get<YousignEvidenceStatusResponse>(
      `${BASE_URL}/billings/${billingId}/signature-status`,
    );

    return response.data;
  },

  async getCompanyDocSignatureStatus(
    contractId: number,
    modelId: number,
  ): Promise<YousignEvidenceStatusResponse> {
    const response = await apiClient.get<YousignEvidenceStatusResponse>(
      `${BASE_URL}/contracts/${contractId}/company-documents/${modelId}/signature-status`,
    );

    return response.data;
  },

  async listForContract(contractId: number): Promise<YousignEvidenceContractResponse> {
    const response = await apiClient.get<YousignEvidenceContractResponse>(
      `${BASE_URL}/contracts/${contractId}/signatures`,
    );

    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Phase A — Download already-signed PDFs
  // ---------------------------------------------------------------------------

  async downloadSignedQuotationPdf(quotationId: number): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/quotations/${quotationId}/signed-pdf`, {
      responseType: 'blob',
    });

    return response.data;
  },

  async downloadSignedBillingPdf(billingId: number): Promise<Blob> {
    const response = await apiClient.get(`${BASE_URL}/billings/${billingId}/signed-pdf`, {
      responseType: 'blob',
    });

    return response.data;
  },

  async downloadSignedCompanyDocPdf(contractId: number, modelId: number): Promise<Blob> {
    const response = await apiClient.get(
      `${BASE_URL}/contracts/${contractId}/company-documents/${modelId}/signed-pdf`,
      { responseType: 'blob' },
    );

    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Phase C — Send for signature (returns 501 until backend wired)
  // ---------------------------------------------------------------------------

  async sendQuotationForSignature(quotationId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/quotations/${quotationId}/send-for-signature`,
    );

    return response.data;
  },

  async sendBillingForSignature(billingId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/billings/${billingId}/send-for-signature`,
    );

    return response.data;
  },

  async sendCompanyDocForSignature(
    contractId: number,
    modelId: number,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${BASE_URL}/contracts/${contractId}/company-documents/${modelId}/send-for-signature`,
    );

    return response.data;
  },

  async deleteQuotationSignature(quotationId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/quotations/${quotationId}/signature`,
    );

    return response.data;
  },

  async deleteBillingSignature(billingId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/billings/${billingId}/signature`,
    );

    return response.data;
  },

  async deleteCompanyDocSignature(
    contractId: number,
    modelId: number,
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `${BASE_URL}/contracts/${contractId}/company-documents/${modelId}/signature`,
    );

    return response.data;
  },
};
