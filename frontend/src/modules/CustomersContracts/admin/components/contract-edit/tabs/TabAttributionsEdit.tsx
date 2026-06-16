'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'

import { apiClient } from '@/shared/lib/api-client'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface UserOrTeam {
  id: number
  name: string
  is_active: boolean
}

interface Attribution {
  id: number
  name: string
}

interface ContributorFormData {
  type: string
  type_label: string
  is_team: boolean
  user_id: number | null
  team_id: number | null
  attribution_id: number | null
  payment_at: string | null
  users: UserOrTeam[]
  attributions: Attribution[]
}

interface AttributionsFormData {
  contributors: ContributorFormData[]
}

interface ContributorValues {
  user_id: number | null
  team_id: number | null
  attribution_id: number | null
  payment_at: string | null
}

interface TabAttributionsEditProps {
  contractId: number | null
  t: ContractTranslations
  onSave: (data: Record<string, ContributorValues>) => Promise<void>
}

/**
 * Edit form for attributions - contributors with user/team + attribution + payment_at.
 * Reproduces Symfony: customers_contracts_ajaxModifyAttributions2.tpl
 */
export default function TabAttributionsEdit({ contractId }: TabAttributionsEditProps) {
  const [formData, setFormData] = useState<AttributionsFormData | null>(null)
  const [values, setValues] = useState<Record<string, ContributorValues>>({})
  const [loading, setLoading] = useState(true)

  const fetchFormData = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)

      const response = await apiClient.get<{ success: boolean; data: AttributionsFormData }>(
        `/admin/customerscontracts/contracts/${contractId}/attributions/edit`,
      )

      if (response.data.success) {
        setFormData(response.data.data)

        const initial: Record<string, ContributorValues> = {}

        for (const c of response.data.data.contributors) {
          initial[c.type] = {
            user_id: c.user_id,
            team_id: c.team_id,
            attribution_id: c.attribution_id,
            payment_at: c.payment_at,
          }
        }

        setValues(initial)
      }
    } catch {
      // Error handled by parent
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    fetchFormData()
  }, [fetchFormData])

  // Expose current values for parent save button
  useEffect(() => {
    ;(TabAttributionsEdit as any)._currentValues = values
  }, [values])

  if (loading || !formData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  return (
    <Paper variant='outlined'>
      <Table size='small'>
        <TableBody>
          {formData.contributors.map((contributor) => {
            const val = values[contributor.type] || {
              user_id: null,
              team_id: null,
              attribution_id: null,
              payment_at: null,
            }

            return (
              <TableRow key={contributor.type}>
                {/* Type label */}
                <TableCell sx={{ fontWeight: 500, width: '160px', verticalAlign: 'middle' }}>
                  {contributor.type_label}
                </TableCell>

                {/* User or Team dropdown */}
                <TableCell>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    value={contributor.is_team ? (val.team_id ?? '') : (val.user_id ?? '')}
                    onChange={(e) => {
                      const id = e.target.value ? Number(e.target.value) : null

                      setValues((prev) => ({
                        ...prev,
                        [contributor.type]: {
                          ...prev[contributor.type],
                          ...(contributor.is_team ? { team_id: id } : { user_id: id }),
                        },
                      }))
                    }}
                  >
                    <MenuItem value=''>
                      {contributor.is_team ? 'Aucune équipe' : '—'}
                    </MenuItem>
                    {contributor.users.map((item) => (
                      <MenuItem key={item.id} value={item.id} disabled={!item.is_active}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* Attribution dropdown */}
                <TableCell sx={{ width: '180px' }}>
                  <TextField
                    select
                    fullWidth
                    size='small'
                    value={val.attribution_id ?? ''}
                    onChange={(e) => {
                      const attrId = e.target.value ? Number(e.target.value) : null

                      setValues((prev) => ({
                        ...prev,
                        [contributor.type]: { ...prev[contributor.type], attribution_id: attrId },
                      }))
                    }}
                  >
                    <MenuItem value=''>—</MenuItem>
                    {contributor.attributions.map((attr) => (
                      <MenuItem key={attr.id} value={attr.id}>
                        {attr.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* Payment date */}
                <TableCell sx={{ width: '180px' }}>
                  <TextField
                    type='date'
                    fullWidth
                    size='small'
                    label='Le'
                    value={val.payment_at?.split(' ')[0] ?? ''}
                    onChange={(e) => {
                      setValues((prev) => ({
                        ...prev,
                        [contributor.type]: { ...prev[contributor.type], payment_at: e.target.value || null },
                      }))
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Paper>
  )
}
