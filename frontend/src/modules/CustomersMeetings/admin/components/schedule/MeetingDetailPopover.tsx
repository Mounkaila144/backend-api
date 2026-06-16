'use client'

import Box from '@mui/material/Box'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import { useTheme } from '@mui/material/styles'

import type { ScheduleEventExtendedProps } from '../../../types'

interface MeetingDetailPopoverProps {
  event: ScheduleEventExtendedProps | null
  anchorPosition: { top: number; left: number } | null
  onClose: () => void
  onConfirm: (id: number) => void
  onDelete: (id: number) => void
}

const InfoRow = ({ icon, label, value }: { icon: string; label: string; value: string | undefined | null }) => {
  if (!value) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.4 }}>
      <i className={icon} style={{ fontSize: 14, marginTop: 2, opacity: 0.6 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', lineHeight: 1 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: 500, wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  )
}

const MeetingDetailPopover = ({ event, anchorPosition, onClose, onConfirm, onDelete }: MeetingDetailPopoverProps) => {
  const theme = useTheme()

  if (!event || !anchorPosition) return null

  const isConfirmed = event.is_confirmed === 'YES'

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  return (
    <Popover
      open={true}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={anchorPosition}
      transformOrigin={{ vertical: 'center', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            maxHeight: '80vh',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          background: event.status?.color
            ? `linear-gradient(135deg, ${event.status.color}, ${event.status.color}dd)`
            : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: '#fff',
          p: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
              {event.customer?.name || `RDV #${event.meeting_id}`}
            </Typography>
            {event.registration && (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                #{event.registration}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: '#fff', mt: -0.5, mr: -0.5 }}>
            <i className="ri-close-line" />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
          {event.status && (
            <Chip
              label={event.status.name}
              size="small"
              sx={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 22,
              }}
            />
          )}
          <Chip
            label={isConfirmed ? 'Confirmé' : 'Non confirmé'}
            size="small"
            sx={{
              backgroundColor: isConfirmed ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 22,
            }}
            icon={
              <i
                className={isConfirmed ? 'ri-checkbox-circle-fill' : 'ri-close-circle-line'}
                style={{ color: '#fff', fontSize: 14 }}
              />
            }
          />
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2 }}>
        {/* Date & Time */}
        <InfoRow icon="ri-calendar-event-line" label="Date du RDV" value={formatDateTime(event.in_at)} />

        <Divider sx={{ my: 1 }} />

        {/* Customer Info */}
        {event.customer && (
          <>
            <InfoRow
              icon="ri-map-pin-line"
              label="Adresse"
              value={
                [event.customer.address, `${event.customer.postcode || ''} ${event.customer.city || ''}`]
                  .filter(Boolean)
                  .join(', ')
              }
            />
            <InfoRow icon="ri-phone-line" label="Téléphone" value={event.customer.phone} />
            <InfoRow icon="ri-smartphone-line" label="Mobile" value={event.customer.mobile} />
          </>
        )}

        <Divider sx={{ my: 1 }} />

        {/* Team */}
        <InfoRow icon="ri-user-star-line" label="Commercial" value={event.sales?.name} />
        <InfoRow icon="ri-headphone-line" label="Source (Télépro)" value={event.telepro?.name} />
        <InfoRow icon="ri-user-follow-line" label="Assistant" value={event.assistant?.name} />
        <InfoRow icon="ri-customer-service-2-line" label="Call Center" value={event.callcenter?.name} />
        <InfoRow icon="ri-megaphone-line" label="Campagne" value={event.campaign?.name} />

        {event.status_call && (
          <>
            <Divider sx={{ my: 1 }} />
            <InfoRow icon="ri-phone-find-line" label="Statut Appel" value={event.status_call.name} />
          </>
        )}

        {event.remarks && (
          <>
            <Divider sx={{ my: 1 }} />
            <InfoRow icon="ri-sticky-note-line" label="Remarques" value={event.remarks} />
          </>
        )}
      </Box>

      {/* Footer Actions */}
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, p: 1.5 }}>
        <Tooltip title={isConfirmed ? 'Annuler la confirmation' : 'Confirmer'}>
          <IconButton
            size="small"
            onClick={() => onConfirm(event.meeting_id)}
            sx={{
              color: isConfirmed ? theme.palette.warning.main : theme.palette.success.main,
              '&:hover': {
                backgroundColor: isConfirmed
                  ? `${theme.palette.warning.main}15`
                  : `${theme.palette.success.main}15`,
              },
            }}
          >
            <i className={isConfirmed ? 'ri-close-circle-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="Supprimer">
          <IconButton
            size="small"
            onClick={() => onDelete(event.meeting_id)}
            sx={{
              color: theme.palette.error.main,
              '&:hover': { backgroundColor: `${theme.palette.error.main}15` },
            }}
          >
            <i className="ri-delete-bin-line" style={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Popover>
  )
}

export default MeetingDetailPopover
