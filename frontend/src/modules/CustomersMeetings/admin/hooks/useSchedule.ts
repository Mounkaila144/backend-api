'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

import { meetingsService } from '../services/meetingsService'
import type { ScheduleEvent, ScheduleFilters } from '../../types'

interface UseScheduleReturn {
  events: ScheduleEvent[]
  loading: boolean
  error: string | null
  total: number
  filters: ScheduleFilters
  setFilters: (filters: ScheduleFilters) => void
  updateFilter: (key: keyof ScheduleFilters, value: any) => void
  loadSchedule: (start: string, end: string) => Promise<void>
  rescheduleMeeting: (id: number, inAt: string, outAt?: string) => Promise<boolean>
  refreshSchedule: () => Promise<void>
}

export const useSchedule = (initialFilters?: Partial<ScheduleFilters>): UseScheduleReturn => {
  const [events, setEvents] = useState<ScheduleEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay() + 1)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const [filters, setFilters] = useState<ScheduleFilters>({
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
    status: 'ACTIVE',
    ...initialFilters,
  })

  const mountedRef = useRef(true)
  const lastRangeRef = useRef({ start: filters.start, end: filters.end })

  const fetchSchedule = useCallback(async (currentFilters: ScheduleFilters) => {
    try {
      setLoading(true)
      setError(null)

      const response = await meetingsService.getSchedule(currentFilters)

      if (!mountedRef.current) return

      if (response.success) {
        setEvents(response.data || [])
        setTotal(response.meta?.total || 0)
      } else {
        setError('Failed to load schedule')
        setEvents([])
      }
    } catch (err) {
      if (!mountedRef.current) return
      console.error('Error loading schedule:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while loading schedule')
      setEvents([])
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  const loadSchedule = useCallback(async (start: string, end: string) => {
    lastRangeRef.current = { start, end }
    const newFilters = { ...filters, start, end }
    setFilters(newFilters)
    await fetchSchedule(newFilters)
  }, [filters, fetchSchedule])

  const updateFilter = useCallback((key: keyof ScheduleFilters, value: any) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value }
      fetchSchedule(updated)
      return updated
    })
  }, [fetchSchedule])

  const rescheduleMeeting = useCallback(async (id: number, inAt: string, outAt?: string): Promise<boolean> => {
    try {
      const response = await meetingsService.rescheduleMeeting(id, { in_at: inAt, out_at: outAt })
      if (response.success) {
        await fetchSchedule(filters)
        return true
      }
      return false
    } catch (err) {
      console.error(`Error rescheduling meeting ${id}:`, err)
      setError(err instanceof Error ? err.message : 'Failed to reschedule meeting')
      return false
    }
  }, [filters, fetchSchedule])

  const refreshSchedule = useCallback(async () => {
    await fetchSchedule(filters)
  }, [filters, fetchSchedule])

  useEffect(() => {
    mountedRef.current = true
    fetchSchedule(filters)
    return () => { mountedRef.current = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    events,
    loading,
    error,
    total,
    filters,
    setFilters,
    updateFilter,
    loadSchedule,
    rescheduleMeeting,
    refreshSchedule,
  }
}
