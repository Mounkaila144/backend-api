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

import { contractsService } from '../../../services/contractsService'
import type { ContractProductItem } from '../../../../types'
import type { ContractTranslations } from '../../../hooks/useContractTranslations'

interface TabProductsProps {
  contractId: number | null
  t: ContractTranslations
}

export default function TabProducts({ contractId, t }: TabProductsProps) {
  const [products, setProducts] = useState<ContractProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    if (!contractId) return

    try {
      setLoading(true)
      const response = await contractsService.getContractProducts(contractId)

      if (response.success) {
        setProducts(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(t.tabErrorLoading))
    } finally {
      setLoading(false)
    }
  }, [contractId, t.tabErrorLoading])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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

  if (products.length === 0) {
    return (
      <Typography color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        {t.tabProductNoItems}
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined'>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>{t.tabProductRef}</TableCell>
            <TableCell>{t.tabProductName}</TableCell>
            <TableCell>{t.tabProductUnit}</TableCell>
            <TableCell align='right'>{t.tabProductQty}</TableCell>
            <TableCell align='right'>{t.tabProductSaleHT}</TableCell>
            <TableCell align='right'>{t.tabProductTotalHT}</TableCell>
            <TableCell align='right'>{t.tabProductTotalTTC}</TableCell>
            <TableCell>{t.tabProductDetails}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((p, i) => (
            <TableRow key={p.id} hover>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{p.reference || '—'}</TableCell>
              <TableCell>{p.name || '—'}</TableCell>
              <TableCell>{p.unit || '—'}</TableCell>
              <TableCell align='right'>{p.quantity}</TableCell>
              <TableCell align='right'>{p.sale_price_ht.toFixed(2)}</TableCell>
              <TableCell align='right'>{p.total_sale_ht.toFixed(2)}</TableCell>
              <TableCell align='right'>{p.total_sale_ttc.toFixed(2)}</TableCell>
              <TableCell>{p.details || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
