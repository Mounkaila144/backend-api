'use client'

import { useState, useCallback, useEffect } from 'react'

import { tourGeneratorService } from '../services/tourGeneratorService'
import type {
  Tour,
  TourGroup,
  TourGeneratorMessage,
  GenerateTourParams,
} from '../../types'

type TourStep = 'configure' | 'generating' | 'results' | 'error'

interface TourSettings {
  tour_mapbox_access_token?: string
  [key: string]: any
}

interface UseTourGeneratorReturn {
  step: TourStep
  generating: boolean
  tour: Tour | null
  groups: TourGroup[]
  messages: TourGeneratorMessage[]
  error: string | null
  availableSalespeople: Array<{ id: number; name: string }>
  settings: TourSettings
  generateTour: (params: GenerateTourParams) => Promise<boolean>
  loadTour: (id: number) => Promise<void>
  assignSalesperson: (groupId: number, salespersonId: number) => Promise<boolean>
  deleteTour: () => Promise<boolean>
  reset: () => void
}

export const useTourGenerator = (): UseTourGeneratorReturn => {
  const [step, setStep] = useState<TourStep>('configure')
  const [generating, setGenerating] = useState(false)
  const [tour, setTour] = useState<Tour | null>(null)
  const [groups, setGroups] = useState<TourGroup[]>([])
  const [messages, setMessages] = useState<TourGeneratorMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [availableSalespeople, setAvailableSalespeople] = useState<Array<{ id: number; name: string }>>([])
  const [settings, setSettings] = useState<TourSettings>({})

  // Load settings on mount (for mapbox token etc.)
  useEffect(() => {
    tourGeneratorService.getSettings().then(res => {
      if (res.success) setSettings(res.data)
    }).catch(() => { /* ignore */ })
  }, [])

  const generateTour = useCallback(async (params: GenerateTourParams): Promise<boolean> => {
    try {
      setStep('generating')
      setGenerating(true)
      setError(null)

      const response = await tourGeneratorService.generate(params)

      if (response.success) {
        setTour(response.data.tour)
        setGroups(response.data.groups)
        setMessages(response.data.messages)
        setStep('results')

        // Load full tour data with available salespeople
        try {
          const detail = await tourGeneratorService.getTour(response.data.tour.id)
          if (detail.success) {
            setAvailableSalespeople(detail.data.available_salespeople)
          }
        } catch { /* ignore */ }

        return true
      } else {
        setError(response.message || 'Tour generation failed')
        setMessages(response.data?.messages || [])
        setStep('error')
        return false
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'An error occurred'
      setError(msg)
      setMessages(err?.response?.data?.data?.messages || [])
      setStep('error')
      return false
    } finally {
      setGenerating(false)
    }
  }, [])

  const loadTour = useCallback(async (id: number) => {
    try {
      const response = await tourGeneratorService.getTour(id)
      if (response.success) {
        setTour(response.data.tour)
        setGroups(response.data.groups)
        setAvailableSalespeople(response.data.available_salespeople)
        setStep('results')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load tour')
      setStep('error')
    }
  }, [])

  const assignSalesperson = useCallback(async (groupId: number, salespersonId: number): Promise<boolean> => {
    if (!tour) return false
    try {
      const response = await tourGeneratorService.assignSalesperson(tour.id, groupId, salespersonId)
      if (response.success) {
        // Update local group state
        setGroups(prev => prev.map(g => {
          if (g.id === groupId) {
            const sp = availableSalespeople.find(s => s.id === salespersonId)
            return { ...g, sale_id: salespersonId, salesperson: sp || null }
          }
          return g
        }))
        return true
      }
      return false
    } catch {
      return false
    }
  }, [tour, availableSalespeople])

  const deleteTour = useCallback(async (): Promise<boolean> => {
    if (!tour) return false
    try {
      const response = await tourGeneratorService.deleteTour(tour.id)
      if (response.success) {
        reset()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [tour])

  const reset = useCallback(() => {
    setStep('configure')
    setTour(null)
    setGroups([])
    setMessages([])
    setError(null)
    setAvailableSalespeople([])
    setGenerating(false)
  }, [])

  return {
    step, generating, tour, groups, messages, error, availableSalespeople, settings,
    generateTour, loadTour, assignSalesperson, deleteTour, reset,
  }
}
