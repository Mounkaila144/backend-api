'use client'

import { useState, useCallback, useEffect } from 'react'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

import { useTourGenerator } from '../../hooks/useTourGenerator'
import { useMeetingFilterOptions } from '../../hooks/useMeetingFilterOptions'
import TourGroupCard from './TourGroupCard'
import TourMap from './TourMap'
import type { FilterOption } from '../../../types'

interface TourGeneratorDialogProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: string
  initialTourId?: number
  onTourApplied?: () => void
}

const STEPS = ['Configuration', 'Generation', 'Resultats']

const TourGeneratorDialog = ({ isOpen, onClose, initialDate, initialTourId, onTourApplied }: TourGeneratorDialogProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const {
    step, generating, tour, groups, messages, error,
    availableSalespeople, settings, generateTour, loadTour, assignSalesperson, deleteTour, reset,
  } = useTourGenerator()

  const { filterOptions } = useMeetingFilterOptions()

  // Form state
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0])
  const [numberOfSalespeople, setNumberOfSalespeople] = useState(3)
  const [selectedStates, setSelectedStates] = useState<FilterOption[]>([])
  const [highlightedGroupId, setHighlightedGroupId] = useState<number | null>(null)

  // Load existing tour when initialTourId is provided
  useEffect(() => {
    if (isOpen && initialTourId) {
      loadTour(initialTourId)
    }
  }, [isOpen, initialTourId, loadTour])

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const activeStep = step === 'configure' ? 0 : step === 'generating' ? 1 : 2

  const handleGenerate = useCallback(async () => {
    const success = await generateTour({
      date,
      number_of_salespeople: numberOfSalespeople,
      states: selectedStates.map(s => Number(s.id)),
    })
    if (success) {
      onTourApplied?.()
    }
  }, [date, numberOfSalespeople, selectedStates, generateTour, onTourApplied])

  const handleAssign = useCallback(async (groupId: number, salespersonId: number) => {
    const success = await assignSalesperson(groupId, salespersonId)
    setSnackbar({
      open: true,
      message: success ? 'Commercial assigne avec succes' : 'Erreur d\'assignation',
      severity: success ? 'success' : 'error',
    })
  }, [assignSalesperson])

  const handleDelete = useCallback(async () => {
    if (!window.confirm('Supprimer cette tournee ?')) return
    const success = await deleteTour()
    if (success) {
      setSnackbar({ open: true, message: 'Tournee supprimee', severity: 'success' })
      onTourApplied?.()
    }
  }, [deleteTour, onTourApplied])

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        fullScreen={isMobile}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, minHeight: '70vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className="ri-route-line" style={{ fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Generateur de Tournees
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small">
            <i className="ri-close-line" />
          </IconButton>
        </DialogTitle>

        {/* Stepper */}
        <Box sx={{ px: 3, pb: 1 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <DialogContent sx={{ px: 3, pb: 2 }}>
          {/* Step 1: Configure */}
          {step === 'configure' && (
            <Box sx={{ maxWidth: 500, mx: 'auto', pt: 2 }}>
              <TextField
                label="Date de la tournee"
                type="date"
                fullWidth
                value={date}
                onChange={e => setDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ mb: 2.5 }}
              />

              <TextField
                label="Nombre de commerciaux"
                type="number"
                fullWidth
                value={numberOfSalespeople}
                onChange={e => setNumberOfSalespeople(Math.max(1, Math.min(20, Number(e.target.value))))}
                slotProps={{ htmlInput: { min: 1, max: 20 } }}
                sx={{ mb: 2.5 }}
              />

              <Autocomplete
                multiple
                options={filterOptions.meeting_statuses}
                value={selectedStates}
                getOptionLabel={opt => opt.name}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                onChange={(_, newVal) => setSelectedStates(newVal)}
                disableCloseOnSelect
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props as any
                  return (
                    <li key={key} {...rest}>
                      <Checkbox size="small" checked={selected} sx={{ mr: 0.5, p: 0.25 }} />
                      {option.name}
                    </li>
                  )
                }}
                renderTags={(tags, getTagProps) =>
                  tags.map((opt, idx) => {
                    const { key, ...tagProps } = getTagProps({ index: idx })
                    return <Chip key={key} label={opt.name} size="small" {...tagProps} />
                  })
                }
                renderInput={params => (
                  <TextField {...params} label="Filtrer par statut (optionnel)" placeholder="Tous les statuts" />
                )}
                sx={{ mb: 2 }}
                noOptionsText="Aucun statut"
              />

              <Alert severity="info" sx={{ mt: 1 }}>
                La tournee regroupera les rendez-vous du {date} par proximite geographique et optimisera l'ordre de visite.
              </Alert>
            </Box>
          )}

          {/* Step 2: Generating */}
          {step === 'generating' && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={60} thickness={4} />
              <Typography variant="h6" sx={{ mt: 3, fontWeight: 600 }}>
                Generation en cours...
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                Geocodage, calcul des distances, clustering...
              </Typography>
            </Box>
          )}

          {/* Step 2b: Error */}
          {step === 'error' && (
            <Box sx={{ maxWidth: 500, mx: 'auto', pt: 2 }}>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || 'Erreur lors de la generation'}
              </Alert>
              {messages.map((msg, i) => (
                <Alert key={i} severity={msg.type === 'error' ? 'error' : msg.type === 'warning' ? 'warning' : 'info'} sx={{ mb: 1 }}>
                  {msg.text}
                </Alert>
              ))}
              <Button variant="outlined" onClick={reset} sx={{ mt: 2 }}>
                Recommencer
              </Button>
            </Box>
          )}

          {/* Step 3: Results */}
          {step === 'results' && (
            <Box sx={{ display: 'flex', gap: 2, height: isMobile ? 'auto' : '55vh', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* Left: Groups */}
              <Box sx={{ width: isMobile ? '100%' : 360, flexShrink: 0, overflow: 'auto' }}>
                {/* Messages */}
                {messages.map((msg, i) => (
                  <Alert key={i} severity={msg.type === 'error' ? 'error' : msg.type === 'warning' ? 'warning' : 'info'} sx={{ mb: 1, fontSize: '0.75rem' }}>
                    {msg.text}
                  </Alert>
                ))}

                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, mt: 1 }}>
                  {groups.length} groupe{groups.length > 1 ? 's' : ''} - {groups.reduce((sum, g) => sum + g.meetings.length, 0)} rendez-vous
                </Typography>

                {groups.map((group, idx) => (
                  <TourGroupCard
                    key={group.id}
                    group={group}
                    groupIndex={idx}
                    availableSalespeople={availableSalespeople}
                    onAssign={handleAssign}
                    onHover={setHighlightedGroupId}
                  />
                ))}
              </Box>

              {/* Right: Map */}
              <Box sx={{ flex: 1, minHeight: isMobile ? 300 : 'auto', borderRadius: 2, overflow: 'hidden', border: `1px solid ${theme.palette.divider}` }}>
                <TourMap groups={groups} highlightedGroupId={highlightedGroupId} mapboxToken={settings.tour_mapbox_access_token} />
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {step === 'configure' && (
            <>
              <Button onClick={handleClose} color="inherit">Annuler</Button>
              <Button variant="contained" onClick={handleGenerate} disabled={!date || numberOfSalespeople < 1} startIcon={<i className="ri-route-line" />}>
                Generer la tournee
              </Button>
            </>
          )}
          {step === 'results' && (
            <>
              <Button onClick={handleDelete} color="error" variant="outlined" startIcon={<i className="ri-delete-bin-line" />}>
                Supprimer
              </Button>
              <Button onClick={handleClose} variant="contained">
                Fermer
              </Button>
            </>
          )}
          {step === 'error' && (
            <Button onClick={handleClose} color="inherit">Fermer</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default TourGeneratorDialog
