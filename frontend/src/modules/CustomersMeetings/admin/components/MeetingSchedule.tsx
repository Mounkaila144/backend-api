'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DateSelectArg, DatesSetArg, EventInput } from '@fullcalendar/core'
import frLocale from '@fullcalendar/core/locales/fr'

import { useSchedule } from '../hooks/useSchedule'
import { useMeetingFilterOptions } from '../hooks/useMeetingFilterOptions'
import { meetingsService } from '../services/meetingsService'
import { tourGeneratorService } from '../services/tourGeneratorService'
import ScheduleFilterPanel from './schedule/ScheduleFilterPanel'
import MeetingDetailPopover from './schedule/MeetingDetailPopover'
import TourGeneratorDialog from './tour-generator/TourGeneratorDialog'
import type { ScheduleEventExtendedProps, ScheduleFilters, TourIndicator } from '../../types'

const MeetingSchedule = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const calendarRef = useRef<FullCalendar>(null)

  const {
    events,
    loading,
    total,
    filters,
    updateFilter,
    loadSchedule,
    rescheduleMeeting,
    refreshSchedule,
  } = useSchedule()

  const { filterOptions } = useMeetingFilterOptions()

  // Convert events to FullCalendar format
  const calendarEvents = useMemo((): EventInput[] => {
    return events.map(evt => ({
      id: String(evt.id),
      title: evt.title,
      start: evt.start || undefined,
      end: evt.end || undefined,
      backgroundColor: evt.backgroundColor,
      borderColor: evt.borderColor,
      extendedProps: evt.extendedProps,
    }))
  }, [events])

  // Popover state for event detail
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEventExtendedProps | null>(null)
  const [popoverAnchor, setPopoverAnchor] = useState<{ top: number; left: number } | null>(null)

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(!isMobile)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Tour generator state
  const [tourDialogOpen, setTourDialogOpen] = useState(false)
  const [tourDialogInitialTourId, setTourDialogInitialTourId] = useState<number | undefined>(undefined)
  const [existingTours, setExistingTours] = useState<TourIndicator[]>([])

  // Load existing tours when date range changes
  const loadExistingTours = useCallback(async (start: string, end: string) => {
    try {
      const res = await tourGeneratorService.getToursByRange(start, end)
      if (res.success) setExistingTours(res.data)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (filters.start && filters.end) {
      loadExistingTours(filters.start, filters.end)
    }
  }, [filters.start, filters.end, loadExistingTours])

  // Merge tour indicators as all-day events in the calendar
  const tourEvents = useMemo((): EventInput[] => {
    return existingTours.map(tour => ({
      id: `tour-${tour.id}`,
      title: `Tour: ${tour.groups_count} grp, ${tour.meetings_count} RDV`,
      start: tour.date,
      allDay: true,
      display: 'block',
      backgroundColor: '#0d9488',
      borderColor: '#0d9488',
      extendedProps: { _isTour: true, _tourId: tour.id, _tourStatus: tour.status },
    }))
  }, [existingTours])

  const allCalendarEvents = useMemo((): EventInput[] => {
    return [...calendarEvents, ...tourEvents]
  }, [calendarEvents, tourEvents])

  // Active filters for chips
  const activeFilters = useMemo(() => {
    const chips: Array<{ key: string; label: string; filterKey: keyof ScheduleFilters }> = []

    if (filters.in_telepro_id) {
      const ids = filters.in_telepro_id.split(',')
      const names = ids.map(id => filterOptions?.users?.find(u => String(u.id) === id)?.name || id)
      chips.push({ key: 'telepro', label: `Source: ${names.join(', ')}`, filterKey: 'in_telepro_id' })
    }
    if (filters.in_sales_id) {
      const ids = filters.in_sales_id.split(',')
      const names = ids.map(id => filterOptions?.users?.find(u => String(u.id) === id)?.name || id)
      chips.push({ key: 'sales', label: `Commercial: ${names.join(', ')}`, filterKey: 'in_sales_id' })
    }
    if (filters.in_state_id) {
      const ids = filters.in_state_id.split(',')
      const names = ids.map(id => filterOptions?.meeting_statuses?.find(s => String(s.id) === id)?.name || id)
      chips.push({ key: 'state', label: `Statut: ${names.join(', ')}`, filterKey: 'in_state_id' })
    }
    if (filters.in_campaign_id) {
      const ids = filters.in_campaign_id.split(',')
      const names = ids.map(id => filterOptions?.campaigns?.find(c => String(c.id) === id)?.name || id)
      chips.push({ key: 'campaign', label: `Campagne: ${names.join(', ')}`, filterKey: 'in_campaign_id' })
    }
    if (filters.in_callcenter_id) {
      const ids = filters.in_callcenter_id.split(',')
      const names = ids.map(id => filterOptions?.callcenters?.find(c => String(c.id) === id)?.name || id)
      chips.push({ key: 'callcenter', label: `Call center: ${names.join(', ')}`, filterKey: 'in_callcenter_id' })
    }
    if (filters.in_status_call_id) {
      const ids = filters.in_status_call_id.split(',')
      const names = ids.map(id => filterOptions?.status_calls?.find(s => String(s.id) === id)?.name || id)
      chips.push({ key: 'status_call', label: `Statut appel: ${names.join(', ')}`, filterKey: 'in_status_call_id' })
    }
    if (filters.is_confirmed) {
      chips.push({
        key: 'confirmed',
        label: filters.is_confirmed === 'YES' ? 'Confirmé' : 'Non confirmé',
        filterKey: 'is_confirmed',
      })
    }
    if (filters.postcode) {
      chips.push({ key: 'postcode', label: `CP: ${filters.postcode}`, filterKey: 'postcode' })
    }

    return chips
  }, [filters, filterOptions])

  // Handle date range change (when user navigates the calendar)
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      const start = dateInfo.startStr.split('T')[0]
      const end = dateInfo.endStr.split('T')[0]
      loadSchedule(start, end)
      loadExistingTours(start, end)
    },
    [loadSchedule, loadExistingTours]
  )

  // Handle event click (show detail popover or open tour)
  const handleEventClick = useCallback((info: EventClickArg) => {
    // If it's a tour indicator, open the tour dialog
    if (info.event.extendedProps._isTour) {
      setTourDialogInitialTourId(info.event.extendedProps._tourId)
      setTourDialogOpen(true)
      return
    }

    const rect = info.el.getBoundingClientRect()
    setPopoverAnchor({ top: rect.top + rect.height / 2, left: rect.left + rect.width / 2 })
    setSelectedEvent(info.event.extendedProps as ScheduleEventExtendedProps)
  }, [])

  // Handle drag-and-drop
  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const meetingId = info.event.extendedProps.meeting_id
      const newStart = info.event.start?.toISOString()
      const newEnd = info.event.end?.toISOString()

      if (!newStart) {
        info.revert()
        return
      }

      const success = await rescheduleMeeting(meetingId, newStart, newEnd || undefined)

      if (success) {
        setSnackbar({ open: true, message: 'Rendez-vous déplacé avec succès', severity: 'success' })
      } else {
        info.revert()
        setSnackbar({ open: true, message: 'Erreur lors du déplacement', severity: 'error' })
      }
    },
    [rescheduleMeeting]
  )

  // Handle date select (optional: could open create dialog)
  const handleDateSelect = useCallback((_selectInfo: DateSelectArg) => {
    // Future: open create meeting dialog with pre-filled date
  }, [])

  // Remove a filter chip
  const handleRemoveFilter = useCallback(
    (filterKey: keyof ScheduleFilters) => {
      updateFilter(filterKey, undefined)
    },
    [updateFilter]
  )

  // Custom event content renderer
  const renderEventContent = useCallback((eventInfo: any) => {
    const props = eventInfo.event.extendedProps as ScheduleEventExtendedProps
    const isConfirmed = props.is_confirmed === 'YES'
    const isTimeGrid = eventInfo.view.type.includes('timeGrid')

    if (!isTimeGrid) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            overflow: 'hidden',
            width: '100%',
            px: 0.5,
          }}
        >
          {isConfirmed && (
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                flexShrink: 0,
              }}
            />
          )}
          <Typography variant="caption" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'inherit' }}>
            {eventInfo.timeText && <span>{eventInfo.timeText} </span>}
            {props.customer?.name || eventInfo.event.title}
          </Typography>
        </Box>
      )
    }

    return (
      <Box
        sx={{
          p: 0.5,
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.25,
          cursor: 'pointer',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isConfirmed && (
            <Box
              component="span"
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                flexShrink: 0,
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'inherit',
            }}
          >
            {props.customer?.name || eventInfo.event.title}
          </Typography>
        </Box>

        {props.customer?.postcode && (
          <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9, lineHeight: 1.1, color: 'inherit' }}>
            {props.customer.postcode} {props.customer.city}
          </Typography>
        )}

        {props.sales && (
          <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.85, lineHeight: 1.1, color: 'inherit' }}>
            {props.sales.name}
          </Typography>
        )}
      </Box>
    )
  }, [])

  return (
    <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: isMobile ? 'auto' : 'calc(100vh - 100px)', minHeight: isMobile ? 'calc(100vh - 80px)' : undefined, gap: isMobile ? 1 : 2 }}>
      {/* Filter Sidebar */}
      {isMobile ? (
        <Drawer
          anchor="left"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          PaperProps={{ sx: { width: 300, p: 2 } }}
        >
          <ScheduleFilterPanel
            filters={filters}
            filterOptions={filterOptions}
            onFilterChange={updateFilter}
            onClose={() => setFilterOpen(false)}
          />
        </Drawer>
      ) : (
        filterOpen && (
          <Paper
            elevation={0}
            sx={{
              width: 280,
              flexShrink: 0,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              overflow: 'auto',
            }}
          >
            <ScheduleFilterPanel
              filters={filters}
              filterOptions={filterOptions}
              onFilterChange={updateFilter}
              onClose={() => setFilterOpen(false)}
            />
          </Paper>
        )
      )}

      {/* Main Calendar Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <Paper
          elevation={0}
          sx={{
            mb: isMobile ? 1 : 2,
            p: isMobile ? 1 : 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexWrap: 'wrap',
          }}
        >
          <Tooltip title={filterOpen ? 'Masquer les filtres' : 'Afficher les filtres'}>
            <IconButton onClick={() => setFilterOpen(prev => !prev)} size="small">
              <i className="ri-filter-3-line" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Rafraichir">
            <IconButton onClick={refreshSchedule} size="small" disabled={loading}>
              {loading ? <CircularProgress size={18} /> : <i className="ri-refresh-line" />}
            </IconButton>
          </Tooltip>

          {isMobile ? (
            <Tooltip title="Generer une tournee">
              <IconButton onClick={() => setTourDialogOpen(true)} size="small" color="primary">
                <i className="ri-route-line" />
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              size="small"
              onClick={() => setTourDialogOpen(true)}
              startIcon={<i className="ri-route-line" />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                px: 2,
              }}
            >
              Generer une tournee
            </Button>
          )}

          <Chip
            label={`${total} RDV`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: isMobile ? '0.7rem' : undefined }}
          />

          {/* Active filter chips (hidden on mobile) */}
          {!isMobile && activeFilters.map(chip => (
            <Chip
              key={chip.key}
              label={chip.label}
              size="small"
              variant="filled"
              color="secondary"
              onDelete={() => handleRemoveFilter(chip.filterKey)}
              sx={{ maxWidth: 200 }}
            />
          ))}
        </Paper>

        {/* Calendar */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            minHeight: isMobile ? 'calc(100vh - 160px)' : undefined,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            position: 'relative',
            '& .fc': {
              height: '100%',
              fontFamily: theme.typography.fontFamily,
            },
            '& .fc-toolbar': {
              px: isMobile ? 0.5 : 2,
              pt: isMobile ? 0.5 : 1.5,
              mb: '0 !important',
              flexWrap: 'wrap' as const,
              gap: isMobile ? '4px' : undefined,
            },
            '& .fc-toolbar-title': {
              fontSize: isMobile ? '0.85rem !important' : '1.1rem !important',
              fontWeight: '600 !important',
              textTransform: 'capitalize',
            },
            '& .fc-button': {
              backgroundColor: `${theme.palette.primary.main} !important`,
              borderColor: `${theme.palette.primary.main} !important`,
              fontSize: isMobile ? '0.7rem !important' : '0.8rem !important',
              padding: isMobile ? '2px 6px !important' : '4px 12px !important',
              borderRadius: '6px !important',
              textTransform: 'capitalize',
              '&:hover': {
                backgroundColor: `${theme.palette.primary.dark} !important`,
              },
              '&:focus': {
                boxShadow: 'none !important',
              },
            },
            '& .fc-button-active': {
              backgroundColor: `${theme.palette.primary.dark} !important`,
            },
            '& .fc-button-group .fc-button': {
              borderRadius: '0 !important',
              '&:first-of-type': { borderRadius: '6px 0 0 6px !important' },
              '&:last-of-type': { borderRadius: '0 6px 6px 0 !important' },
            },
            '& .fc-day-today': {
              backgroundColor: `${theme.palette.primary.main}08 !important`,
            },
            '& .fc-event': {
              borderRadius: '6px !important',
              border: 'none !important',
              boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
              },
            },
            '& .fc-timegrid-event': {
              borderRadius: '6px !important',
              borderLeft: '3px solid !important',
            },
            '& .fc-daygrid-event': {
              borderRadius: '4px !important',
              marginBottom: '1px !important',
            },
            '& .fc-col-header-cell': {
              backgroundColor: theme.palette.mode === 'dark'
                ? theme.palette.grey[800]
                : theme.palette.grey[50],
              fontWeight: 600,
              padding: '8px 0',
              textTransform: 'capitalize',
            },
            '& .fc-timegrid-slot': {
              height: isMobile ? '36px !important' : '48px !important',
            },
            '& .fc-scrollgrid': {
              borderColor: `${theme.palette.divider} !important`,
            },
            '& .fc-timegrid-divider, & .fc-cell-shaded': {
              backgroundColor: theme.palette.mode === 'dark'
                ? theme.palette.grey[800]
                : theme.palette.grey[50],
            },
            '& .fc-list-event:hover td': {
              backgroundColor: `${theme.palette.action.hover} !important`,
            },
          }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: 10,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '200% 0' },
                  '100%': { backgroundPosition: '-200% 0' },
                },
              }}
            />
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
            locale={frLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: isMobile ? 'listWeek,timeGridDay' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            events={allCalendarEvents}
            editable={true}
            droppable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            slotDuration="00:30:00"
            slotLabelInterval="01:00:00"
            slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
            allDaySlot={true}
            nowIndicator={true}
            weekNumbers={true}
            weekText="S"
            navLinks={true}
            height="100%"
            stickyHeaderDates={true}
            expandRows={true}
            datesSet={handleDatesSet}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
            select={handleDateSelect}
            eventContent={renderEventContent}
            eventDisplay="block"
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '08:00',
              endTime: '20:00',
            }}
          />
        </Paper>
      </Box>

      {/* Meeting Detail Popover */}
      <MeetingDetailPopover
        event={selectedEvent}
        anchorPosition={popoverAnchor}
        onClose={() => {
          setSelectedEvent(null)
          setPopoverAnchor(null)
        }}
        onConfirm={async (id) => {
          try {
            await meetingsService.confirmMeeting(id)
            setSnackbar({ open: true, message: 'Rendez-vous confirmé', severity: 'success' })
            refreshSchedule()
          } catch {
            setSnackbar({ open: true, message: 'Erreur de confirmation', severity: 'error' })
          }
        }}
        onDelete={async (id) => {
          if (!window.confirm('Supprimer ce rendez-vous ?')) return
          try {
            await meetingsService.deleteMeeting(id)
            setSnackbar({ open: true, message: 'Rendez-vous supprimé', severity: 'success' })
            refreshSchedule()
            setSelectedEvent(null)
            setPopoverAnchor(null)
          } catch {
            setSnackbar({ open: true, message: 'Erreur de suppression', severity: 'error' })
          }
        }}
      />

      {/* Tour Generator Dialog */}
      <TourGeneratorDialog
        isOpen={tourDialogOpen}
        onClose={() => {
          setTourDialogOpen(false)
          setTourDialogInitialTourId(undefined)
          loadExistingTours(filters.start, filters.end)
        }}
        initialDate={filters.start}
        initialTourId={tourDialogInitialTourId}
        onTourApplied={() => {
          refreshSchedule()
          loadExistingTours(filters.start, filters.end)
        }}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default MeetingSchedule
