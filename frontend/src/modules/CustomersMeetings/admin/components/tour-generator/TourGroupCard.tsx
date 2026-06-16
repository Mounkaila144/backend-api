'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Divider from '@mui/material/Divider'
import { useTheme } from '@mui/material/styles'

import type { TourGroup } from '../../../types'

const GROUP_COLORS = ['#2196f3', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#00bcd4', '#795548', '#607d8b', '#e91e63', '#3f51b5']

interface TourGroupCardProps {
  group: TourGroup
  groupIndex: number
  availableSalespeople: Array<{ id: number; name: string }>
  onAssign: (groupId: number, salespersonId: number) => Promise<void>
  onHover?: (groupId: number | null) => void
}

const TourGroupCard = ({ group, groupIndex, availableSalespeople, onAssign, onHover }: TourGroupCardProps) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const color = GROUP_COLORS[groupIndex % GROUP_COLORS.length]

  const durationHours = Math.floor(group.total_duration / 3600)
  const durationMinutes = Math.floor((group.total_duration % 3600) / 60)

  const handleAssign = async (salespersonId: number) => {
    setAssigning(true)
    await onAssign(group.id, salespersonId)
    setAssigning(false)
  }

  return (
    <Card
      elevation={0}
      onMouseEnter={() => onHover?.(group.id)}
      onMouseLeave={() => onHover?.(null)}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 2,
        mb: 1.5,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: `0 2px 8px ${color}30` },
      }}
    >
      {/* Header */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '50%', backgroundColor: color,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', mr: 1.5, flexShrink: 0,
          }}
        >
          {groupIndex + 1}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${group.meetings.length} RDV`} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {group.total_distance.toFixed(1)} km
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {durationHours}h{durationMinutes > 0 ? `${String(durationMinutes).padStart(2, '0')}` : ''}
            </Typography>
          </Box>
        </Box>

        <Chip
          label={group.salesperson ? group.salesperson.name : 'Non assigne'}
          size="small"
          color={group.salesperson ? 'success' : 'default'}
          variant={group.salesperson ? 'filled' : 'outlined'}
          sx={{ fontSize: '0.65rem', height: 22, maxWidth: 120 }}
        />

        <IconButton size="small" sx={{ ml: 0.5 }}>
          <i className={expanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
        </IconButton>
      </Box>

      {/* Expanded Content */}
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0, pb: '12px !important' }}>
          {/* Salesperson selector */}
          <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Commercial</InputLabel>
            <Select
              value={group.sale_id || ''}
              label="Commercial"
              disabled={assigning}
              onChange={(e) => handleAssign(Number(e.target.value))}
              sx={{ fontSize: '0.8rem' }}
            >
              <MenuItem value="">
                <em>-- Aucun --</em>
              </MenuItem>
              {availableSalespeople.map(sp => (
                <MenuItem key={sp.id} value={sp.id} sx={{ fontSize: '0.8rem' }}>
                  {sp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Divider sx={{ mb: 1 }} />

          {/* Meeting List */}
          {group.meetings.map((meeting, idx) => (
            <Box
              key={meeting.id}
              sx={{
                display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5,
                borderBottom: idx < group.meetings.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
              }}
            >
              <Box
                sx={{
                  width: 20, height: 20, borderRadius: '50%', border: `2px solid ${color}`,
                  color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', fontWeight: 700, flexShrink: 0, mt: 0.25,
                }}
              >
                {idx + 1}
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                  {meeting.customer_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem', display: 'block' }}>
                  {meeting.postcode} {meeting.city}
                </Typography>
                {meeting.in_at && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                    {new Date(meeting.in_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Collapse>
    </Card>
  )
}

export default TourGroupCard
