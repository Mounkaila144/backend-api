import { useState, useEffect, useCallback } from 'react'

import type { SyntheticEvent } from 'react'

import { iso3QuotationService, iso3ExportService } from '@/modules/AppDomoprimeISO3'
import type { DomoprimeQuotation, DomoprimeBilling } from '@/modules/AppDomoprime/types'
import type { ContractTranslations } from '../../../../../hooks/useContractTranslations'

import { downloadBlob } from './helpers'

interface NotificationState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

export function useDocumentState(contractId: number | null, t: ContractTranslations & Record<string, string>) {
  const [quotations, setQuotations] = useState<DomoprimeQuotation[]>([])
  const [billings, setBillings] = useState<DomoprimeBilling[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [expandedQuotation, setExpandedQuotation] = useState(false)
  const [expandedBilling, setExpandedBilling] = useState(false)
  const [expandedCompanyModels, setExpandedCompanyModels] = useState(false)
  const [expandedCompanyDocs, setExpandedCompanyDocs] = useState(false)

  // Editing state (inline edit form replaces list — same as Symfony AJAX replace)
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null)

  // Notification state (Snackbar)
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Billing dialog state
  const [billingDialogOpen, setBillingDialogOpen] = useState(false)
  const [billingQuotationId, setBillingQuotationId] = useState<number | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)

  const handleCloseNotification = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setNotification(prev => ({ ...prev, open: false }))
  }

  const showNotification = useCallback((message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity })
  }, [])

  const fetchDocuments = useCallback(async () => {
    if (!contractId) return

    setLoading(true)
    setError(null)

    try {
      const [quotRes, billRes] = await Promise.all([
        iso3QuotationService.listForContract(contractId),
        iso3QuotationService.listBillingsForContract(contractId),
      ])

      setQuotations(quotRes.data.quotations)
      setBillings(billRes.data.billings)
    } catch {
      setError(t.docLoadError)
    } finally {
      setLoading(false)
    }
  }, [contractId, t.docLoadError])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Derived data
  const activeQuotations = quotations.filter(q => q.status === 'ACTIVE')
  const lastQuotation = activeQuotations.find(q => q.is_last === 'YES') ?? activeQuotations[0]
  const activeBillings = billings.filter(b => b.status === 'ACTIVE')
  const lastBilling = activeBillings.find(b => b.is_last === 'YES') ?? activeBillings[0]

  // Download handlers
  const handleDownloadPdf = useCallback(async (quotationId: number, ref: string) => {
    const key = `pdf-${quotationId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportPdf(quotationId)

      downloadBlob(blob, `devis_${ref || quotationId}.pdf`)
    } catch {
      setError(t.docDownloadError ?? 'Erreur lors du téléchargement')
    } finally {
      setDownloading(null)
    }
  }, [t.docDownloadError])

  const handleDownloadAllPdf = useCallback(async (quotationId: number, ref: string) => {
    const key = `all-${quotationId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportAllPdf(quotationId)

      downloadBlob(blob, `documents_${ref || quotationId}.pdf`)
    } catch {
      setError(t.docDownloadError ?? 'Erreur lors du téléchargement')
    } finally {
      setDownloading(null)
    }
  }, [t.docDownloadError])

  const handleDownloadSignedPdf = useCallback(async (quotationId: number, ref: string) => {
    const key = `signed-${quotationId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportSignedPdf(quotationId)

      downloadBlob(blob, `devis_signe_${ref || quotationId}.pdf`)
    } catch {
      setError(t.docDownloadError ?? 'Erreur lors du téléchargement')
    } finally {
      setDownloading(null)
    }
  }, [t.docDownloadError])

  // Quotation action handlers
  const handleDisableQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmDisable)) return

    try {
      await iso3QuotationService.disableQuotation(quotationId)
      showNotification(t.docSuccessDisabled, 'success')
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification, fetchDocuments])

  const handleEnableQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmEnable)) return

    try {
      await iso3QuotationService.enableQuotation(quotationId)
      showNotification(t.docSuccessEnabled, 'success')
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification, fetchDocuments])

  const handleRemoveQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmRemove)) return

    try {
      await iso3QuotationService.destroyQuotation(quotationId)
      showNotification(t.docSuccessRemoved, 'success')
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification, fetchDocuments])

  // Editing handlers
  const startEditing = useCallback((quotationId: number) => {
    setEditingQuotationId(quotationId)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingQuotationId(null)
  }, [])

  const handleSaveQuotation = useCallback(async () => {
    setEditingQuotationId(null)
    await fetchDocuments()
  }, [fetchDocuments])

  // Billing dialog handlers
  const openBillingDialog = useCallback((quotationId: number) => {
    setBillingQuotationId(quotationId)
    setBillingDialogOpen(true)
  }, [])

  const closeBillingDialog = useCallback(() => {
    setBillingDialogOpen(false)
    setBillingQuotationId(null)
  }, [])

  const handleCreateBilling = useCallback(async (options: { send_email: boolean; create_asset: boolean }) => {
    if (!billingQuotationId) return

    setBillingLoading(true)

    try {
      await iso3QuotationService.createBillingFromQuotation(billingQuotationId, options)
      showNotification(t.docSuccessBillingCreated, 'success')
      closeBillingDialog()
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    } finally {
      setBillingLoading(false)
    }
  }, [billingQuotationId, t, showNotification, closeBillingDialog, fetchDocuments])

  // Billing action handlers
  const handleDownloadBillingPdf = useCallback(async (billingId: number, ref: string) => {
    const key = `billing-pdf-${billingId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportBillingPdf(billingId)

      downloadBlob(blob, `facture_${ref || billingId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [t.docDownloadError, showNotification])

  const handleSendBillingEmail = useCallback(async (billingId: number) => {
    try {
      await iso3QuotationService.sendBillingEmail(billingId)
      showNotification(t.docSuccessEmailSent ?? 'Email envoyé', 'success')
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification])

  const handleCreateAssetFromBilling = useCallback(async (billingId: number) => {
    try {
      await iso3QuotationService.createAssetFromBilling(billingId)
      showNotification(t.docSuccessAssetCreated ?? 'Avoir créé', 'success')
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification])

  // Update last billing from quotation
  const handleUpdateLastBilling = useCallback(async (quotationId: number) => {
    try {
      await iso3QuotationService.updateLastBillingFromQuotation(quotationId)
      showNotification(t.docSuccessBillingCreated ?? 'Facture mise à jour', 'success')
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification, fetchDocuments])

  // Refresh quotation reference
  const handleRefreshReference = useCallback(async (quotationId: number) => {
    try {
      await iso3QuotationService.refreshQuotationReference(quotationId)
      showNotification(t.docActionRefreshReference ?? 'Référence actualisée', 'success')
      await fetchDocuments()
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification, fetchDocuments])

  // Send quotation email
  const handleSendQuotationEmail = useCallback(async (quotationId: number, modelEmailId?: number) => {
    try {
      await iso3QuotationService.sendQuotationEmail(quotationId, modelEmailId)
      showNotification(t.docEmailSendSuccess ?? 'Email envoyé', 'success')
    } catch {
      showNotification(t.docErrorAction, 'error')
    }
  }, [t, showNotification])

  // Contract-level PDF downloads (each document type has its own endpoint)
  const handleDownloadPreMeetingPdf = useCallback(async () => {
    if (!contractId) return
    const key = `premeeting-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportPreMeetingPdf(contractId)

      downloadBlob(blob, `document_pre_visite_${contractId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  const handleDownloadAfterWorkPdf = useCallback(async () => {
    if (!contractId) return
    const key = `afterwork-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportAfterWorkPdf(contractId)

      downloadBlob(blob, `document_fin_travaux_${contractId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  const handleDownloadAllDocsPdf = useCallback(async () => {
    if (!contractId) return
    const key = `alldocs-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportAllDocumentsByContractPdf(contractId)

      downloadBlob(blob, `tous_documents_${contractId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  const handleDownloadAllSignedPdf = useCallback(async () => {
    if (!contractId) return
    const key = `allsigned-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportAllSignedByContractPdf(contractId)

      downloadBlob(blob, `documents_signes_${contractId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  // Official ITE AH document — opens inline in a new tab (Symfony parity).
  const handleDownloadAhQuotation = useCallback(async () => {
    if (!contractId) return
    const key = `ah-quotation-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportIteAhQuotationPdf(contractId)
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  const handleDownloadAhBilling = useCallback(async () => {
    if (!contractId) return
    const key = `ah-billing-${contractId}`

    setDownloading(key)

    try {
      const blob = await iso3ExportService.exportIteAhBillingPdf(contractId)
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [contractId, t.docDownloadError, showNotification])

  return {
    loading,
    error,
    downloading,
    quotations,
    activeQuotations,
    lastQuotation,
    activeBillings,
    lastBilling,
    expandedQuotation,
    setExpandedQuotation,
    expandedBilling,
    setExpandedBilling,
    expandedCompanyModels,
    setExpandedCompanyModels,
    expandedCompanyDocs,
    setExpandedCompanyDocs,
    handleDownloadPdf,
    handleDownloadAllPdf,
    handleDownloadSignedPdf,
    fetchDocuments,

    // Quotation actions
    handleDisableQuotation,
    handleEnableQuotation,
    handleRemoveQuotation,

    // Editing
    editingQuotationId,
    startEditing,
    cancelEditing,
    handleSaveQuotation,

    // Billing dialog
    billingDialogOpen,
    billingLoading,
    openBillingDialog,
    closeBillingDialog,
    handleCreateBilling,

    // Billing actions
    handleDownloadBillingPdf,
    handleSendBillingEmail,
    handleCreateAssetFromBilling,
    handleUpdateLastBilling,

    // Contract-level document downloads
    handleDownloadPreMeetingPdf,
    handleDownloadAfterWorkPdf,
    handleDownloadAllDocsPdf,
    handleDownloadAllSignedPdf,
    handleDownloadAhQuotation,
    handleDownloadAhBilling,

    // Quotation extra actions
    handleRefreshReference,
    handleSendQuotationEmail,

    // Notifications
    notification,
    handleCloseNotification,
  }
}
