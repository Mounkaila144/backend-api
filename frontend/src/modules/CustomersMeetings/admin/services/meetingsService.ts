import { apiClient } from '@/shared/lib/api-client'
import type {
  MeetingListResponse,
  MeetingDetailResponse,
  MeetingActionResponse,
  MeetingHistoryResponse,
  MeetingFilters,
  CreateMeetingData,
  UpdateMeetingData,
  FilterOptionsResponse,
  ScheduleResponse,
  ScheduleFilters,
} from '../../types'

const MEETINGS_BASE_URL = '/admin/customersmeetings/meetings'

export const meetingsService = {
  async getMeetings(filters?: MeetingFilters): Promise<MeetingListResponse> {
    const params = new URLSearchParams()

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null || value === '') continue
        params.append(key, String(value))
      }
    }

    const url = `${MEETINGS_BASE_URL}${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get<MeetingListResponse>(url)

    
return response.data
  },

  async getMeeting(id: number): Promise<MeetingDetailResponse> {
    const response = await apiClient.get<MeetingDetailResponse>(`${MEETINGS_BASE_URL}/${id}`)

    
return response.data
  },

  async createMeeting(data: CreateMeetingData): Promise<MeetingDetailResponse> {
    const response = await apiClient.post<MeetingDetailResponse>(MEETINGS_BASE_URL, data)

    
return response.data
  },

  async updateMeeting(id: number, data: UpdateMeetingData): Promise<MeetingDetailResponse> {
    const response = await apiClient.put<MeetingDetailResponse>(`${MEETINGS_BASE_URL}/${id}`, data)

    
return response.data
  },

  async deleteMeeting(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`${MEETINGS_BASE_URL}/${id}`)

    
return response.data
  },

  async getFilterOptions(lang: string = 'fr'): Promise<FilterOptionsResponse> {
    const response = await apiClient.get<FilterOptionsResponse>(`${MEETINGS_BASE_URL}/filter-options?lang=${lang}`)

    
return response.data
  },

  async getHistory(id: number): Promise<MeetingHistoryResponse> {
    const response = await apiClient.get<MeetingHistoryResponse>(`${MEETINGS_BASE_URL}/${id}/history`)

    
return response.data
  },

  // ─── Schedule / Calendar ─────────────────────────────────

  async getSchedule(filters: ScheduleFilters): Promise<ScheduleResponse> {
    const params = new URLSearchParams()

    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null || value === '') continue
      params.append(key, String(value))
    }

    const url = `${MEETINGS_BASE_URL}/schedule${params.toString() ? `?${params.toString()}` : ''}`
    const response = await apiClient.get<ScheduleResponse>(url)

    return response.data
  },

  async rescheduleMeeting(id: number, data: { in_at: string; out_at?: string }): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/reschedule`, data)

    return response.data
  },

  // ─── Meeting Action Endpoints ────────────────────────────

  async confirmMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/confirm`)

    
return response.data
  },

  async unconfirmMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/unconfirm`)

    
return response.data
  },

  async cancelMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/cancel`)

    
return response.data
  },

  async uncancelMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/uncancel`)

    
return response.data
  },

  async holdMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/hold`)

    
return response.data
  },

  async unholdMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/unhold`)

    
return response.data
  },

  async holdQuoteMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/hold-quote`)

    
return response.data
  },

  async unholdQuoteMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/unhold-quote`)

    
return response.data
  },

  async lockMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/lock`)

    
return response.data
  },

  async unlockMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/unlock`)

    
return response.data
  },

  async cancelCallback(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/cancel-callback`)

    
return response.data
  },

  async copyMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/copy`)

    
return response.data
  },

  async recycleMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.patch<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/recycle`)

    
return response.data
  },

  async createContract(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/create-contract`)

    
return response.data
  },

  // ─── Communication ────────────────────────────────────────

  async createDefaultProducts(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/create-default-products`)

    
return response.data
  },

  async migrateMeeting(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/migrate`)

    
return response.data
  },

  async transferToSlave(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/transfer-to-slave`)

    
return response.data
  },

  async slavesTransfer(id: number): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/slaves-transfer`)

    
return response.data
  },

  async exportKml(id: number): Promise<Blob> {
    const response = await apiClient.get(`${MEETINGS_BASE_URL}/${id}/export-kml`, { responseType: 'blob' })

    
return response.data
  },

  async exportPdf(id: number): Promise<Blob> {
    const response = await apiClient.get(`${MEETINGS_BASE_URL}/${id}/export-pdf`, { responseType: 'blob' })

    
return response.data
  },

  async sendSms(id: number, data: { message: string }): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/send-sms`, data)

    
return response.data
  },

  async sendEmail(id: number, data: { subject: string; body: string }): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${id}/send-email`, data)

    
return response.data
  },

  // ─── Comments ─────────────────────────────────────────────

  async addComment(meetingId: number, comment: string): Promise<MeetingActionResponse> {
    const response = await apiClient.post<MeetingActionResponse>(`${MEETINGS_BASE_URL}/${meetingId}/comments`, { comment })

    
return response.data
  },

  async getComments(meetingId: number): Promise<{ success: boolean; data: MeetingComment[] }> {
    const response = await apiClient.get<{ success: boolean; data: MeetingComment[] }>(`${MEETINGS_BASE_URL}/${meetingId}/comments`)

    
return response.data
  },

  async getLogs(meetingId: number): Promise<{ success: boolean; data: MeetingLog[] }> {
    const response = await apiClient.get<{ success: boolean; data: MeetingLog[] }>(`${MEETINGS_BASE_URL}/${meetingId}/logs`)

    
return response.data
  },
}

// ─── Tab data types ───────────────────────────────────────

export interface MeetingComment {
  id: number
  comment: string
  type: string
  created_at: string | null
}

export interface MeetingLog {
  id: number
  comment: string | null
  user: string | null
  old_status: string | null
  new_status: string | null
  created_at: string | null
}
