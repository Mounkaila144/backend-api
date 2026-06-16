'use client'

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'

import {
  useReactTable,
  getCoreRowModel,
  flexRender
} from '@tanstack/react-table'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import TablePagination from '@mui/material/TablePagination'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

// Components
import TableToolbar from './TableToolbar'
import MobileCardView from './MobileCardView'

// Types
import type { DataTableConfig } from './types'

// Styles
import tableStyles from '@core/styles/table.module.css'

interface StickyMeta {
  side: 'left' | 'right'
  offset: number
  isEdge: boolean
}

/**
 * Generic DataTable Component
 * Fully reusable across all tables in the application
 */
export function DataTable<TData extends Record<string, any>>(props: DataTableConfig<TData>) {
  const {
    columns,
    data,
    loading = false,
    pagination,
    onPageChange,
    onPageSizeChange,
    onRefresh,
    searchPlaceholder = 'Search...',
    onSearch,
    mobileCard,
    availableColumns,
    columnVisibility: externalColumnVisibility,
    onColumnVisibilityChange,
    actions = [],
    showColumnFilters = false,
    onToggleColumnFilters,
    columnFilters,
    onClearAllFilters,
    createColumnFilter,
    emptyMessage = 'No data available',
    rowsPerPageOptions = [10, 25, 50, 100],
    stickyLeft = [],
    stickyRight = [],
    onRowDoubleClick,
  } = props

  const hasStickyColumns = stickyLeft.length > 0 || stickyRight.length > 0

  // Local states
  const [rowSelection, setRowSelection] = useState({})

  const [localColumnVisibility, setLocalColumnVisibility] = useState<Record<string, boolean>>(
    externalColumnVisibility || {}
  )

  // Sticky column refs and state
  const tableRef = useRef<HTMLTableElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)
  const [tableScrollWidth, setTableScrollWidth] = useState(0)
  const [stickyOffsets, setStickyOffsets] = useState<Record<string, StickyMeta>>({})
  const [showLeftShadow, setShowLeftShadow] = useState(false)
  const [showRightShadow, setShowRightShadow] = useState(false)

  // Use external or local column visibility
  const columnVisibility = externalColumnVisibility || localColumnVisibility

  const handleColumnVisibilityChange = useCallback(
    (newVisibility: Record<string, boolean>) => {
      if (onColumnVisibilityChange) {
        onColumnVisibilityChange(newVisibility)
      } else {
        setLocalColumnVisibility(newVisibility)
      }
    },
    [onColumnVisibilityChange]
  )

  // Filter visible columns
  const visibleColumns = useMemo(() => {
    return columns.filter(column => {
      const id = column.id as string

      // Always show selection and action columns
      if (id === 'select' || id === 'row_number' || id === 'action' || id === 'actions') return true

      // Check visibility
      return columnVisibility[id] !== false
    })
  }, [columns, columnVisibility])

  // Reorder columns: sticky-left first, then non-sticky, then sticky-right
  const orderedColumns = useMemo(() => {
    if (!hasStickyColumns) return visibleColumns

    const stickyLeftSet = new Set(stickyLeft)
    const stickyRightSet = new Set(stickyRight)

    const leftCols = stickyLeft
      .map(id => visibleColumns.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c != null)

    const rightCols = stickyRight
      .map(id => visibleColumns.find(c => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c != null)

    const middleCols = visibleColumns.filter(c => {
      const id = c.id as string

      return !stickyLeftSet.has(id) && !stickyRightSet.has(id)
    })

    return [...leftCols, ...middleCols, ...rightCols]
  }, [visibleColumns, stickyLeft, stickyRight, hasStickyColumns])

  // Initialize table
  const table = useReactTable({
    data,
    columns: orderedColumns,
    state: {
      rowSelection
    },
    pageCount: pagination?.last_page || 1,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel()
  })

  // Measure sticky column widths and compute offsets
  useEffect(() => {
    if (!tableRef.current || !hasStickyColumns) return

    const measure = () => {
      const headerRow = tableRef.current?.querySelector('thead > tr:first-child')

      if (!headerRow) return

      const ths = Array.from(headerRow.children) as HTMLElement[]
      const newOffsets: Record<string, StickyMeta> = {}

      // Left sticky columns (first N after reorder)
      let leftAcc = 0

      for (let i = 0; i < stickyLeft.length; i++) {
        const colId = stickyLeft[i]
        const idx = orderedColumns.findIndex(c => c.id === colId)

        if (idx === -1 || !ths[idx]) continue

        newOffsets[colId] = {
          side: 'left',
          offset: leftAcc,
          isEdge: i === stickyLeft.length - 1,
        }

        leftAcc += ths[idx].getBoundingClientRect().width
      }

      // Right sticky columns (last M after reorder)
      let rightAcc = 0
      const reversedRight = [...stickyRight].reverse()

      for (let i = 0; i < reversedRight.length; i++) {
        const colId = reversedRight[i]
        const idx = orderedColumns.findIndex(c => c.id === colId)

        if (idx === -1 || !ths[idx]) continue

        newOffsets[colId] = {
          side: 'right',
          offset: rightAcc,
          isEdge: i === reversedRight.length - 1,
        }

        rightAcc += ths[idx].getBoundingClientRect().width
      }

      setStickyOffsets(newOffsets)
    }

    const timer = setTimeout(measure, 50)

    const ro = new ResizeObserver(() => setTimeout(measure, 10))

    ro.observe(tableRef.current)

    return () => {
      clearTimeout(timer)
      ro.disconnect()
    }
  }, [orderedColumns, stickyLeft, stickyRight, hasStickyColumns])

  // Scroll detection for shadow indicators
  useEffect(() => {
    const el = scrollContainerRef.current

    if (!el || !hasStickyColumns) return

    const checkScroll = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el

      setShowLeftShadow(scrollLeft > 0)
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })

    const ro = new ResizeObserver(checkScroll)

    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [hasStickyColumns])

  // Sync top scrollbar width with table scroll width
  useEffect(() => {
    const table = tableRef.current
    const container = scrollContainerRef.current

    if (!table || !container) return

    const updateWidth = () => setTableScrollWidth(table.scrollWidth)

    updateWidth()

    const ro = new ResizeObserver(updateWidth)

    ro.observe(table)

    return () => ro.disconnect()
  }, [orderedColumns, data])

  // Bidirectional scroll sync between top scrollbar and table
  useEffect(() => {
    const top = topScrollRef.current
    const bottom = scrollContainerRef.current

    if (!top || !bottom) return

    const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => () => {
      if (isSyncingScroll.current) return

      isSyncingScroll.current = true
      target.scrollLeft = source.scrollLeft
      requestAnimationFrame(() => { isSyncingScroll.current = false })
    }

    const onTopScroll = syncScroll(top, bottom)
    const onBottomScroll = syncScroll(bottom, top)

    top.addEventListener('scroll', onTopScroll, { passive: true })
    bottom.addEventListener('scroll', onBottomScroll, { passive: true })

    return () => {
      top.removeEventListener('scroll', onTopScroll)
      bottom.removeEventListener('scroll', onBottomScroll)
    }
  }, [tableScrollWidth])

  // Get sticky inline styles for a cell
  const getStickyStyle = useCallback(
    (columnId: string, context: 'header' | 'filter' | 'body'): React.CSSProperties | undefined => {
      const meta = stickyOffsets[columnId]

      if (!meta) return undefined

      const bgColors: Record<string, string> = {
        header: 'var(--mui-palette-customColors-tableHeaderBg)',
        filter: 'var(--mui-palette-background-paper)',
        body: 'var(--mui-palette-background-paper)',
      }

      const style: React.CSSProperties = {
        position: 'sticky',
        [meta.side]: meta.offset,
        zIndex: context === 'body' ? 2 : 10,
        backgroundColor: bgColors[context],
      }

      if (meta.isEdge && meta.side === 'left' && showLeftShadow) {
        style.boxShadow = '4px 0 8px -4px rgba(0, 0, 0, 0.15)'
      } else if (meta.isEdge && meta.side === 'right' && showRightShadow) {
        style.boxShadow = '-4px 0 8px -4px rgba(0, 0, 0, 0.15)'
      }

      return style
    },
    [stickyOffsets, showLeftShadow, showRightShadow]
  )

  return (
    <Card>
      {/* Toolbar */}
      <TableToolbar
        searchPlaceholder={searchPlaceholder}
        onSearch={onSearch}
        onRefresh={onRefresh}
        loading={loading}
        actions={actions}
        availableColumns={availableColumns}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={handleColumnVisibilityChange}
        showColumnFilters={showColumnFilters}
        onToggleColumnFilters={onToggleColumnFilters}
        columnFilters={columnFilters}
        onClearAllFilters={onClearAllFilters}
      />

      {/* Mobile Card View */}
      {mobileCard && (
        <Box sx={{ display: { xs: 'block', md: 'none' } }} className='p-4'>
          <MobileCardView
            data={data}
            loading={loading}
            emptyMessage={emptyMessage}
            config={mobileCard}
          />
        </Box>
      )}

      {/* Desktop Table View */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        {/* Top scrollbar */}
        {tableScrollWidth > 0 && (
          <div
            ref={topScrollRef}
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
            }}
            className={tableStyles.topScrollbar}
          >
            <div style={{ width: tableScrollWidth, height: 1 }} />
          </div>
        )}
        <div ref={scrollContainerRef} className='overflow-x-auto'>
          <table ref={tableRef} className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <>
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id} style={getStickyStyle(header.id, 'header')}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                  {showColumnFilters && createColumnFilter && (
                    <tr key={`${headerGroup.id}-filters`} className='bg-backgroundPaper'>
                      {headerGroup.headers.map(header => (
                        <th
                          key={`${header.id}-filter`}
                          style={{ padding: '4px 6px', ...getStickyStyle(header.id, 'filter') }}
                        >
                          {header.id === 'select' || header.id === 'row_number' || header.id === 'action' || header.id === 'actions' ? null : (
                            createColumnFilter(header.id)
                          )}
                        </th>
                      ))}
                    </tr>
                  )}
                </>
              ))}
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    <Box className='flex justify-center items-center' sx={{ py: 10 }}>
                      <CircularProgress />
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : data.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                    <Box sx={{ py: 6 }}>
                      <Typography>{emptyMessage}</Typography>
                    </Box>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id}
                    onDoubleClick={() => onRowDoubleClick?.(row.original)}
                    style={{ cursor: onRowDoubleClick ? 'pointer' : undefined }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={getStickyStyle(cell.column.id, 'body')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </Box>

      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component='div'
          className='border-bs'
          count={pagination.total}
          rowsPerPage={pagination.per_page}
          page={pagination.current_page - 1}
          SelectProps={{
            inputProps: { 'aria-label': 'rows per page' },
            disabled: loading
          }}
          slotProps={{
            actions: {
              nextButton: {
                disabled: loading || pagination.current_page >= pagination.last_page
              },
              previousButton: {
                disabled: loading || pagination.current_page <= 1
              }
            }
          }}
          onPageChange={(_, page) => {
            if (!loading && onPageChange) {
              onPageChange(page + 1)
            }
          }}
          onRowsPerPageChange={e => {
            if (!loading && onPageSizeChange) {
              onPageSizeChange(Number(e.target.value))
            }
          }}
        />
      )}
    </Card>
  )
}

export default DataTable
