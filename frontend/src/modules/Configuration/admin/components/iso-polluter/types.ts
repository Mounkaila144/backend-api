// Shared types for IsoPolluterCrud and its sub-components.
//
// Kept minimal and isolated here so the orchestrator (`IsoPolluterCrud.tsx`)
// and presentation pieces (`PolluterListTable`, `PolluterFormDialog`,
// `PolluterConfirmDialogs`, `PolluterSubSectionRouter`) all reference
// the same shape without depending on each other.

export interface PolluterItem {
  id: number
  name: string
  commercial: string | null
  postcode: string | null
  city: string | null
  phone: string | null
  mobile: string | null
  email: string | null
  is_active: string
  is_default: string
  type: string | null
  ape: string | null
  siret: string | null
  tva: string | null
  address1: string | null
  address2: string | null
  country: string | null
  web: string | null
  fax: string | null
}

export interface FormData {
  name: string
  commercial: string
  type: string
  is_active: string
  is_default: string
  email: string
  web: string
  phone: string
  mobile: string
  fax: string
  address1: string
  address2: string
  postcode: string
  city: string
  country: string
  ape: string
  siret: string
  tva: string
}

export interface FilterState {
  name: string
  commercial: string
  postcode: string
  city: string
  phone: string
  is_active: string
  order_by: string
  order_dir: 'asc' | 'desc'
}

export type SubSectionKey =
  | 'contacts'
  | 'layer'
  | 'pricing'
  | 'products'
  | 'properties'
  | 'boilerPack'
  | 'itePrice'
  | 'models'
  | 'documentsModels'
  | 'preMeetingModel'
  | 'quotationModel'
  | 'documents'
  | 'billingModel'
  | 'afterWorkModel'
  | 'recipients'

// Granular per-action permission flags. Mirrors theme32a row actions.
export interface PolluterPermissions {
  view: boolean
  contacts: boolean
  layer: boolean
  pricing: boolean
  properties: boolean
  boilerPack: boolean
  itePrice: boolean
  models: boolean
  docModels: boolean
  preMeeting: boolean
  quotationModel: boolean
  documents: boolean
  billingModel: boolean
  afterWork: boolean
  recipients: boolean
  exportOne: boolean
  delete: boolean
  remove: boolean
  superadmin: boolean
}

export const emptyForm: FormData = {
  name: '',
  commercial: '',
  type: '',
  is_active: 'YES',
  is_default: 'NO',
  email: '',
  web: '',
  phone: '',
  mobile: '',
  fax: '',
  address1: '',
  address2: '',
  postcode: '',
  city: '',
  country: '',
  ape: '',
  siret: '',
  tva: '',
}

export const emptyFilter: FilterState = {
  name: '',
  commercial: '',
  postcode: '',
  city: '',
  phone: '',
  is_active: 'ALL',
  order_by: 'name',
  order_dir: 'asc',
}

export const isYes = (val: unknown): boolean => {
  if (typeof val === 'string') return val.toUpperCase() === 'YES'
  return Boolean(val)
}
