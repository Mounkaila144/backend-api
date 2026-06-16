'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'

import type { MeetingTranslations } from '../../../hooks/useMeetingTranslations'

interface TabDocumentsProps {
  meetingId: number | null
  t: MeetingTranslations
}

/**
 * Documents tab — mirrors Symfony customers_documents/listForMeeting component.
 * Features: file upload (dropzone), document list with status, download, delete.
 * Currently a structured placeholder — API integration pending CustomersDocuments
 * module migration. Equivalent to the contract main "Documents" tab
 * (`CustomersContracts/.../tabs/TabDocuments.tsx`) which already wires the
 * upload/download endpoints — once the meeting endpoints exist on the
 * CustomersDocuments backend, this placeholder can be promoted to a full
 * implementation.
 *
 * Note (Story M1): the polluter-typed ISO3 documents (PreMeeting PDF + last
 * quotation summary) live in a separate sub-tab "Documents" inside the
 * Rendez-vous tab — see `tabs/sub-tabs/EditSubTabDocuments.tsx`.
 */
export default function TabDocuments({ t }: TabDocumentsProps) {
  const [dragOver, setDragOver] = useState(false)
  const tR = t as Record<string, string>

  return (
    <Box>
      {/* Upload zone — mirrors Symfony Dropzone */}
      <Paper
        variant='outlined'
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false) }}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: dragOver ? 'primary.main' : 'divider',
          bgcolor: dragOver ? 'action.hover' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <i className='ri-upload-cloud-2-line' style={{ fontSize: 40, opacity: 0.5 }} />
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          {tR.tabDropDocuments ?? 'Glissez-déposez des fichiers ici ou cliquez pour parcourir'}
        </Typography>
        <Button variant='outlined' size='small' sx={{ mt: 1 }}>
          {tR.tabBrowseFiles ?? 'Parcourir'}
        </Button>
      </Paper>

      <Alert severity='info' sx={{ mb: 2 }}>
        {tR.tabDocumentsComingSoon ?? 'La gestion des documents sera disponible après la migration du module CustomersDocuments.'}
      </Alert>

      {/* Documents table — mirrors Symfony table structure */}
      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>#</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabDate ?? 'Date'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabTitle ?? 'Titre'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabDocument ?? 'Document'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabStatus ?? 'Statut'}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{tR.tabActions ?? 'Actions'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                {tR.tabNoDocuments ?? 'Aucun document'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
