// ---------------------------------------------------------------------------
// Document tab helpers
// ---------------------------------------------------------------------------

export const POLLUTER_TYPE_SUFFIXES: Record<string, string> = {
  BOILER: '1 / 1-4',
  PAC: '2 / 1-4',
  ITE: '3 / 3-4',
  TYPE1: '4 / 3',
  TYPE2: '5 / 3',
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-'

  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function resolvePolluterType(name: string): string {
  const upper = name.toUpperCase()

  if (upper.includes('BOILER') || upper.includes('CHAUDIERE')) return 'BOILER'
  if (upper.includes('PAC')) return 'PAC'
  if (upper.includes('ITE')) return 'ITE'
  if (upper.includes('TYPE1')) return 'TYPE1'
  if (upper.includes('TYPE2')) return 'TYPE2'

  return 'ISO'
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '-'

  const d = new Date(isoDate)

  if (isNaN(d.getTime())) return isoDate

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}
