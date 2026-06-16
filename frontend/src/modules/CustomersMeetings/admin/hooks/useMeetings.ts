'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import { meetingsService } from '../services/meetingsService'
import type {
  CustomerMeeting,
  MeetingFilters,
  CreateMeetingData,
  UpdateMeetingData,
} from '../../types'

interface UseMeetingsReturn {
  meetings: CustomerMeeting[]
  loading: boolean
  error: string | null
  currentPage: number
  totalPages: number
  total: number
  perPage: number
  filters: MeetingFilters
  permittedFields: Set<string>
  setCurrentPage: (page: number) => void
  setPerPage: (perPage: number) => void
  setFilters: (filters: MeetingFilters) => void
  updateFilter: (key: keyof MeetingFilters, value: any) => void
  clearFilters: () => void
  refreshMeetings: () => Promise<void>
  deleteMeeting: (id: number) => Promise<boolean>
  createMeeting: (data: CreateMeetingData) => Promise<void>
  updateMeeting: (id: number, data: UpdateMeetingData) => Promise<void>
  getMeeting: (id: number) => Promise<CustomerMeeting | null>
}

const defaultFilters: MeetingFilters = {
  status: 'ACTIVE',
  sort_by: 'in_at',
  sort_order: 'desc',
  per_page: 15,
  page: 1,
  with_relations: true,
}

export const useMeetings = (initialFilters?: Partial<MeetingFilters> | Record<string, any>): UseMeetingsReturn => {
  const [meetings, setMeetings] = useState<CustomerMeeting[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [total, setTotal] = useState<number>(0)
  const [perPage, setPerPage] = useState<number>(15)
  const [permittedFields, setPermittedFields] = useState<Set<string>>(new Set())

  const [filters, setFilters] = useState<MeetingFilters>({
    ...defaultFilters,
    ...initialFilters,
  })

  const mountedRef = useRef(true)

  const loadMeetings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await meetingsService.getMeetings({
        ...filters,
        page: currentPage,
        per_page: perPage,
      })

      // Ignore response if component was unmounted (StrictMode cleanup)
      if (!mountedRef.current) return

      if (response.success) {
        let meetingsData: CustomerMeeting[] = []

        if (response.data && typeof response.data === 'object' && 'meetings' in response.data) {
          meetingsData = response.data.meetings
        } else if (Array.isArray(response.data)) {
          meetingsData = response.data
        }

        setMeetings(meetingsData)

        const paginationMeta = response.meta || response.data?.pagination

        if (paginationMeta) {
          setTotalPages(paginationMeta.last_page)
          setTotal(paginationMeta.total)

          if ('permitted_fields' in paginationMeta && Array.isArray(paginationMeta.permitted_fields)) {
            setPermittedFields(new Set(paginationMeta.permitted_fields))
          }
        }
      } else {
        setError('Failed to load meetings')
        setMeetings([])
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Error loading meetings:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while loading meetings')
      setMeetings([])
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [filters, currentPage, perPage])

  const updateFilter = useCallback((key: keyof MeetingFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }, [])

  const refreshMeetings = useCallback(async () => {
    await loadMeetings()
  }, [loadMeetings])

  const deleteMeeting = useCallback(async (id: number): Promise<boolean> => {
    try {
      const confirmed = window.confirm('Are you sure you want to delete this meeting?')

      if (!confirmed) return false

      const response = await meetingsService.deleteMeeting(id)

      if (response.success) {
        await loadMeetings()
        
return true
      }

      
return false
    } catch (err) {
      console.error(`Error deleting meeting ${id}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to delete meeting')
      
return false
    }
  }, [loadMeetings])

  const createMeeting = useCallback(async (data: CreateMeetingData): Promise<void> => {
    const response = await meetingsService.createMeeting(data)

    if (response.success) {
      await loadMeetings()
    } else {
      throw new Error('Failed to create meeting')
    }
  }, [loadMeetings])

  const updateMeeting = useCallback(async (id: number, data: UpdateMeetingData): Promise<void> => {
    const response = await meetingsService.updateMeeting(id, data)

    if (response.success) {
      await loadMeetings()
    } else {
      throw new Error('Failed to update meeting')
    }
  }, [loadMeetings])

  const getMeeting = useCallback(async (id: number): Promise<CustomerMeeting | null> => {
    try {
      const response = await meetingsService.getMeeting(id)

      
return response.success ? response.data : null
    } catch (err) {
      console.error(`Error fetching meeting ${id}:`, err)
      
return null
    }
  }, [])

  const handleSetPerPage = useCallback((newPerPage: number) => {
    setPerPage(newPerPage)
    setCurrentPage(1)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadMeetings()

    
return () => {
      mountedRef.current = false
    }
  }, [loadMeetings])

  return {
    meetings,
    loading,
    error,
    currentPage,
    totalPages,
    total,
    perPage,
    filters,
    permittedFields,
    setCurrentPage,
    setPerPage: handleSetPerPage,
    setFilters,
    updateFilter,
    clearFilters,
    refreshMeetings,
    deleteMeeting,
    createMeeting,
    updateMeeting,
    getMeeting,
  }
}
