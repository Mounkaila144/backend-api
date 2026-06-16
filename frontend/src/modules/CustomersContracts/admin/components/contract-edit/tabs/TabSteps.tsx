'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'

import { contractsService } from '../../../services/contractsService'
import { apiClient } from '@/shared/lib/api-client'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabStepsProps {
  contractId: number | null
  t: ContractTranslations
}

function fmtDate(dateStr: string | null | undefined) {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') return '—'

  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

function fmtCur(val: number | null | undefined) {
  if (val === null || val === undefined) return '—'
  
return val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// Date value for input[type=date]
function dateVal(dateStr: string | null | undefined) {
  if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') return ''
  
return dateStr.split(' ')[0] // "2024-09-11 00:00:00" → "2024-09-11"
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 500, width: '45%', py: 0.5, border: 'none' }}>{label}</TableCell>
      <TableCell sx={{ py: 0.5, border: 'none' }}>{value || '—'}</TableCell>
    </TableRow>
  )
}

interface ParticipantCardProps {
  title: string
  icon: string
  children: React.ReactNode
  editing?: boolean
  saving?: boolean
  onModify?: () => void
  onSave?: () => void
  onCancel?: () => void
}

function ParticipantCard({ title, icon, children, editing, saving, onModify, onSave, onCancel }: ParticipantCardProps) {
  return (
    <Paper variant='outlined' sx={{ height: '100%' }}>
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <i className={icon} style={{ fontSize: 18 }} />
          <Typography variant='subtitle2' fontWeight={600}>{title}</Typography>
        </Box>
        {editing ? (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Button size='small' variant='contained' onClick={onSave} disabled={saving}>
              {saving ? '...' : 'Enregistrer'}
            </Button>
            <Button size='small' variant='outlined' onClick={onCancel}>Annuler</Button>
          </Box>
        ) : (
          <Button size='small' variant='outlined' onClick={onModify}>
            <i className='ri-edit-line' style={{ marginRight: 4 }} />Modifier
          </Button>
        )}
      </Box>
      <Table size='small'>
        <TableBody>{children}</TableBody>
      </Table>
    </Paper>
  )
}

function EditField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <TableRow>
      <TableCell sx={{ fontWeight: 500, width: '45%', py: 0.5, border: 'none', verticalAlign: 'middle' }}>{label}</TableCell>
      <TableCell sx={{ py: 0.5, border: 'none' }}>
        <TextField
          size='small'
          fullWidth
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          slotProps={type === 'date' ? { inputLabel: { shrink: true } } : undefined}
        />
      </TableCell>
    </TableRow>
  )
}

