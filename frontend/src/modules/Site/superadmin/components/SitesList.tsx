'use client'

// React Imports
import { createContext, useContext, useState, useCallback, useEffect } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

// Component Imports
import type { AxiosError } from 'axios'

import SitesTable from './SitesTable'
import SiteFormModal from './SiteFormModal'
import { TenantModulesModal } from '@/modules/SuperAdmin'

// Hook Imports
import { useSite } from '../hooks/useSite'

// Service Imports
import { siteService } from '../services/siteService'

// Type Imports
import type {
  SiteListItem,
  SiteFilters,
  SitePaginationMeta,
  CreateSiteData,
  UpdateSiteData
} from '../../types/site.types'


// ============================================================================
// Context Definition
// ============================================================================
interface SitesContextType {
  sites: SiteListItem[]
  loading: boolean
  error: string | null
  pagination: SitePaginationMeta
  filters: SiteFilters
  globalSearch: string
  updateFilters: (newFilters: Partial<SiteFilters>) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  refresh: () => Promise<void>
}

const SitesContext = createContext<SitesContextType | undefined>(undefined)

export const useSitesContext = () => {
  const context = useContext(SitesContext)

  if (!context) {
    throw new Error('useSitesContext must be used within SitesList')
  }

  return context
}

// ============================================================================
// SitesList Component
// ============================================================================
export const SitesList = () => {
  // Site operations hook
  const {
    site,
    createSite,
    updateSite,
    deleteSite,
    testConnection,
    loadSite
  } = useSite()

  // States
  const [sites, setSites] = useState<SiteListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [pagination, setPagination] = useState<SitePaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: null,
    to: null
  })

  // Filters
  const [globalSearch, setGlobalSearch] = useState('')

  const [filters, setFilters] = useState<SiteFilters>({
    sort_by: 'site_id',
    sort_order: 'desc',
    per_page: 15
  })

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isModulesModalOpen, setIsModulesModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedSiteId, setSelectedSiteId] = useState<number | null>(null)
  const [selectedSiteName, setSelectedSiteName] = useState<string>('')

  // Activation state
  const [activatingId, setActivatingId] = useState<number | null>(null)

  // Connection result notification
  const [connectionResult, setConnectionResult] = useState<{
    show: boolean
    success: boolean
    message: string
  }>({ show: false, success: false, message: '' })

  // Load sites
  const loadSites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await siteService.getSites({
        ...filters,
        page: pagination.current_page,
        search: globalSearch || undefined
      })

      if (response.success) {
        setSites(response.data)
        setPagination(response.meta)
      }
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message: string }>
      const errorMessage = axiosError.response?.data?.message || 'Erreur lors du chargement des sites'

      setError(errorMessage)
      console.error('Error loading sites:', err)
    } finally {
      setLoading(false)
    }
  }, [pagination.current_page, filters, globalSearch])

  // Load sites on mount and when dependencies change
  useEffect(() => {
    loadSites()
  }, [loadSites])

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<SiteFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Set page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, current_page: page }))
  }, [])

  // Set page size
  const setPageSize = useCallback((pageSize: number) => {
    setFilters(prev => ({ ...prev, per_page: pageSize }))
    setPagination(prev => ({ ...prev, per_page: pageSize, current_page: 1 }))
  }, [])

  // Set search
  const setSearch = useCallback((search: string) => {
    setGlobalSearch(search)
  }, [])

  // Refresh
  const refresh = useCallback(async () => {
    await loadSites()
  }, [loadSites])

  // ============================================================================
  // Handlers
  // ============================================================================
  const handleCreateClick = useCallback(() => {
    setSelectedSiteId(null)
    setFormMode('create')
    setIsFormModalOpen(true)
  }, [])

  const handleEditClick = useCallback(async (siteItem: SiteListItem) => {
    setSelectedSiteId(siteItem.id)
    setFormMode('edit')
    await loadSite(siteItem.id)
    setIsFormModalOpen(true)
  }, [loadSite])

  const handleManageModules = useCallback((siteItem: SiteListItem) => {
    setSelectedSiteId(siteItem.id)
    setSelectedSiteName(siteItem.host || siteItem.company || `Site #${siteItem.id}`)
    setIsModulesModalOpen(true)
  }, [])

  const handleDeleteClick = useCallback(async (siteItem: SiteListItem) => {
    const deleteDb = window.confirm('Voulez-vous également supprimer la base de données ?')

    try {
      await deleteSite(siteItem.id, deleteDb)
      await loadSites()
    } catch (err) {
      console.error('Error deleting site:', err)
    }
  }, [deleteSite, loadSites])

  const handleTestConnection = useCallback(async (siteItem: SiteListItem) => {
    try {
      const success = await testConnection(siteItem.id)

      setConnectionResult({
        show: true,
        success,
        message: success
          ? 'Connexion réussie à la base de données'
          : 'Échec de la connexion à la base de données'
      })
    } catch (err) {
      setConnectionResult({
        show: true,
        success: false,
        message: 'Erreur lors du test de connexion'
      })
    }
  }, [testConnection])

  const handleActivate = useCallback(async (siteItem: SiteListItem) => {
    if (!window.confirm(`Voulez-vous activer le site "${siteItem.host}" ? Cela va exécuter les migrations de la base de données.`)) {
      return
    }

    try {
      setActivatingId(siteItem.id)
      const result = await siteService.activateSite(siteItem.id)

      setConnectionResult({
        show: true,
        success: result.success,
        message: result.success
          ? 'Site activé avec succès ! Migrations exécutées.'
          : result.message || 'Échec de l\'activation'
      })

      await loadSites()
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message: string }>

      setConnectionResult({
        show: true,
        success: false,
        message: axiosError.response?.data?.message || 'Erreur lors de l\'activation du site'
      })
    } finally {
      setActivatingId(null)
    }
  }, [loadSites])

  const handleFormSubmit = useCallback(async (data: CreateSiteData | UpdateSiteData) => {
    try {
      if (formMode === 'create') {
        await createSite(data as CreateSiteData)
      } else if (selectedSiteId) {
        await updateSite(selectedSiteId, data as UpdateSiteData)
      }

      await loadSites()
      setIsFormModalOpen(false)
      setSelectedSiteId(null)
    } catch (err) {
      console.error('Form submission error:', err)
      throw err
    }
  }, [formMode, selectedSiteId, createSite, updateSite, loadSites])

  const handleCloseFormModal = useCallback(() => {
    setIsFormModalOpen(false)
    setSelectedSiteId(null)
  }, [])

  const handleCloseModulesModal = useCallback(() => {
    setIsModulesModalOpen(false)
    setSelectedSiteId(null)
    setSelectedSiteName('')
  }, [])

  const handleCloseSnackbar = useCallback(() => {
    setConnectionResult({ show: false, success: false, message: '' })
  }, [])

  // Context value
  const contextValue: SitesContextType = {
    sites,
    loading,
    error,
    pagination,
    filters,
    globalSearch,
    updateFilters,
    setPage,
    setPageSize,
    setSearch,
    refresh
  }

  return (
    <SitesContext.Provider value={contextValue}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          {/* Error Message */}
          {error && (
            <Alert severity="error" className="mb-6">
              {error}
            </Alert>
          )}

          {/* Sites Table */}
          <SitesTable
            sites={sites}
            isLoading={loading}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onManageModules={handleManageModules}
            onTestConnection={handleTestConnection}
            onActivate={handleActivate}
            activatingId={activatingId}
            onAdd={handleCreateClick}
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={refresh}
            onSearch={setSearch}
          />
        </Grid>
      </Grid>

      {/* Form Modal */}
      <SiteFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        site={formMode === 'edit' ? site : null}
        mode={formMode}
      />

      {/* Modules Management Modal */}
      {selectedSiteId && (
        <TenantModulesModal
          isOpen={isModulesModalOpen}
          onClose={handleCloseModulesModal}
          tenantId={selectedSiteId}
          tenantName={selectedSiteName}
        />
      )}

      {/* Connection Result Snackbar */}
      <Snackbar
        open={connectionResult.show}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={connectionResult.success ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {connectionResult.message}
        </Alert>
      </Snackbar>
    </SitesContext.Provider>
  )
}

export default SitesList
