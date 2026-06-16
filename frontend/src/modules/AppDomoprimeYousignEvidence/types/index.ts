// ============================================================================
// AppDomoprimeYousignEvidence — Type Definitions
// ============================================================================
// Mirrors the Laravel backend payloads from
// Modules/AppDomoprimeYousignEvidence/Http/Controllers/Admin/YousignEvidenceController.
// ============================================================================

export interface YousignEvidenceSigner {
  firstname: string | null
  lastname: string | null
  email: string | null
  phone: string | null
}

export interface YousignEvidenceSignatureStatus {
  has_signature: boolean
  is_signed: boolean
  is_initiator?: boolean
  signed_at: string | null
  state: string | null
  status: string | null
  errors?: string | null
  filename?: string | null
  batch?: number | null
  signer?: YousignEvidenceSigner | null
  procedure_id?: string | null
  sign_id?: number
  link_id?: number
  contract_id?: number | null
  quotation_id?: number | null
  billing_id?: number | null
  model_id?: number | null
  created_at?: string | null
  is_last?: boolean
}

export interface YousignEvidenceContractSignatures {
  quotations: Array<YousignEvidenceSignatureStatus & { kind: 'quotation' }>
  billings: Array<YousignEvidenceSignatureStatus & { kind: 'billing' }>
  company_documents: Array<YousignEvidenceSignatureStatus & { kind: 'company_document' }>
}

export interface YousignEvidenceStatusResponse {
  success: boolean
  data: YousignEvidenceSignatureStatus
}

export interface YousignEvidenceContractResponse {
  success: boolean
  data: YousignEvidenceContractSignatures
}