export default function TabSteps({ contractId, t }: TabStepsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null) // which block is being edited
  const [editData, setEditData] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const fetchSteps = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractSteps(contractId)

      if (response.success) setData(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => { fetchSteps() }, [fetchSteps])

  const startEdit = (block: string, initialData: any) => {
    setEditing(block)
    setEditData(initialData || {})
  }

  const cancelEdit = () => { setEditing(null); setEditData({}) }

  const saveEdit = async (block: string) => {
    if (!contractId) return
    setSaving(true)

    try {
      if (block === 'erdf') {
        // Symfony saves ERDF contract + quotation together
        const { contract: contractData, quotation: quotationData } = editData

        await Promise.all([
          apiClient.put(`/admin/customerscontracts/contracts/${contractId}/steps/erdf`, { data: contractData || {} }),
          apiClient.put(`/admin/customerscontracts/contracts/${contractId}/steps/erdf_quotation`, { data: quotationData || {} }),
        ])
      } else {
        await apiClient.put(`/admin/customerscontracts/contracts/${contractId}/steps/${block}`, { data: editData })
      }

      setSuccessMsg('Informations enregistrées')
      setEditing(null)
      fetchSteps()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const setErdfField = (section: 'contract' | 'quotation', key: string, val: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: val },
    }))
  }

  const setField = (key: string, val: string) => setEditData((prev: any) => ({ ...prev, [key]: val }))

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
  }

  if (error) return <Alert severity='error'>{error}</Alert>
  if (!data) return null

  const { erdf, erdf_quotation, cityhall, consuel, installation } = data

  return (
    <Box>
      <Snackbar open={!!successMsg} autoHideDuration={3000} onClose={() => setSuccessMsg(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setSuccessMsg(null)} variant='filled'>{successMsg}</Alert>
      </Snackbar>

      <Grid container spacing={2}>
        {/* ERDF - Combined (Symfony: both columns edited together, Modify button in quotation block) */}
        {editing === 'erdf' ? (

          /* Edit mode: ERDF Contract + Quotation together (like Symfony ajaxModify.tpl) */
          <Grid item xs={12}>
            <Paper variant='outlined'>
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='ri-flashlight-line' style={{ fontSize: 18 }} />
                  <Typography variant='subtitle2' fontWeight={600}>ERDF (ENEDIS)</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Button size='small' variant='outlined' onClick={cancelEdit}>Annuler</Button>
                  <Button size='small' variant='contained' disabled={saving} onClick={() => saveEdit('erdf')}>
                    {saving ? '...' : 'Enregistrer'}
                  </Button>
                </Box>
              </Box>
              <Grid container>
                <Grid item xs={12} md={6} sx={{ p: 2, borderRight: { md: 1 }, borderColor: 'divider' }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>Contrat</Typography>
                  <Table size='small'><TableBody>
                    <EditField label='Date' value={editData.contract?.opened_at || ''} onChange={(v) => setErdfField('contract', 'opened_at', v)} type='date' />
                    <EditField label='Remarques' value={editData.contract?.remarks || ''} onChange={(v) => setErdfField('contract', 'remarks', v)} />
                    <EditField label='Relance' value={editData.contract?.resend_at || ''} onChange={(v) => setErdfField('contract', 'resend_at', v)} type='date' />
                  </TableBody></Table>
                </Grid>
                <Grid item xs={12} md={6} sx={{ p: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1 }}>Devis</Typography>
                  <Table size='small'><TableBody>
                    <EditField label='Date' value={editData.quotation?.opened_at || ''} onChange={(v) => setErdfField('quotation', 'opened_at', v)} type='date' />
                    <EditField label='Montant' value={String(editData.quotation?.amount || '')} onChange={(v) => setErdfField('quotation', 'amount', v)} type='number' />
                    <EditField label='Reçu le' value={editData.quotation?.received_at || ''} onChange={(v) => setErdfField('quotation', 'received_at', v)} type='date' />
                    <EditField label='Vérifié le' value={editData.quotation?.check_at || ''} onChange={(v) => setErdfField('quotation', 'check_at', v)} type='date' />
                    <EditField label='Montant vérifié' value={String(editData.quotation?.check_amount || '')} onChange={(v) => setErdfField('quotation', 'check_amount', v)} type='number' />
                    <EditField label='Remarques' value={editData.quotation?.remarks || ''} onChange={(v) => setErdfField('quotation', 'remarks', v)} />
                  </TableBody></Table>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        ) : (<>
          {/* View mode: ERDF Contract */}
          <Grid item xs={12} md={6}>
            <ParticipantCard title='ERDF (ENEDIS)' icon='ri-flashlight-line'
              editing={false} saving={false}
              onModify={() => startEdit('erdf', {
                contract: { opened_at: dateVal(erdf?.opened_at), remarks: erdf?.remarks || '', resend_at: dateVal(erdf?.resend_at) },
                quotation: { opened_at: dateVal(erdf_quotation?.opened_at), amount: erdf_quotation?.amount || '', received_at: dateVal(erdf_quotation?.received_at), check_at: dateVal(erdf_quotation?.check_at), check_amount: erdf_quotation?.check_amount || '', remarks: erdf_quotation?.remarks || '' },
              })}>
              <Field label='Statut' value={erdf?.status} />
              <Field label='Date' value={fmtDate(erdf?.opened_at)} />
              <Field label='Remarques' value={erdf?.remarks} />
              <Field label='Relance' value={fmtDate(erdf?.resend_at)} />
            </ParticipantCard>
          </Grid>

          {/* View mode: ERDF Quotation (no separate Modify button, handled by ERDF block) */}
          <Grid item xs={12} md={6}>
            <Paper variant='outlined' sx={{ height: '100%' }}>
              <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='ri-file-text-line' style={{ fontSize: 18 }} />
                  <Typography variant='subtitle2' fontWeight={600}>ERDF - Devis</Typography>
                </Box>
              </Box>
              <Table size='small'><TableBody>
                <Field label='Date envoi' value={fmtDate(erdf_quotation?.opened_at)} />
                <Field label='Montant' value={erdf_quotation ? fmtCur(erdf_quotation.amount) : '—'} />
                <Field label='Reçu le' value={fmtDate(erdf_quotation?.received_at)} />
                <Field label='Vérifié le' value={fmtDate(erdf_quotation?.check_at)} />
                <Field label='Montant vérifié' value={erdf_quotation ? fmtCur(erdf_quotation.check_amount) : '—'} />
                <Field label='Remarques' value={erdf_quotation?.remarks} />
              </TableBody></Table>
            </Paper>
          </Grid>
        </>)}

        {/* Mairie */}
        <Grid item xs={12} md={6}>
          <ParticipantCard title='Mairie' icon='ri-government-line'
            editing={editing === 'cityhall'} saving={saving}
            onModify={() => startEdit('cityhall', { send_at: dateVal(cityhall?.send_at), ack_at: dateVal(cityhall?.ack_at), remarks: cityhall?.remarks || '', resend_at: dateVal(cityhall?.resend_at) })}
            onSave={() => saveEdit('cityhall')} onCancel={cancelEdit}>
            {editing === 'cityhall' ? (<>
              <EditField label='Envoyé le' value={editData.send_at || ''} onChange={(v) => setField('send_at', v)} type='date' />
              <EditField label='Accusé le' value={editData.ack_at || ''} onChange={(v) => setField('ack_at', v)} type='date' />
              <EditField label='Remarques' value={editData.remarks || ''} onChange={(v) => setField('remarks', v)} />
              <EditField label='Relance' value={editData.resend_at || ''} onChange={(v) => setField('resend_at', v)} type='date' />
            </>) : (<>
              <Field label='Envoyé le' value={fmtDate(cityhall?.send_at)} />
              <Field label='Accusé le' value={fmtDate(cityhall?.ack_at)} />
              <Field label='Statut' value={cityhall?.status} />
              <Field label='Remarques' value={cityhall?.remarks} />
              <Field label='Relance' value={fmtDate(cityhall?.resend_at)} />
            </>)}
          </ParticipantCard>
        </Grid>

        {/* Consuel */}
        <Grid item xs={12} md={6}>
          <ParticipantCard title='Consuel' icon='ri-shield-check-line'
            editing={editing === 'consuel'} saving={saving}
            onModify={() => startEdit('consuel', { send_at: dateVal(consuel?.send_at), conformity: consuel?.conformity || '', remarks: consuel?.remarks || '', work_before: consuel?.work_before || '' })}
            onSave={() => saveEdit('consuel')} onCancel={cancelEdit}>
            {editing === 'consuel' ? (<>
              <EditField label='Envoyé le' value={editData.send_at || ''} onChange={(v) => setField('send_at', v)} type='date' />
              <EditField label='Conformité' value={editData.conformity || ''} onChange={(v) => setField('conformity', v)} />
              <TableRow>
                <TableCell sx={{ fontWeight: 500, width: '45%', py: 0.5, border: 'none', verticalAlign: 'middle' }}>Travaux avant</TableCell>
                <TableCell sx={{ py: 0.5, border: 'none' }}>
                  <TextField select size='small' fullWidth value={editData.work_before || ''} onChange={(e) => setField('work_before', e.target.value)}>
                    <MenuItem value=''>—</MenuItem>
                    <MenuItem value='YES'>Oui</MenuItem>
                    <MenuItem value='NO'>Non</MenuItem>
                  </TextField>
                </TableCell>
              </TableRow>
              <EditField label='Remarques' value={editData.remarks || ''} onChange={(v) => setField('remarks', v)} />
            </>) : (<>
              <Field label='Envoyé le' value={fmtDate(consuel?.send_at)} />
              <Field label='Statut' value={consuel?.status} />
              <Field label='Conformité' value={consuel?.conformity} />
              <Field label='Installateur' value={consuel?.installer} />
              <Field label='Travaux avant' value={consuel?.work_before} />
              <Field label='Remarques' value={consuel?.remarks} />
            </>)}
          </ParticipantCard>
        </Grid>

        {/* Installation */}
        <Grid item xs={12} md={6}>
          <ParticipantCard title='Installation' icon='ri-tools-line'
            editing={editing === 'installation'} saving={saving}
            onModify={() => startEdit('installation', { counter_at: dateVal(installation?.counter_at), type: installation?.type || '', linked_at: dateVal(installation?.linked_at), worked_at: dateVal(installation?.worked_at) })}
            onSave={() => saveEdit('installation')} onCancel={cancelEdit}>
            {editing === 'installation' ? (<>
              <EditField label='Date compteur' value={editData.counter_at || ''} onChange={(v) => setField('counter_at', v)} type='date' />
              <EditField label='Type' value={editData.type || ''} onChange={(v) => setField('type', v)} />
              <EditField label='Lié le' value={editData.linked_at || ''} onChange={(v) => setField('linked_at', v)} type='date' />
              <EditField label='Travaux le' value={editData.worked_at || ''} onChange={(v) => setField('worked_at', v)} type='date' />
            </>) : (<>
              <Field label='Date compteur' value={fmtDate(installation?.counter_at)} />
              <Field label='Type' value={installation?.type} />
              <Field label='Installateur' value={installation?.installer} />
              <Field label='Lié le' value={fmtDate(installation?.linked_at)} />
              <Field label='Travaux le' value={fmtDate(installation?.worked_at)} />
            </>)}
          </ParticipantCard>
        </Grid>
      </Grid>
    </Box>
  )
}
