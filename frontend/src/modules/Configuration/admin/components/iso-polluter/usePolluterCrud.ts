'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import { apiClient } from '@/shared/lib/api-client'
import { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'
import { usePermissions } from '@/shared/contexts/PermissionsContext'

import type { FilterState, FormData, PolluterItem, SubSectionKey } from './types'
import { emptyFilter, emptyForm } from './types'

const BASE = '/admin/appdomoprime/iso/polluters'

/**
 * Encapsulates all state, permissions, derived values, and side-effecting handlers
 * for the polluter CRUD page. Keeping this in a hook lets the orchestrator component
 * focus on layout — the data + behaviour live here, can be tested in isolation, and
 * are reusable if we ever surface polluter management elsewhere.
 *
 * Mirrors theme32a granular permissions:
 *   sites/themes/admin/theme32a/designs/default/templates/app_domoprime/app_domoprime_ajaxListPartialPollutingCompany.tpl
 */
export function usePolluterCrud() {
  const t = useConfigTranslations()
  const { hasCredential } = usePermissions()

  const [items, setItems] = useState<PolluterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterState>(emptyFilter)

  // Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PolluterItem | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Delete (soft)
  const [deletingItem, setDeletingItem] = useState<PolluterItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Remove (hard)
  const [removingItem, setRemovingItem] = useState<PolluterItem | null>(null)
  const [removing, setRemoving] = useState(false)

  // Import
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Sub-section navigation
  const [subSection, setSubSection] = useState<{ key: SubSectionKey; polluter: PolluterItem } | null>(null)

  // ─── Permissions (granular per-action) ────────────────────────────────────

  const can = useMemo(
    () => ({
      view:           hasCredential([['superadmin', 'admin', 'app_domoprime_settings_view_polluter']]),
      contacts:       hasCredential([['superadmin', 'admin', 'app_domoprime_settings_contracts_polluter']]),
      layer:          hasCredential([['superadmin', 'admin', 'app_domoprime_settings_layer_list_polluter']]),
      pricing:        hasCredential([['superadmin', 'admin', 'app_domoprime_settings_pricing_list_polluter']]),
      properties:     hasCredential([['superadmin', 'admin', 'app_domoprime_settings_properties_list_polluter']]),
      boilerPack:     hasCredential([['superadmin', 'admin', 'app_domoprime_settings_boiler_pack_list_polluter']]),
      itePrice:       hasCredential([['superadmin', 'admin', 'app_domoprime_settings_ite_price_list_polluter']]),
      models:         hasCredential([['superadmin', 'admin', 'app_domoprime_settings_models_list_polluter']]),
      docModels:      hasCredential([['superadmin', 'admin', 'app_domoprime_settings_documents_models_list_polluter']]),
      preMeeting:     hasCredential([['superadmin', 'admin', 'app_domoprime_settings_premeeting_models_list_polluter']]),
      quotationModel: hasCredential([['superadmin', 'admin', 'app_domoprime_settings_quotation_models_list_polluter']]),
      documents:      hasCredential([['superadmin', 'admin', 'app_domoprime_settings_documents_list_polluter']]),
      billingModel:   hasCredential([['superadmin', 'admin', 'app_domoprime_settings_billing_models_list_polluter']]),
      afterWork:      hasCredential([['superadmin', 'admin', 'app_domoprime_settings_after_work_models_list_polluter']]),
      recipients:     hasCredential([['superadmin', 'admin', 'app_domoprime_settings_recipient_list_polluter']]),
      exportOne:      hasCredential([['superadmin', 'admin', 'app_domoprime_settings_export_polluter']]),
      delete:         hasCredential([['superadmin', 'admin', 'app_domoprime_settings_delete_polluter']]),
      remove:         hasCredential([['superadmin', 'admin', 'app_domoprime_settings_remove_polluter']]),
      superadmin:     hasCredential([['superadmin']]),
    }),
    [hasCredential],
  )

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, string> = {
        order_by: filter.order_by,
        order_dir: filter.order_dir,
      }
      if (filter.is_active !== 'ALL') params.is_active = filter.is_active
      if (filter.name) params.name = filter.name
      if (filter.commercial) params.commercial = filter.commercial
      if (filter.postcode) params.postcode = filter.postcode
      if (filter.city) params.city = filter.city
      if (filter.phone) params.phone = filter.phone

      const res = await apiClient.get<{ success: boolean; data: PolluterItem[] }>(BASE, { params })
      if (res.data.success) setItems(res.data.data)
    } catch {
      setError(t.settingsLoadError)
    } finally {
      setLoading(false)
    }
  }, [filter, t.settingsLoadError])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // ─── Sort ─────────────────────────────────────────────────────────────────

  const handleSort = useCallback((col: string) => {
    setFilter(prev => ({
      ...prev,
      order_by: col,
      order_dir: prev.order_by === col && prev.order_dir === 'asc' ? 'desc' : 'asc',
    }))
  }, [])

  // ─── Field updater ────────────────────────────────────────────────────────

  const setField = useCallback((key: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }, [])

  // ─── Edit dialog ──────────────────────────────────────────────────────────

  const handleOpenCreate = useCallback(() => {
    setEditingItem(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }, [])

  const handleOpenEdit = useCallback((item: PolluterItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      commercial: item.commercial ?? '',
      type: item.type ?? '',
      is_active: item.is_active,
      is_default: item.is_default,
      email: item.email ?? '',
      web: item.web ?? '',
      phone: item.phone ?? '',
      mobile: item.mobile ?? '',
      fax: item.fax ?? '',
      address1: item.address1 ?? '',
      address2: item.address2 ?? '',
      postcode: item.postcode ?? '',
      city: item.city ?? '',
      country: item.country ?? '',
      ape: item.ape ?? '',
      siret: item.siret ?? '',
      tva: item.tva ?? '',
    })
    setDialogOpen(true)
  }, [])

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false)
    setEditingItem(null)
    setFormData(emptyForm)
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      if (editingItem) {
        const res = await apiClient.put<{ success: boolean; data: PolluterItem }>(
          `${BASE}/${editingItem.id}`,
          formData,
        )
        if (res.data.success) {
          setItems(prev => prev.map(i => (i.id === editingItem.id ? res.data.data : i)))
          setSuccessMsg(t.settingsSaved)
          handleCloseDialog()
        }
      } else {
        const res = await apiClient.post<{ success: boolean; data: PolluterItem }>(BASE, formData)
        if (res.data.success) {
          setItems(prev => [...prev, res.data.data])
          setSuccessMsg(t.settingsSaved)
          handleCloseDialog()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setSaving(false)
    }
  }, [editingItem, formData, handleCloseDialog, t.settingsSaved, t.settingsSaveError])

  // ─── Toggle is_active inline ──────────────────────────────────────────────

  const handleToggleActive = useCallback(async (item: PolluterItem) => {
    try {
      const res = await apiClient.patch<{ success: boolean; data: PolluterItem }>(
        `${BASE}/${item.id}/toggle-active`,
      )
      if (res.data.success) {
        setItems(prev => prev.map(i => (i.id === item.id ? res.data.data : i)))
        setSuccessMsg(t.isoPolluterToggled)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    }
  }, [t.isoPolluterToggled, t.settingsSaveError])

  // ─── Delete (soft) ────────────────────────────────────────────────────────

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingItem) return
    setDeleting(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${deletingItem.id}`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== deletingItem.id))
        setSuccessMsg(t.settingsSaved)
        setDeletingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setDeleting(false)
    }
  }, [deletingItem, t.settingsSaved, t.settingsSaveError])

  // ─── Remove (hard) ────────────────────────────────────────────────────────

  const handleConfirmRemove = useCallback(async () => {
    if (!removingItem) return
    setRemoving(true)
    setError(null)
    try {
      const res = await apiClient.delete<{ success: boolean }>(`${BASE}/${removingItem.id}/remove`)
      if (res.data.success) {
        setItems(prev => prev.filter(i => i.id !== removingItem.id))
        setSuccessMsg(t.settingsSaved)
        setRemovingItem(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setRemoving(false)
    }
  }, [removingItem, t.settingsSaved, t.settingsSaveError])

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleImport = useCallback(async () => {
    if (!importFile) return
    setImporting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', importFile)
      const res = await apiClient.post<{ success: boolean; message: string }>(
        `${BASE}/import`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      if (res.data.success) {
        setSuccessMsg(res.data.message || t.isoPolluterImported)
        setImportDialogOpen(false)
        setImportFile(null)
        fetchItems()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settingsSaveError)
    } finally {
      setImporting(false)
    }
  }, [importFile, fetchItems, t.isoPolluterImported, t.settingsSaveError])

  // ─── Export ───────────────────────────────────────────────────────────────

  const handleExportAll = useCallback(() => {
    window.open(`/api${BASE}/export`, '_blank')
  }, [])

  const handleExportOne = useCallback((id: number) => {
    window.open(`/api${BASE}/${id}/export`, '_blank')
  }, [])

  return {
    // i18n
    t,

    // List state
    items,
    loading,
    error,
    successMsg,
    setError,
    setSuccessMsg,

    // Filter / sort
    filter,
    setFilter,
    handleSort,

    // Permissions
    can,

    // Edit dialog
    dialogOpen,
    editingItem,
    formData,
    saving,
    setField,
    handleOpenCreate,
    handleOpenEdit,
    handleCloseDialog,
    handleSave,

    // Inline toggle
    handleToggleActive,

    // Delete (soft)
    deletingItem,
    deleting,
    setDeletingItem,
    handleConfirmDelete,

    // Remove (hard)
    removingItem,
    removing,
    setRemovingItem,
    handleConfirmRemove,

    // Import
    importDialogOpen,
    importFile,
    importing,
    setImportDialogOpen,
    setImportFile,
    handleImport,

    // Export
    handleExportAll,
    handleExportOne,

    // Sub-section navigation
    subSection,
    setSubSection,
  }
}
