'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Switch from '@mui/material/Switch'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import type { useConfigTranslations } from '@/modules/Configuration/admin/hooks/useConfigTranslations'

import type { FilterState, PolluterItem, PolluterPermissions, SubSectionKey } from './types'
import { isYes } from './types'

type ConfigTranslations = ReturnType<typeof useConfigTranslations>

interface PolluterListTableProps {
  items: PolluterItem[]
  loading: boolean
  filter: FilterState
  can: PolluterPermissions
  onSort: (col: string) => void
  onFilterChange: (next: FilterState) => void
  onOpenCreate: () => void
  onOpenEdit: (item: PolluterItem) => void
  onToggleActive: (item: PolluterItem) => void
  onDelete: (item: PolluterItem) => void
  onRemove: (item: PolluterItem) => void
  onSubSection: (key: SubSectionKey, polluter: PolluterItem) => void
  onExportOne: (id: number) => void
  onExportAll: () => void
  onOpenImport: () => void
  onResetFilter: () => void
  t: ConfigTranslations
}

export default function PolluterListTable({
  items,
  filter,
  can,
  onSort,
  onFilterChange,
  onOpenCreate,
  onOpenEdit,
  onToggleActive,
  onDelete,
  onRemove,
  onSubSection,
  onExportOne,
  onExportAll,
  onOpenImport,
  onResetFilter,
  t,
}: PolluterListTableProps) {
  const sortIcon = (col: string) => {
    if (filter.order_by !== col) return 'ri-arrow-up-down-line'
    return filter.order_dir === 'asc' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'
  }

  return (
    <>
      <Typography variant='h5' sx={{ mb: 3 }}>
        {t.isoPolluterTitle}
      </Typography>

      {/* Header buttons (theme32a: New + Export superadmin + Import superadmin) */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button variant='contained' onClick={onOpenCreate}>
          <i className='ri-add-line' style={{ marginRight: 6 }} />
          {t.isoPolluterNew}
        </Button>
        {can.superadmin ? (
          <>
            <Button variant='outlined' onClick={onExportAll}>
              <i className='ri-upload-2-line' style={{ marginRight: 6 }} />
              {t.isoPolluterExport}
            </Button>
            <Button variant='outlined' onClick={onOpenImport}>
              <i className='ri-download-2-line' style={{ marginRight: 6 }} />
              {t.isoPolluterImport}
            </Button>
          </>
        ) : null}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant='outlined' onClick={() => window.history.back()}>
          <i className='ri-arrow-left-line' style={{ marginRight: 6 }} />
          {t.statusCrudBack}
        </Button>
      </Box>

      {/* Active status filter + Reset */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
        <TextField
          select
          size='small'
          label={t.isoPolluterIsActiveCol}
          value={filter.is_active}
          onChange={e => onFilterChange({ ...filter, is_active: e.target.value })}
          SelectProps={{ native: true }}
          sx={{ minWidth: 120 }}
        >
          <option value='ALL'>—</option>
          <option value='YES'>YES</option>
          <option value='NO'>NO</option>
        </TextField>
        <Button size='small' variant='text' onClick={onResetFilter}>
          {t.isoPolluterReset}
        </Button>
      </Box>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer component={Paper} elevation={0}>
            <Table size='small'>
              <TableHead>
                {/* Column headers with sort */}
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onSort('name')}>
                    {t.isoPolluterName} <i className={sortIcon('name')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onSort('commercial')}>
                    {t.isoPolluterCommercial} <i className={sortIcon('commercial')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onSort('postcode')}>
                    {t.isoPolluterPostcode} <i className={sortIcon('postcode')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onSort('city')}>
                    {t.isoPolluterCity} <i className={sortIcon('city')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onSort('phone')}>
                    {t.isoPolluterPhone} <i className={sortIcon('phone')} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoPolluterIsDefaultCol}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoPolluterTypeCol}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t.isoPolluterIsActiveCol}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align='right'>
                    {t.isoPolluterActions}
                  </TableCell>
                </TableRow>
                {/* Per-column search row (theme32a pattern) */}
                <TableRow>
                  <TableCell />
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.name}
                      onChange={e => onFilterChange({ ...filter, name: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.commercial}
                      onChange={e => onFilterChange({ ...filter, commercial: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.postcode}
                      onChange={e => onFilterChange({ ...filter, postcode: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.city}
                      onChange={e => onFilterChange({ ...filter, city: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size='small'
                      variant='standard'
                      placeholder='…'
                      value={filter.phone}
                      onChange={e => onFilterChange({ ...filter, phone: e.target.value })}
                    />
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                      {t.isoPolluterEmpty}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <TableRow key={item.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.commercial || '—'}</TableCell>
                      <TableCell>{item.postcode || '—'}</TableCell>
                      <TableCell>{item.city || '—'}</TableCell>
                      <TableCell>{item.phone || '—'}</TableCell>
                      <TableCell>
                        {isYes(item.is_default) ? (
                          <i className='ri-checkbox-circle-fill' style={{ color: '#10B981' }} />
                        ) : (
                          <i className='ri-close-circle-line' style={{ color: '#9CA3AF' }} />
                        )}
                      </TableCell>
                      <TableCell>{item.type || '—'}</TableCell>
                      <TableCell>
                        <Tooltip title={isYes(item.is_active) ? 'YES' : 'NO'}>
                          <Switch
                            size='small'
                            checked={isYes(item.is_active)}
                            onChange={() => onToggleActive(item)}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {/* 17 actions theme32a — gated by individual credentials */}
                        {can.view ? (
                          <Tooltip title={t.isoPolluterRowAction_Edit}>
                            <IconButton size='small' color='primary' onClick={() => onOpenEdit(item)}>
                              <i className='ri-edit-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.contacts ? (
                          <Tooltip title={t.isoPolluterRowAction_Contacts}>
                            <IconButton size='small' onClick={() => onSubSection('contacts', item)}>
                              <i className='ri-team-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.layer ? (
                          <Tooltip title={t.isoPolluterRowAction_Layer}>
                            <IconButton size='small' onClick={() => onSubSection('layer', item)}>
                              <i className='ri-stack-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.pricing ? (
                          <Tooltip title={t.isoPolluterRowAction_Pricing}>
                            <IconButton size='small' onClick={() => onSubSection('pricing', item)}>
                              <i className='ri-money-euro-circle-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {/* Products button — iso5 (always visible if user has settings access) */}
                        <Tooltip title={t.isoPolluterRowAction_Products}>
                          <IconButton size='small' onClick={() => onSubSection('products', item)}>
                            <i className='ri-product-hunt-line' />
                          </IconButton>
                        </Tooltip>

                        {can.properties ? (
                          <Tooltip title={t.isoPolluterRowAction_Properties}>
                            <IconButton size='small' onClick={() => onSubSection('properties', item)}>
                              <i className='ri-money-euro-circle-line' style={{ color: '#DC2626' }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.boilerPack ? (
                          <Tooltip title={t.isoPolluterRowAction_BoilerPack}>
                            <IconButton size='small' onClick={() => onSubSection('boilerPack', item)}>
                              <i className='ri-fire-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.itePrice && ['ITE', 'TYPE1', 'TYPE2'].includes((item.type ?? '').toUpperCase()) ? (
                          <Tooltip title={t.isoPolluterRowAction_ITEPrice}>
                            <IconButton size='small' onClick={() => onSubSection('itePrice', item)}>
                              <i className='ri-home-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.models ? (
                          <Tooltip title={t.isoPolluterRowAction_Models}>
                            <IconButton size='small' onClick={() => onSubSection('models', item)}>
                              <i className='ri-file-text-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.docModels ? (
                          <Tooltip title={t.isoPolluterRowAction_DocumentsModels}>
                            <IconButton size='small' onClick={() => onSubSection('documentsModels', item)}>
                              <i className='ri-file-text-line' style={{ color: '#10B981' }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.preMeeting ? (
                          <Tooltip title={t.isoPolluterRowAction_PreMeetingModel}>
                            <IconButton size='small' onClick={() => onSubSection('preMeetingModel', item)}>
                              <i className='ri-file-line' style={{ color: '#3B82F6' }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.quotationModel ? (
                          <Tooltip title={t.isoPolluterRowAction_QuotationModel}>
                            <IconButton size='small' onClick={() => onSubSection('quotationModel', item)}>
                              <i className='ri-file-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.documents ? (
                          <Tooltip title={t.isoPolluterRowAction_Documents}>
                            <IconButton size='small' onClick={() => onSubSection('documents', item)}>
                              <i className='ri-folder-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.billingModel ? (
                          <Tooltip title={t.isoPolluterRowAction_BillingModel}>
                            <IconButton size='small' onClick={() => onSubSection('billingModel', item)}>
                              <i className='ri-file-line' style={{ color: '#DC2626' }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.afterWork ? (
                          <Tooltip title={t.isoPolluterRowAction_AfterWorkModel}>
                            <IconButton size='small' onClick={() => onSubSection('afterWorkModel', item)}>
                              <i className='ri-file-line' style={{ color: '#F59E0B' }} />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.recipients ? (
                          <Tooltip title={t.isoPolluterRowAction_Recipients}>
                            <IconButton size='small' onClick={() => onSubSection('recipients', item)}>
                              <i className='ri-building-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.exportOne ? (
                          <Tooltip title={t.isoPolluterRowAction_Export}>
                            <IconButton size='small' onClick={() => onExportOne(item.id)}>
                              <i className='ri-upload-2-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.delete ? (
                          <Tooltip title={t.isoPolluterRowAction_Edit + ' / ' + t.statusCrudDelete}>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => onDelete(item)}
                            >
                              <i className='ri-close-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}

                        {can.remove ? (
                          <Tooltip title={t.isoPolluterRemove}>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() => onRemove(item)}
                            >
                              <i className='ri-delete-bin-line' />
                            </IconButton>
                          </Tooltip>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </>
  )
}
