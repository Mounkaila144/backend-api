'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'

import { apiClient } from '@/shared/lib/api-client'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface DocumentItem {
  id: number
  title: string
  file: string
  extension: string
  status: string
  is_picture: boolean
  created_at: string | null
}

interface TabDocumentsProps {
  contractId: number | null
  t: ContractTranslations
}

const EXT_ICONS: Record<string, string> = {
  pdf: 'ri-file-pdf-line',
  doc: 'ri-file-word-line',
  docx: 'ri-file-word-line',
  xls: 'ri-file-excel-line',
  xlsx: 'ri-file-excel-line',
  jpg: 'ri-image-line',
  jpeg: 'ri-image-line',
  png: 'ri-image-line',
  gif: 'ri-image-line',
  txt: 'ri-file-text-line',
  zip: 'ri-file-zip-line',
  rar: 'ri-file-zip-line',
}

const EXT_COLORS: Record<string, 'error' | 'primary' | 'success' | 'warning' | 'info' | 'default'> = {
  pdf: 'error',
  doc: 'primary',
  docx: 'primary',
  xls: 'success',
  xlsx: 'success',
  jpg: 'warning',
  jpeg: 'warning',
  png: 'info',
  gif: 'info',
}

function formatDate(dateStr: string | null) {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return '—'

  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

/**
 * Documents tab - Reproduces Symfony customers_documents module.
 *
 * Features:
 * - Document list with: #, Date, Title, File (clickable), Extension chip, Status, Actions
 * - Upload zone (click to add files)
 * - Download (via authenticated blob URL)
 * - Soft delete
 * - Status filter (ACTIVE/DELETE/ALL)
 */
export default function TabDocuments({ contractId, t }: TabDocumentsProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('ACTIVE')

  const fetchDocuments = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)

      const response = await apiClient.get<{ success: boolean; data: { documents: DocumentItem[] } }>(
        `/admin/customersdocuments/contracts/${contractId}/documents`,
        { params: { status: statusFilter } },
      )

      if (response.data.success) {
        setDocuments(response.data.data.documents)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, statusFilter, t.tabErrorLoading])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleDownload = async (docId: number, fileName: string, extension: string) => {
    if (!contractId) return

    try {
      const response = await apiClient.get(
        `/admin/customersdocuments/contracts/${contractId}/documents/${docId}/download`,
        { responseType: 'blob' },
      )

      const mimeMap: Record<string, string> = {
        pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
        gif: 'image/gif', doc: 'application/msword', txt: 'text/plain',
      }

      const contentType = response.headers['content-type'] || mimeMap[extension?.toLowerCase()] || 'application/octet-stream'
      const blob = new Blob([response.data], { type: contentType })
      const url = window.URL.createObjectURL(blob)

      window.open(url, '_blank')
    } catch {
      setError('Impossible de télécharger le fichier')
    }
  }

  const handleDelete = async (docId: number, title: string) => {
    if (!contractId || !confirm(`Le document "${title}" sera supprimé. Confirmer ?`)) return

    try {
      await apiClient.delete(`/admin/customersdocuments/contracts/${contractId}/documents/${docId}`)
      setSuccessMsg('Document supprimé')
      fetchDocuments()
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  const handleUpload = async (files: FileList) => {
    if (!contractId) return
    const formData = new FormData()

    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i])
    }

    try {
      await apiClient.post(`/admin/customersdocuments/contracts/${contractId}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccessMsg('Document(s) ajouté(s)')
      fetchDocuments()
    } catch {
      setError("Erreur lors de l'upload")
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
  }

  return (
    <Box>
      {error ? <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert> : null}
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      {/* Upload zone + Status filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
        <Box
          sx={{ flex: 1, p: 2, border: '2px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
          onClick={() => {
            const input = document.createElement('input')

            input.type = 'file'
            input.multiple = true

            input.onchange = (e) => {
              const files = (e.target as HTMLInputElement).files

              if (files) handleUpload(files)
            }

            input.click()
          }}
        >
          <i className='ri-upload-cloud-line' style={{ fontSize: 20, opacity: 0.5 }} />
          <Typography variant='body2' color='text.secondary'>
            Ajouter des fichiers
          </Typography>
        </Box>
        <TextField
          select
          size='small'
          label='Statut'
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 150 }}
        >
          <MenuItem value='ACTIVE'>Actif</MenuItem>
          <MenuItem value='DELETE'>Supprimé</MenuItem>
          <MenuItem value='ALL'>Tout</MenuItem>
        </TextField>
      </Box>

      {/* Documents table */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Titre</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                  Aucun document
                </TableCell>
              </TableRow>
            ) : null}
            {documents.map((doc, idx) => (
              <TableRow key={doc.id} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(doc.created_at)}</TableCell>
                <TableCell>{doc.title}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className={EXT_ICONS[doc.extension?.toLowerCase()] || 'ri-file-line'} />
                    <Typography
                      variant='body2'
                      component='span'
                      sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                      onClick={() => handleDownload(doc.id, doc.file, doc.extension)}
                    >
                      {doc.title.length > 30 ? doc.title.substring(0, 30) + '...' : doc.title}
                    </Typography>
                    <Chip
                      label={doc.extension?.toUpperCase()}
                      size='small'
                      color={EXT_COLORS[doc.extension?.toLowerCase()] || 'default'}
                      variant='outlined'
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={doc.status === 'ACTIVE' ? 'Actif' : 'Supprimé'}
                    size='small'
                    color={doc.status === 'ACTIVE' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {doc.status === 'ACTIVE' ? (
                    <Tooltip title='Supprimer'>
                      <IconButton size='small' color='error' onClick={() => handleDelete(doc.id, doc.title)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    </Tooltip>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
