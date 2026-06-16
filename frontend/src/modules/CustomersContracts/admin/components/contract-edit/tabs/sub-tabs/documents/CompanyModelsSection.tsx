'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import { iso3CompanyDocsService } from '@/modules/AppDomoprimeISO3'
import type { CompanyModel } from '@/modules/AppDomoprimeISO3'
import type { ContractTranslations } from '../../../../../hooks/useContractTranslations'

interface CompanyModelsSectionProps {
  contractId: number
  t: ContractTranslations
}

export default function CompanyModelsSection({ contractId, t }: CompanyModelsSectionProps) {
  const [models, setModels] = useState<CompanyModel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const res = await iso3CompanyDocsService.listCompanyModels(contractId)

        if (!cancelled) setModels(res.data.models)
      } catch {
        if (!cancelled) setError(t.docLoadError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [contractId, t.docLoadError])

  const handleOpen = async (modelId: number) => {
    setOpening(modelId)
    try {
      const blob = await iso3CompanyDocsService.exportCompanyModelPdf(contractId, modelId)
      const url = URL.createObjectURL(blob)

      window.open(url, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      console.error('Error opening company model PDF:', e)
    } finally {
      setOpening(null)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={20} />
      </Box>
    )
  }

  if (error) {
    return (
      <Typography variant='body2' color='error'>
        {error}
      </Typography>
    )
  }

  if (models.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        -
      </Typography>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {models.map(model => {
        const clickable = Boolean(model.fileUrl)
        const label = model.value || model.name
        const isOpening = opening === model.id

        return (
          <Box
            key={model.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.5,
              px: 1,
              borderRadius: 1,
              cursor: clickable && !isOpening ? 'pointer' : 'default',
              '&:hover': { backgroundColor: clickable ? 'action.hover' : 'transparent' },
            }}
            onClick={() => clickable && !isOpening && handleOpen(model.id)}
          >
            <i className='ri-file-pdf-2-line' style={{ fontSize: 16, color: '#e53935' }} />
            <Typography
              variant='body2'
              sx={{
                flex: 1,
                color: clickable ? 'primary.main' : 'text.primary',
                textDecoration: clickable ? 'underline' : 'none',
              }}
            >
              {label}
            </Typography>
            {clickable ? (
              <Tooltip title={t.docDownloadPdf}>
                <span>
                  <IconButton
                    size='small'
                    color='primary'
                    disabled={isOpening}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpen(model.id)
                    }}
                  >
                    {isOpening
                      ? <CircularProgress size={14} />
                      : <i className='ri-download-line' style={{ fontSize: 16 }} />
                    }
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </Box>
        )
      })}
    </Box>
  )
}
