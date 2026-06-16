// ============================================================================
// CustomersMeetings Module - Public API Exports
// ============================================================================

// Admin Layer Components
export { default as MeetingsList } from './admin/components/MeetingsList';
export { default as MeetingSchedule } from './admin/components/MeetingSchedule';

// Admin Layer Services
export { meetingsService } from './admin/services/meetingsService';

// Admin Layer Hooks
export { useMeetings } from './admin/hooks/useMeetings';
export { useSchedule } from './admin/hooks/useSchedule';
export { useMeetingTranslations } from './admin/hooks/useMeetingTranslations';

// Type Exports
export type {

  // Main Entities
  CustomerMeeting,
  MeetingStatus,
  MeetingCustomer,
  MeetingProduct,
  MeetingHistory,

  // API Response Types
  MeetingListResponse,
  MeetingDetailResponse,
  MeetingActionResponse,
  MeetingHistoryResponse,

  // Filter & Form Types
  MeetingFilters,
  CreateMeetingData,
  UpdateMeetingData,

  // Filter Options
  MeetingFilterOptions,
  FilterOption,
  FilterOptionsResponse,

  // Schedule Types
  ScheduleEvent,
  ScheduleResponse,
  ScheduleFilters,
} from './types';
