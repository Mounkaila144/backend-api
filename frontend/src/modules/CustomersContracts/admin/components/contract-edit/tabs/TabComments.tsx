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
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'

import { contractsService } from '../../../services/contractsService'
import type { ContractCommentItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabCommentsProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabComments({ contractId, t }: TabCommentsProps) {
  const [comments, setComments] = useState<ContractCommentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractComments(contractId)

      if (response.success) {
        setComments(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async () => {
    if (!contractId || !newComment.trim()) return

    setSubmitting(true)

    try {
      await contractsService.storeContractComment(contractId, newComment.trim())
      setNewComment('')
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: number) => {
    if (!contractId || !confirm(String(t.tabCommentDeleteConfirm))) return

    try {
      await contractsService.deleteContractComment(contractId, commentId)
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'

    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Box>
      {error ? (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {/* New comment form */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          size='small'
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={String(t.tabCommentPlaceholder)}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
        />
        <Button
          variant='contained'
          size='small'
          onClick={handleSubmit}
          disabled={submitting || !newComment.trim()}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {t.tabCommentSend}
        </Button>
      </Box>

      {comments.length === 0 ? (
        <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
          {t.tabCommentNoItems}
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined'>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t.tabCommentDate}</TableCell>
                <TableCell>{t.tabCommentText}</TableCell>
                <TableCell>{t.tabCommentUser}</TableCell>
                <TableCell>{t.tabCommentStatus}</TableCell>
                <TableCell align='center'>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comments.map((c, i) => (
                <TableRow key={c.id} hover>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(c.created_at)}</TableCell>
                  <TableCell>{c.comment}</TableCell>
                  <TableCell>{c.user?.name || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.status}
                      size='small'
                      color={c.status === 'ACTIVE' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align='center'>
                    {c.status === 'ACTIVE' ? (
                      <IconButton size='small' color='error' onClick={() => handleDelete(c.id)}>
                        <i className='ri-delete-bin-line' />
                      </IconButton>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  )
}
