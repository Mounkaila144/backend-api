'use client'

import { useState, useEffect } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'

import { iso3CompanyDocsService } from '@/modules/AppDomoprimeISO3'
import type { CompanyDocSignature } from '@/modules/AppDomoprimeISO3'
import type { ContractTranslations } from '../../../../../hooks/useContractTranslations'

import { formatDate } from './helpers'

interface CompanyDocSignatureSectionProps {
  contractId: number
  t: ContractTranslations
}

export default function CompanyDocSignatureSection({ contractId, t }: CompanyDocSignatureSectionProps) {
  const [documents, setDocuments] = useState<CompanyDocSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetch() {
      try {
        const res = await iso3CompanyDocsService.listCompanyDocSignatures(contractId)

        if (!cancelled) setDocuments(res.data.documents)
      } catch {
        if (!cancelled) setError(t.docLoadError)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetch()

    return () => { cancelled = true }
  }, [contractId, t.docLoadError])

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

  if (documents.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        -
      </Typography>
    )
  }

  return (
    <TableContainer>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Document</TableCell>
            <TableCell>{t.docSignedStatus}</TableCell>
            <TableCell>{t.docSignedAtLabel}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map(doc => (
            <TableRow key={doc.id}>
              <TableCell>{doc.modelName}</TableCell>
              <TableCell>
                <Chip
                  label={doc.isSigned ? t.yes : t.no}
                  size='small'
                  color={doc.isSigned ? 'success' : 'default'}
                  variant='outlined'
                />
              </TableCell>
              <TableCell>{formatDate(doc.signedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
