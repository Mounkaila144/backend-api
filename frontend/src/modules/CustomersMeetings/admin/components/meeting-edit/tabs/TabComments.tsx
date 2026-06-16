'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'

import { meetingsService } from '../../../services/meetingsService'
import type { MeetingComment } from '../../../services/meetingsService'
import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabCommentsProps {
  meetingId: number | null
  t: MeetingTranslations
}

export default function TabComments({ meetingId, t }: TabCommentsProps) {
  const [comments, setComments] = useState<MeetingComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    if (!meetingId) return
    setLoading(true)
    setError(null)

    try {
      const res = await meetingsService.getComments(meetingId)

      if (res.success) {
        setComments(res.data)
      }
    } catch {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleAddComment = async () => {
    if (!meetingId || !newComment.trim()) return
    setSubmitting(true)

    try {
      const res = await meetingsService.addComment(meetingId, newComment.trim())

      if (res.success) {
        setNewComment('')
        await loadComments()
      }
    } catch {
      setError('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
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

      {/* Add comment form */}
      <Paper variant='outlined' sx={{ p: 2, mb: 3 }}>
        <Typography variant='subtitle2' sx={{ mb: 1 }}>
          {(t as Record<string, string>).tabAddComment ?? 'Ajouter un commentaire'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={(t as Record<string, string>).tabCommentPlaceholder ?? 'Votre commentaire...'}
            size='small'
          />
          <Button
            variant='contained'
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
            sx={{ alignSelf: 'flex-end', minWidth: 100 }}
          >
            {submitting ? <CircularProgress size={20} /> : ((t as Record<string, string>).tabSend ?? 'Envoyer')}
          </Button>
        </Box>
      </Paper>

      {/* Comments table */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {(t as Record<string, string>).tabDate ?? 'Date'}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {(t as Record<string, string>).tabComment ?? 'Commentaire'}
              </TableCell>
              <TableCell sx={{ fontWeight: 600 }}>
                {(t as Record<string, string>).tabType ?? 'Type'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                  {(t as Record<string, string>).tabNoComments ?? 'Aucun commentaire'}
                </TableCell>
              </TableRow>
            ) : (
              comments.map((c, index) => (
                <TableRow key={c.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{c.created_at ?? '---'}</TableCell>
                  <TableCell>{c.comment}</TableCell>
                  <TableCell>
                    {c.type ? (
                      <Chip
                        label={c.type}
                        size='small'
                        color={c.type === 'USER' ? 'primary' : c.type === 'SYSTEM' ? 'warning' : 'default'}
                      />
                    ) : '---'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
