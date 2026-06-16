import type { CustomerContract } from '../../../types'

export type ChipColor = 'success' | 'error' | 'warning' | 'default' | 'primary' | 'secondary' | 'info'

export const isYes = (val: any): boolean => val === 'YES' || val === 'Y' || val === true || val === 1

export const getCustomerFullName = (contract: CustomerContract): string => {
  const c = contract.customer

  if (!c) return '-'
  if (c.company) return c.company
  if (c.lastname || c.firstname) return `${c.lastname || ''} ${c.firstname || ''}`.trim().toUpperCase()
  if (c.nom_prenom) return c.nom_prenom.toUpperCase()
  
return '-'
}

export const formatDate = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('fr-FR') : '-'

export const formatDateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

export const formatPrice = (v: number | null | undefined) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0)
