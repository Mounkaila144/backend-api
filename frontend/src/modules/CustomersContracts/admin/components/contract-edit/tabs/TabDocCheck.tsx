'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'

import { apiClient } from '@/shared/lib/api-client'
import { contractsService } from '../../../services/contractsService'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface DocFile {
  id: number
  title: string
  extension: string
  created_at: string | null
}

interface CheckerData {
  checker_id: number
  checker_name: string
  check_id: number | null
  status_id: number | null
  status_label: string | null
  status_color: string | null
  comment: string
  is_hold: string
  files: DocFile[]
  files_count: number
}

interface DocCheckData {
  checkers: CheckerData[]
  statuses: { id: number; label: string; color: string | null }[]
}

interface TabDocCheckProps {
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
}

/**
 * Doc Check tab - Reproduces Symfony's document checker system exactly.
 *
 * For each active checker:
 * - Header: name + status chip + file count badge
 * - Comment section
 * - File table: #, Name (clickable link), Actions (disable/enable + delete)
 * - Dropzone upload area
 */
export default function TabDocCheck({ contractId, t }: TabDocCheckProps) {
  const [data, setData] = useState<DocCheckData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchDocCheck = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractDocCheck(contractId)

      if (response.success) {
        setData(response.data as unknown as DocCheckData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchDocCheck()
  }, [fetchDocCheck])

  // File actions
  const handleDisable = async (fileId: number, fileName: string) => {
    if (!contractId || !confirm(`Le fichier "${fileName}" sera désactivé. Confirmer ?`)) return

    try {
      await apiClient.patch(`/admin/customerscontracts/contracts/${contractId}/doc-check/files/${fileId}/disable`)
      setSuccessMsg('Fichier désactivé')
      fetchDocCheck()
    } catch {
      setError('Erreur lors de la désactivation')
    }
  }



  const handleDelete = async (fileId: number, fileName: string) => {
    if (!contractId || !confirm(`Le fichier "${fileName}" sera supprimé. Confirmer ?`)) return

    try {
      await apiClient.delete(`/admin/customerscontracts/contracts/${contractId}/doc-check/files/${fileId}`)
      setSuccessMsg('Fichier supprimé')
      fetchDocCheck()
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  // File upload
  const handleUpload = async (checkerId: number, checkId: number | null, files: FileList) => {
    if (!contractId) return
    const formData = new FormData()

    formData.append('checker_id', String(checkerId))
    if (checkId) formData.append('check_id', String(checkId))

    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i])
    }

    try {
      await apiClient.post(`/admin/customerscontracts/contracts/${contractId}/doc-check/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccessMsg('Fichier(s) uploadé(s)')
      fetchDocCheck()
    } catch {
      setError("Erreur lors de l'upload")
    }
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
  }

  if (error) return <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>

  if (!data || data.checkers.length === 0) {
    return <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>Aucun document checker actif</Typography>
  }

  return (
    <Box>
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      {data.checkers.map((checker) => (
        <Accordion key={checker.checker_id} defaultExpanded variant='outlined' sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
              <Typography variant='subtitle2' fontWeight={600}>{checker.checker_name}</Typography>
              {checker.status_label ? (
                <Chip label={checker.status_label} size='small' sx={checker.status_color ? { bgcolor: checker.status_color, color: '#fff' } : undefined} />
              ) : null}
              <Badge badgeContent={checker.files_count} color='primary' sx={{ ml: 'auto', mr: 2 }}>
                <i className='ri-file-list-line' style={{ fontSize: 18 }} />
              </Badge>
            </Box>
          </AccordionSummary>

          <AccordionDetails>
            {/* Comment */}
            {checker.comment ? (
              <Box sx={{ mb: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant='caption' color='text.secondary'>Commentaire :</Typography>
                <Typography variant='body2'>{checker.comment}</Typography>
              </Box>
            ) : null}

            {/* Upload zone */}
            <Box
              sx={{ mb: 2, p: 2, border: '2px dashed', borderColor: 'divider', borderRadius: 1, textAlign: 'center', cursor: 'pointer', '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' } }}
              onClick={() => {
                const input = document.createElement('input')

                input.type = 'file'
                input.multiple = true

                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files

                  if (files) handleUpload(checker.checker_id, checker.check_id, files)
                }

                input.click()
              }}
            >
              <i className='ri-upload-cloud-line' style={{ fontSize: 24, opacity: 0.5 }} />
              <Typography variant='body2' color='text.secondary'>
                Cliquer pour ajouter des fichiers
              </Typography>
            </Box>

            {/* Files table */}
            {checker.files.length === 0 ? (
              <Typography color='text.secondary' variant='body2'>Aucun document</Typography>
            ) : (
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>#</TableCell>
                      <TableCell>Nom</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {checker.files.map((file, idx) => (
                      <TableRow key={file.id} hover>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <i className={EXT_ICONS[file.extension?.toLowerCase()] || 'ri-file-line'} />
                            <Typography
                              variant='body2'
                              component='span'
                              sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                              title={`${file.title}.${file.extension}`}
                              onClick={async () => {
                                try {
                                  const response = await apiClient.get(
                                    `/admin/customerscontracts/contracts/${contractId}/doc-check/files/${file.id}/download`,
                                    { responseType: 'blob' },
                                  )


                                  // Use the Content-Type from response, or guess from extension
                                  const mimeMap: Record<string, string> = {
                                    pdf: 'application/pdf',
                                    jpg: 'image/jpeg',
                                    jpeg: 'image/jpeg',
                                    png: 'image/png',
                                    gif: 'image/gif',
                                    doc: 'application/msword',
                                    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                    xls: 'application/vnd.ms-excel',
                                    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                                  }

                                  const contentType = response.headers['content-type'] || mimeMap[file.extension?.toLowerCase()] || 'application/octet-stream'
                                  const blob = new Blob([response.data], { type: contentType })
                                  const url = window.URL.createObjectURL(blob)

                                  window.open(url, '_blank')
                                } catch {
                                  setError('Impossible de télécharger le fichier')
                                }
                              }}
                            >
                              {file.title.length > 30 ? file.title.substring(0, 30) + '...' : file.title}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Tooltip title='Désactiver'>
                            <IconButton size='small' onClick={() => handleDisable(file.id, file.title)}>
                              <i className='ri-close-line' />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title='Supprimer'>
                            <IconButton size='small' color='error' onClick={() => handleDelete(file.id, file.title)}>
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )
}
