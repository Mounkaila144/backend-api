'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import type { AxiosError } from 'axios'

import StepperWrapper from '@core/styles/stepper'

import { useMeetingWizardState } from './useMeetingWizardState'
import { useMeetingFilterOptions } from '../../hooks/useMeetingFilterOptions'
import { useMeetingTranslations } from '../../hooks/useMeetingTranslations'

import StepCustomer from './steps/StepCustomer'
import StepMeetingDetails from './steps/StepMeetingDetails'
import StepTeam from './steps/StepTeam'
import StepSummary from './steps/StepSummary'


import type { CreateMeetingData } from '../../../types'

interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

interface CreateMeetingWizardProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateMeetingData) => Promise<any>
}

export default function CreateMeetingWizard({ isOpen, onClose, onCreate }: CreateMeetingWizardProps) {
  const t = useMeetingTranslations()
  const { filterOptions, filterOptionsLoading } = useMeetingFilterOptions()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const {
    activeStep,
    totalSteps,
    customerForm,
    detailsForm,
    teamForm,
    handleNext,
    handleBack,
    getCombinedFormData,
    resetAll,
  } = useMeetingWizardState()

  const steps = [
    { title: t.wizardStepCustomer, subtitle: t.wizardStepCustomerSubtitle, icon: 'ri-user-line' },
    { title: t.wizardStepDetails, subtitle: t.wizardStepDetailsSubtitle, icon: 'ri-calendar-check-line' },
    { title: t.wizardStepTeam, subtitle: t.wizardStepTeamSubtitle, icon: 'ri-team-line' },
    { title: t.wizardStepSummary, subtitle: t.wizardStepSummarySubtitle, icon: 'ri-checkbox-circle-line' },
  ]

  const isLastStep = activeStep === totalSteps - 1

  useEffect(() => {
    if (isOpen) {
      resetAll()
      setError(null)
      setSubmitting(false)
    }
  }, [isOpen, resetAll])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError(null)

    try {
      const data = getCombinedFormData()

      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
      ) as CreateMeetingData

      if (data.customer) {
        cleaned.customer = data.customer
      }

      // Backend creates meeting history with old_status_id = state_id.
      // If state_id is missing, it defaults to 0 which violates FK constraint.
      // Fallback to first available status when user didn't pick one.
      if (!cleaned.state_id && filterOptions.meeting_statuses.length > 0) {
        cleaned.state_id = Number(filterOptions.meeting_statuses[0].id)
      }

      await onCreate(cleaned)
      resetAll()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const data = axiosErr?.response?.data

      if (data?.errors) {
        const messages = Object.values(data.errors).flat()

        setError(messages.join('\n'))
      } else if (data?.message) {
        setError(data.message)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }

      // Scroll to top so the error Alert is visible
      contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSubmitting(false)
    }
  }, [getCombinedFormData, onCreate, onClose, resetAll, filterOptions])

  const handleClickNext = useCallback(async () => {
    if (isLastStep) {
      await handleSubmit()
    } else {
      await handleNext()
    }
  }, [isLastStep, handleSubmit, handleNext])

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return <StepCustomer form={customerForm} t={t} />
      case 1:
        return (
          <StepMeetingDetails
            form={detailsForm}
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            t={t}
          />
        )
      case 2:
        return (
          <StepTeam
            form={teamForm}
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            t={t}
          />
        )
      case 3:
        return (
          <StepSummary
            customerForm={customerForm}
            detailsForm={detailsForm}
            teamForm={teamForm}
            filterOptions={filterOptions}
            t={t}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={submitting ? undefined : onClose} maxWidth='md' fullWidth scroll='paper'>
      {submitting ? <LinearProgress /> : null}

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span'>{t.newMeeting}</Typography>
        <IconButton onClick={onClose} size='small'>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers ref={contentRef}>
        <StepperWrapper sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel
                  StepIconComponent={() => (
                    <Box className='step-label'>
                      <Typography className='step-number'>
                        {index < activeStep ? (
                          <i className='ri-check-line' />
                        ) : (
                          <i className={step.icon} />
                        )}
                      </Typography>
                    </Box>
                  )}
                >
                  <Box>
                    <Typography className='step-title'>{step.title}</Typography>
                    <Typography className='step-subtitle'>{step.subtitle}</Typography>
                  </Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </StepperWrapper>

        {error ? (
          <Alert severity='error' sx={{ mb: 3, whiteSpace: 'pre-line' }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color='secondary'>
          {t.wizardButtonCancel}
        </Button>
        <Box sx={{ flex: 1 }} />
        {activeStep > 0 ? (
          <Button onClick={handleBack} disabled={submitting}>
            {t.wizardButtonBack}
          </Button>
        ) : null}
        <Button
          variant='contained'
          onClick={handleClickNext}
          disabled={submitting}
        >
          {isLastStep
            ? (submitting ? t.wizardButtonCreating : t.wizardButtonCreate)
            : t.wizardButtonNext
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}
