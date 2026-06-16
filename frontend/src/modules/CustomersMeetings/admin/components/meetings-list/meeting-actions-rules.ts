import type { CustomerMeeting } from '../../../types'

type SymfonyCredential = string | string[] | string[][]

export type CredentialChecker = (credential: SymfonyCredential, requireAll?: boolean) => boolean

export type MeetingActionName =
  | 'edit'
  | 'delete'
  | 'recycle'
  | 'confirm'
  | 'unconfirm'
  | 'hold_quote'
  | 'unhold_quote'
  | 'send_sms'
  | 'send_email'
  | 'new_comment'
  | 'copy_meeting'
  | 'create_contract'
  | 'create_default_products'
  | 'export_kml'
  | 'export_pdf'
  | 'migrate'
  | 'transfer_to_slave'
  | 'slaves_transfer'

export interface HoldQuotePermission {
  visible: boolean
  clickable: boolean
  action: 'hold_quote' | 'unhold_quote'
}

export interface MeetingActionPermissions {
  canConfirm: boolean
  canEdit: boolean
  canCopyMeeting: boolean
  canSendSms: boolean
  canSendEmail: boolean
  canExportKml: boolean
  canExportPdf: boolean
  canCreateContract: boolean
  canCreateDefaultProducts: boolean
  holdQuote: HoldQuotePermission
  canTransferToSlave: boolean
  canSlavesTransfer: boolean
  canNewComment: boolean
  canDeleteOrRecycle: boolean
  canMigrate: boolean
  statusAction: 'delete' | 'recycle'
}

function isMeetingTransferred(meeting: CustomerMeeting): boolean {
  const transferred = meeting.transferred ?? meeting.variables?.transferred ?? meeting.variables?.getTransferred

  return transferred === true || transferred === 'YES' || transferred === 1 || transferred === '1'
}

export function isMeetingActionsAuthorized(
  meeting: CustomerMeeting,
  hasCredential: CredentialChecker,
  userId?: number | null
): boolean {
  if (hasCredential([['superadmin', 'admin', 'meeting_owner']])) return true
  if (!hasCredential([['meeting_list_owner']])) return true

  if (userId != null) {
    if (userId === meeting.assistant_id) return true
    if (userId === meeting.telepro_id) return true
    if (userId === meeting.sales_id) return true
    if (userId === meeting.sale2_id) return true
  }

  if (hasCredential([['meeting_list_owner_free_assistant']]) && !meeting.assistant_id) return true
  if (hasCredential([['meeting_list_owner_free_telepro']]) && !meeting.telepro_id) return true
  if (hasCredential([['meeting_list_owner_free_sale1']]) && !meeting.sales_id) return true
  if (hasCredential([['meeting_list_owner_free_sale2']]) && !meeting.sale2_id) return true

  return false
}

export function getMeetingActionPermissions(
  meeting: CustomerMeeting,
  hasCredential: CredentialChecker
): MeetingActionPermissions {
  const isHold = meeting.is_hold === 'YES'
  const isHoldQuote = meeting.is_hold_quote === 'YES'
  const holdQuoteVisible = hasCredential([['superadmin', 'meeting_hold_quote']])
  const holdQuoteAction = isHoldQuote ? 'unhold_quote' : 'hold_quote'

  const holdQuoteClickable = holdQuoteVisible && (
    isHoldQuote
      ? hasCredential([['superadmin', 'meeting_list_unhold_quote']])
      : hasCredential([['superadmin', 'meeting_list_hold_quote']])
  )

  return {
    canConfirm: hasCredential([['superadmin', 'meeting_confirmation']]),
    canEdit: hasCredential([['superadmin', 'admin', 'meeting_view', 'meeting_modify']]),
    canCopyMeeting: true,
    canSendSms: hasCredential([['superadmin', 'admin', 'meeting_customer_sms_send']]),
    canSendEmail: hasCredential([['superadmin', 'admin', 'meeting_customer_email_send']]),
    canExportKml: hasCredential([['superadmin', 'admin', 'meeting_exportKML']]),
    canExportPdf: hasCredential([['superadmin', 'admin', 'meeting_export_pdf', 'meeting_document_export_pdf']]),
    canCreateContract: hasCredential([['superadmin', 'admin', 'meeting_create_contract']]),
    canCreateDefaultProducts: hasCredential([['superadmin', 'admin', 'meeting_create_default_products']]),
    holdQuote: {
      visible: holdQuoteVisible,
      clickable: holdQuoteClickable,
      action: holdQuoteAction,
    },
    canTransferToSlave: !isMeetingTransferred(meeting)
      && !isHold
      && hasCredential([['superadmin', 'admin', 'customers_meetings_master_meeting_list_transfer']]),
    canSlavesTransfer: !isHold
      && hasCredential([['superadmin', 'admin', 'customers_meetings_master_meeting_list_slaves_transfer']]),
    canNewComment: hasCredential([['superadmin', 'meeting_list_new_comment']]),
    canDeleteOrRecycle: hasCredential([['superadmin', 'admin', 'meeting_delete']]),
    canMigrate: hasCredential([['superadmin']]),
    statusAction: meeting.status === 'ACTIVE' ? 'delete' : 'recycle',
  }
}
