import { apiClient } from '@/shared/lib/api-client'
import type {
  TourGenerateResponse,
  TourDetailResponse,
  GenerateTourParams,
  TourIndicator,
} from '../../types'

const TOURS_BASE_URL = '/admin/customersmeetings/tours'

export const tourGeneratorService = {
  async generate(params: GenerateTourParams): Promise<TourGenerateResponse> {
    const response = await apiClient.post<TourGenerateResponse>(`${TOURS_BASE_URL}/generate`, params)
    return response.data
  },

  async getTour(id: number): Promise<TourDetailResponse> {
    const response = await apiClient.get<TourDetailResponse>(`${TOURS_BASE_URL}/${id}`)
    return response.data
  },

  async assignSalesperson(tourId: number, groupId: number, salespersonId: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      `${TOURS_BASE_URL}/${tourId}/groups/${groupId}/assign`,
      { salesperson_id: salespersonId }
    )
    return response.data
  },

  async deleteTour(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`${TOURS_BASE_URL}/${id}`)
    return response.data
  },

  async getToursByRange(start: string, end: string): Promise<{ success: boolean; data: TourIndicator[] }> {
    const response = await apiClient.get<{ success: boolean; data: TourIndicator[] }>(
      `${TOURS_BASE_URL}/by-range?start=${start}&end=${end}`
    )
    return response.data
  },

  async getSettings(): Promise<{ success: boolean; data: Record<string, any> }> {
    const response = await apiClient.get<{ success: boolean; data: Record<string, any> }>(`${TOURS_BASE_URL}/settings`)
    return response.data
  },

  async updateSettings(data: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put<{ success: boolean; message: string }>(`${TOURS_BASE_URL}/settings`, data)
    return response.data
  },
}
