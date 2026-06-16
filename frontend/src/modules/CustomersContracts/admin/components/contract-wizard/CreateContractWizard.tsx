'use client'

import { useState, useEffect, useCallback } from 'react'

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

import { useContractWizardState } from './useContractWizardState'
import { useFilterOptions } from '../../hooks/useFilterOptions'
import { useContractTranslations } from '../../hooks/useContractTranslations'
import { useDomoprimeFilterOptions } from '@/modules/AppDomoprime/admin/hooks/useDomoprimeFilterOptions'

import StepCustomer from './steps/StepCustomer'
import StepContractDetails from './steps/StepContractDetails'
import StepTeamFinance from './steps/StepTeamFinance'
import StepIso from './steps/StepIso'
import StepSummary from './steps/StepSummary'


import type { CreateContractData } from '../../../types'

interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

interface CreateContractWizardProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateContractData) => Promise<any>
}

export default function CreateContractWizard({ isOpen, onClose, onCreate }: CreateContractWizardProps) {
  const t = useContractTranslations()
  const { filterOptions, filterOptionsLoading } = useFilterOptions()
  const { filterOptions: domoprimeOptions, loading: domoprimeOptionsLoading } = useDomoprimeFilterOptions()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    activeStep,
    totalSteps,
    customerForm,
    detailsForm,
    teamFinanceForm,
    isoForm,
    verifForm,
    handleNext,
    handleBack,
    getCombinedFormData,
    resetAll,
  } = useContractWizardState()

  const steps = [
    { title: t.wizardStepCustomer, subtitle: t.wizardStepCustomerSubtitle, icon: 'ri-user-line' },
    { title: t.wizardStepDetails, subtitle: t.wizardStepDetailsSubtitle, icon: 'ri-file-list-line' },
    { title: t.wizardStepTeamFinance, subtitle: t.wizardStepTeamFinanceSubtitle, icon: 'ri-home-4-line' },
    { title: t.wizardStepTeamFinanceOld, subtitle: t.wizardStepTeamFinanceOldSubtitle, icon: 'ri-team-line' },
    { title: t.wizardStepSummary, subtitle: t.wizardStepSummarySubtitle, icon: 'ri-checkbox-circle-line' },
  ]

  const isLastStep = activeStep === totalSteps - 1

  // Reset when dialog opens/closes
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

      // Clean undefined values
      const cleaned = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined && v !== '')
      ) as CreateContractData

      // Keep nested customer object even if some fields are empty strings
      if (data.customer) {
        cleaned.customer = data.customer
      }

      await onCreate(cleaned)
      resetAll()
      onClose()
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<ApiValidationError>
      const data = axiosErr?.response?.data

      if (data?.errors) {
        // Flatten all validation error messages
        const messages = Object.values(data.errors).flat()

        setError(messages.join('\n'))
      } else if (data?.message) {
        setError(data.message)
      } else {
        setError(err instanceof Error ? err.message : String(err))
      }
    } finally {
      setSubmitting(false)
    }
  }, [getCombinedFormData, onCreate, onClose, resetAll])

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
          <StepContractDetails
            form={detailsForm}
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            t={t}
          />
        )
      case 2:
        return (
          <StepIso
            form={isoForm}
            verifForm={verifForm}
            domoprimeOptions={domoprimeOptions}
            domoprimeOptionsLoading={domoprimeOptionsLoading}
            filterOptions={filterOptions}
            t={t}
          />
        )
      case 3:
        return (
          <StepTeamFinance
            form={teamFinanceForm}
            filterOptions={filterOptions}
            filterOptionsLoading={filterOptionsLoading}
            t={t}
          />
        )
      case 4:
        return (
          <StepSummary
            customerForm={customerForm}
            detailsForm={detailsForm}
            teamFinanceForm={teamFinanceForm}
            isoForm={isoForm}
            verifForm={verifForm}
            filterOptions={filterOptions}
            domoprimeOptions={domoprimeOptions}
            t={t}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth='md' fullWidth scroll='paper'>
      {submitting ? <LinearProgress /> : null}

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant='h5' component='span'>{t.newContract}</Typography>
        <IconButton onClick={onClose} size='small'>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
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
