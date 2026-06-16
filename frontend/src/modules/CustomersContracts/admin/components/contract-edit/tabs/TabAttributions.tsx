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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Snackbar from '@mui/material/Snackbar'

import TabAttributionsEdit from './TabAttributionsEdit'
import { contractsService } from '../../../services/contractsService'
import { apiClient } from '@/shared/lib/api-client'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface Contributor {
  id: number
  type: string
  type_label: string
  user: string | null
  attribution: string | null
  payment_at: string | null
}

interface AttributionsData {
  team: { id: number; name: string } | null
  contributors: Contributor[]
}

interface TabAttributionsProps {
  contractId: number | null
  t: ContractTranslations
}

/**
 * Contract attributions tab with two modes (like Symfony):
 * 1. Read-only view: contributors table + "Modifier" button
 * 2. Edit mode: contributor dropdowns (user + attribution) from dedicated API
 *
 * The edit is fully independent from the main contract form.
 */
export default function TabAttributions({ contractId, t }: TabAttributionsProps) {
  const [data, setData] = useState<AttributionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Note: edit values are passed via static property on TabAttributionsEdit (see handleSaveAttributions)

  const fetchAttributions = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractAttributions(contractId)

      if (response.success) {
        setData(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchAttributions()
  }, [fetchAttributions])

  const handleSaveAttributions = async (
    values: Record<string, { user_id: number | null; attribution_id: number | null }>,
  ) => {
    if (!contractId) return

    setSaving(true)
    setError(null)

    try {
      await apiClient.put(`/admin/customerscontracts/contracts/${contractId}/attributions`, {
        attributions: {
          team_id: 0,
          contributors: values,
        },
      })
      setSuccessMsg('Attributions enregistrées avec succès')
      setEditMode(false)
      fetchAttributions()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  // Edit mode
  if (editMode) {
    return (
      <Box>
        {error ? (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : null}

        <Snackbar
          open={!!successMsg}
          autoHideDuration={3000}
          onClose={() => setSuccessMsg(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>
            {successMsg}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
          <Button
            variant='outlined'
            size='small'
            onClick={() => {
              setEditMode(false)
              setError(null)
            }}
          >
            <i className='ri-close-line' style={{ marginRight: 6 }} />
            Annuler
          </Button>
          <Button
            variant='contained'
            size='small'
            disabled={saving}
            onClick={() => {
              // Get values from the edit component via the static ref
              const currentValues = (TabAttributionsEdit as any)._currentValues || {}

              handleSaveAttributions(currentValues)
            }}
          >
            <i className='ri-save-line' style={{ marginRight: 6 }} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </Box>

        <TabAttributionsEdit
          contractId={contractId}
          t={t}
          onSave={handleSaveAttributions}
        />
      </Box>
    )
  }

  // Read-only mode
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>
  }

  if (!data) return null

  return (
    <Box>
      <Snackbar
        open={!!successMsg}
        autoHideDuration={3000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>
          {successMsg}
        </Alert>
      </Snackbar>

      <Box sx={{ mb: 2 }}>
        <Button variant='outlined' size='small' onClick={() => setEditMode(true)}>
          <i className='ri-edit-line' style={{ marginRight: 6 }} />
          Modifier
        </Button>
      </Box>

      {data.team ? (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='subtitle2'>Équipe :</Typography>
          <Chip label={data.team.name} size='small' color='primary' variant='outlined' />
        </Box>
      ) : null}

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Attribution</TableCell>
              <TableCell>Date paiement</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.contributors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align='center' sx={{ py: 3, color: 'text.secondary' }}>
                  Aucune attribution
                </TableCell>
              </TableRow>
            ) : null}
            {data.contributors.map((c: Contributor) => (
              <TableRow key={c.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{c.type_label}</TableCell>
                <TableCell>{c.user || '—'}</TableCell>
                <TableCell>{c.attribution || '—'}</TableCell>
                <TableCell>
                  {c.payment_at
                    ? new Date(c.payment_at).toLocaleDateString('fr-FR')
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
