import { useState, useEffect, useCallback } from 'react'

import type { SyntheticEvent } from 'react'

import { iso3QuotationService, iso3ExportService } from '@/modules/AppDomoprimeISO3'
import type { DomoprimeQuotation } from '@/modules/AppDomoprime/types'
import { downloadBlob } from '@/modules/CustomersContracts/admin/components/contract-edit/tabs/sub-tabs/documents/helpers'

import type { MeetingTranslations } from '../../../../hooks/useMeetingTranslations'

interface NotificationState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

/**
 * Mirror of useDocumentState (contract) but tailored to the meeting view:
 * - no billings (a meeting cannot be billed; that happens after contract conversion)
 * - no contract-level multi-doc exports (after-work, all-docs, all-signed,
 *   ITE AH official). Only the pre-meeting PDF is exposed.
 */
export function useMeetingDocumentState(meetingId: number | null, t: MeetingTranslations & Record<string, string>) {
  const [quotations, setQuotations] = useState<DomoprimeQuotation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingQuotationId, setEditingQuotationId] = useState<number | null>(null)

  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'success',
  })

  const showNotification = useCallback((message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, message, severity })
  }, [])

  const handleCloseNotification = (_event?: SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return
    setNotification(prev => ({ ...prev, open: false }))
  }

  const fetchQuotations = useCallback(async () => {
    if (!meetingId) return

    setLoading(true)
    setError(null)

    try {
      const res = await iso3QuotationService.listForMeeting(meetingId)
      setQuotations(res.data.quotations)
    } catch {
      setError(t.docLoadError ?? 'Erreur lors du chargement des devis')
    } finally {
      setLoading(false)
    }
  }, [meetingId, t.docLoadError])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const activeQuotations = quotations.filter(q => q.status === 'ACTIVE')
  const lastQuotation = activeQuotations.find(q => q.is_last === 'YES') ?? activeQuotations[0]

  const handleDownloadPdf = useCallback(async (quotationId: number, ref: string) => {
    const key = `pdf-${quotationId}`
    setDownloading(key)
    try {
      const blob = await iso3ExportService.exportPdf(quotationId)
      downloadBlob(blob, `devis_${ref || quotationId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [t.docDownloadError, showNotification])

  const handleDisableQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmDisable ?? 'Désactiver ce devis ?')) return
    try {
      await iso3QuotationService.disableQuotation(quotationId)
      showNotification(t.docSuccessDisabled ?? 'Devis désactivé', 'success')
      await fetchQuotations()
    } catch {
      showNotification(t.docErrorAction ?? 'Erreur lors de l\'action', 'error')
    }
  }, [t, showNotification, fetchQuotations])

  const handleEnableQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmEnable ?? 'Activer ce devis ?')) return
    try {
      await iso3QuotationService.enableQuotation(quotationId)
      showNotification(t.docSuccessEnabled ?? 'Devis activé', 'success')
      await fetchQuotations()
    } catch {
      showNotification(t.docErrorAction ?? 'Erreur lors de l\'action', 'error')
    }
  }, [t, showNotification, fetchQuotations])

  const handleDownloadPreMeetingPdf = useCallback(async () => {
    if (!meetingId) return
    const key = `premeeting-${meetingId}`
    setDownloading(key)
    try {
      const blob = await iso3ExportService.exportPreMeetingPdfForMeeting(meetingId)
      downloadBlob(blob, `document_pre_visite_meeting_${meetingId}.pdf`)
    } catch {
      showNotification(t.docDownloadError ?? 'Erreur lors du téléchargement', 'error')
    } finally {
      setDownloading(null)
    }
  }, [meetingId, t.docDownloadError, showNotification])

  const openCreateDialog = useCallback(() => setCreateDialogOpen(true), [])
  const closeCreateDialog = useCallback(() => setCreateDialogOpen(false), [])
  const handleQuotationCreated = useCallback(async () => {
    setCreateDialogOpen(false)
    await fetchQuotations()
  }, [fetchQuotations])

  const startEditing = useCallback((quotationId: number) => {
    setEditingQuotationId(quotationId)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingQuotationId(null)
  }, [])

  const handleSaveQuotation = useCallback(async () => {
    setEditingQuotationId(null)
    await fetchQuotations()
  }, [fetchQuotations])

  const handleRemoveQuotation = useCallback(async (quotationId: number) => {
    if (!window.confirm(t.docConfirmRemove ?? 'Supprimer définitivement ce devis ?')) return
    try {
      await iso3QuotationService.destroyQuotation(quotationId)
      showNotification(t.docSuccessRemoved ?? 'Devis supprimé', 'success')
      await fetchQuotations()
    } catch {
      showNotification(t.docErrorAction ?? 'Erreur lors de l\'action', 'error')
    }
  }, [t, showNotification, fetchQuotations])

  return {
    loading,
    error,
    downloading,
    quotations,
    activeQuotations,
    lastQuotation,
    fetchQuotations,
    handleDownloadPdf,
    handleDisableQuotation,
    handleEnableQuotation,
    handleRemoveQuotation,
    handleDownloadPreMeetingPdf,
    notification,
    handleCloseNotification,
    showNotification,
    createDialogOpen,
    openCreateDialog,
    closeCreateDialog,
    handleQuotationCreated,
    editingQuotationId,
    startEditing,
    cancelEditing,
    handleSaveQuotation,
  }
}
