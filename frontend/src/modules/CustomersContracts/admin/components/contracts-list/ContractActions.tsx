import { useState, useCallback, useMemo } from 'react'

import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import type { CustomerContract } from '../../../types'
import type { ContractTranslations } from '../../hooks/useContractTranslations'

type ActionType =
  | 'edit' | 'copy_ref' | 'delete'
  | 'confirm' | 'unconfirm'
  | 'cancel' | 'uncancel'
  | 'blowing' | 'unblowing'
  | 'placement' | 'unplacement'
  | 'send_sms' | 'send_email' | 'new_comment'
  | 'pre_meeting_document' | 'documents_form' | 'generate_cumac'
  | 'billing' | 'export_kml' | 'export_pdf' | 'create_default_products'
  | 'hold' | 'unhold' | 'hold_quote' | 'unhold_quote'
  | 'hold_admin' | 'unhold_admin' | 'copy_contract'

interface ContractActionsCellProps {
  contract: CustomerContract
  onAction: (id: number, action: ActionType) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  t: ContractTranslations
}

export default function ContractActionsCell({ contract, onAction, onEdit, onDelete, t }: ContractActionsCellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { hasCredential, permissions } = usePermissions()

  // ── isAuthorized: mirrors Symfony CustomerContractBase::isAuthorized() ──
  const isAuthorized = useMemo(() => {
    // 1. superadmin/admin/contract_owner always authorized
    if (hasCredential([['superadmin', 'admin', 'contract_owner']])) return true

    // 2. If user does NOT have contract_list_owner credential → authorized
    //    (restriction only applies to users who have this credential)
    if (!hasCredential([['contract_list_owner']])) return true

    // 3. Ownership: current user ID matches one of the contract's user fields
    const userId = permissions?.user_id

    if (userId != null) {
      if (userId === contract.assistant_id) return true
      if (userId === contract.telepro_id) return true
      if (userId === contract.sale_1_id) return true
      if (userId === contract.sale_2_id) return true
    }

    // 4. "Free" role access: user has free_* credential AND contract has no one assigned
    if (hasCredential([['contract_list_owner_free_assistant']]) && !contract.assistant_id) return true
    if (hasCredential([['contract_list_owner_free_telepro']]) && !contract.telepro_id) return true
    if (hasCredential([['contract_list_owner_free_sale1']]) && !contract.sale_1_id) return true
    if (hasCredential([['contract_list_owner_free_sale2']]) && !contract.sale_2_id) return true

    return false
  }, [hasCredential, permissions?.user_id, contract.assistant_id, contract.telepro_id, contract.sale_1_id, contract.sale_2_id])

  // Row-level gate: Symfony line 2266 — $item->isAuthorized() || hasCredential([['contract_list_view_actions']])
  const canViewActions = isAuthorized || hasCredential([['contract_list_view_actions']])

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget)
  }, [])

  const handleClose = useCallback(() => {
    setAnchorEl(null)
  }, [])

  const fire = useCallback((action: ActionType) => {
    handleClose()
    if (action === 'edit') onEdit(contract.id)
    else if (action === 'delete') onDelete(contract.id)
    else if (action === 'copy_ref') navigator.clipboard.writeText(contract.reference)
    else onAction(contract.id, action)
  }, [handleClose, contract.id, contract.reference, onAction, onEdit, onDelete])

  if (!canViewActions) {
    return <Typography variant='body2' color='text.disabled'>---</Typography>
  }

  const isHold = contract.is_hold === 'YES'
  const isConfirmed = contract.is_confirmed === 'YES'
  const isHoldQuote = contract.is_hold_quote === 'YES'
  const isHoldAdmin = contract.is_hold_admin === 'YES'
  const isCancelled = contract.is_cancelled === true
  const isBlowing = contract.is_blowing === true
  const isPlacement = contract.is_placement === true

  // Dimmed style for actions disabled when contract is on hold (Symfony opacity:0.3)
  const dimmedSx = isHold ? { opacity: 0.3, pointerEvents: 'none' as const } : {}

  // Permission checks matching Symfony's hasCredential patterns
  const canEdit = hasCredential([['superadmin', 'admin', 'contract_modify', 'contract_view']])
  const canDelete = hasCredential([['superadmin', 'admin', 'contract_delete']])

  // Toggle actions
  const canConfirm = hasCredential([['superadmin', 'admin', 'contracts_confirmation']])

  const canConfirmAction = canConfirm && (
    isConfirmed
      ? hasCredential([['superadmin', 'admin', 'contract_list_unconfirmed']])
      : hasCredential([['superadmin', 'admin', 'contract_list_confirmed']])
  )

  const canCancel = hasCredential([['superadmin', 'admin', 'contract_list_cancel']])
  const canBlowing = hasCredential([['superadmin', 'admin', 'contract_list_blowing']])
  const canPlacement = hasCredential([['superadmin', 'admin', 'contract_list_placement']])

  // Communication
  const canSendSms = hasCredential([['superadmin', 'admin', 'contract_customer_sms_send']])
  const canSendEmail = hasCredential([['superadmin', 'admin', 'contract_customer_email_send']])
  const canNewComment = hasCredential([['superadmin', 'admin', 'contract_list_new_contract_comment']])

  // Documents
  const canPreMeeting = hasCredential([['superadmin', 'admin', 'app_domoprime_contract_list_premeeting_document']])
  const canDocumentsForm = hasCredential([['superadmin', 'admin', 'contract_documents_form_list']])
  const canGenerateCumac = hasCredential([['superadmin', 'admin', 'domoprime_contract_generate']])

  // Export & Products
  const canBilling = hasCredential([['superadmin', 'admin', 'contract_billings']])
  const canExportKml = hasCredential([['superadmin', 'admin', 'contract_one_exportKml']])
  const canExportPdf = hasCredential([['superadmin', 'admin', 'contract_list_document_export_pdf']])
  const canCreateProducts = hasCredential([['superadmin', 'admin', 'contract_create_default_products']])

  // Hold/Lock toggles
  const canHold = hasCredential([['superadmin', 'contract_hold']]) && (
    isHold
      ? hasCredential([['superadmin', 'admin', 'contract_list_unhold']])
      : hasCredential([['superadmin', 'admin', 'contract_list_hold']])
  )

  const canHoldQuote = hasCredential([['superadmin', 'contract_hold_quote']]) && (
    isHoldQuote
      ? hasCredential([['superadmin', 'contract_list_unhold_quote']])
      : hasCredential([['superadmin', 'contract_list_hold_quote']])
  )

  const canHoldAdmin = hasCredential([['superadmin', 'contract_hold_admin']]) && (
    isHoldAdmin
      ? hasCredential([['superadmin', 'admin', 'contract_list_unhold_admin']])
      : hasCredential([['superadmin', 'admin', 'contract_list_hold_admin']])
  )

  const canCopyContract = hasCredential([['superadmin', 'contract_copy']])

  // Check if any group has visible items (for divider rendering)
  const hasToggleGroup = canConfirmAction || canCancel || canBlowing || canPlacement
  const hasCommunicationGroup = canSendSms || canSendEmail || canNewComment
  const hasDocumentsGroup = canPreMeeting || canDocumentsForm || canGenerateCumac
  const hasExportGroup = canBilling || canExportKml || canExportPdf || canCreateProducts
  const hasHoldGroup = canHold || canHoldQuote || canCopyContract || canHoldAdmin

  const menuItemSx = {
    fontSize: '0.875rem',
    py: 0.75,
    '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 32 },
    '& .MuiListItemText-root': { color: 'inherit' },
  }

  const iconSx = { fontSize: '1.125rem' }

  return (
    <>
      <IconButton size='small' onClick={handleOpen}>
        <i className='ri-more-2-fill' />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { minWidth: 220, py: 0.5, maxHeight: 480 },
          },
        }}
      >
        {/* ── Group 1: State Toggle Actions ── */}
        {canConfirmAction && (
          <MenuItem
            onClick={() => fire(isConfirmed ? 'unconfirm' : 'confirm')}
            sx={{ ...menuItemSx, color: isConfirmed ? 'success.main' : undefined }}
          >
            <ListItemIcon>
              <i
                className={isConfirmed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'}
                style={{ ...iconSx, color: isConfirmed ? 'inherit' : undefined }}
              />
            </ListItemIcon>
            <ListItemText>{isConfirmed ? t.actionUnconfirm : t.actionConfirm}</ListItemText>
          </MenuItem>
        )}
        {canCancel && (
          <MenuItem
            onClick={() => fire(isCancelled ? 'uncancel' : 'cancel')}
            sx={{
              ...menuItemSx,
              ...dimmedSx,
              color: isCancelled ? 'success.main' : 'error.main',
            }}
          >
            <ListItemIcon>
              <i
                className={isCancelled ? 'ri-arrow-go-back-line' : 'ri-forbid-line'}
                style={{ ...iconSx, color: 'inherit' }}
              />
            </ListItemIcon>
            <ListItemText>{isCancelled ? t.actionUncancel : t.actionCancel}</ListItemText>
          </MenuItem>
        )}
        {canBlowing && (
          <MenuItem
            onClick={() => fire(isBlowing ? 'unblowing' : 'blowing')}
            sx={{
              ...menuItemSx,
              ...dimmedSx,
              color: isBlowing ? 'success.main' : 'warning.main',
            }}
          >
            <ListItemIcon>
              <i
                className={isBlowing ? 'ri-arrow-go-back-line' : 'ri-windy-line'}
                style={{ ...iconSx, color: 'inherit' }}
              />
            </ListItemIcon>
            <ListItemText>{isBlowing ? t.actionUnblowing : t.actionBlowing}</ListItemText>
          </MenuItem>
        )}
        {canPlacement && (
          <MenuItem
            onClick={() => fire(isPlacement ? 'unplacement' : 'placement')}
            sx={{
              ...menuItemSx,
              ...dimmedSx,
              color: isPlacement ? 'success.main' : 'info.main',
            }}
          >
            <ListItemIcon>
              <i
                className={isPlacement ? 'ri-arrow-go-back-line' : 'ri-map-pin-add-line'}
                style={{ ...iconSx, color: 'inherit' }}
              />
            </ListItemIcon>
            <ListItemText>{isPlacement ? t.actionUnplacement : t.actionPlacement}</ListItemText>
          </MenuItem>
        )}

        {/* ── Group 2: Edit ── */}
        {hasToggleGroup && canEdit && <Divider />}
        {canEdit && (
          <MenuItem onClick={() => fire('edit')} sx={{ ...menuItemSx, color: 'primary.main' }}>
            <ListItemIcon><i className='ri-edit-box-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionEdit}</ListItemText>
          </MenuItem>
        )}

        {/* ── Group 3: Communication ── */}
        {hasCommunicationGroup && <Divider />}
        {canSendSms && (
          <MenuItem onClick={() => fire('send_sms')} sx={{ ...menuItemSx, color: 'info.main' }}>
            <ListItemIcon><i className='ri-message-2-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionSendSms}</ListItemText>
          </MenuItem>
        )}
        {canSendEmail && (
          <MenuItem onClick={() => fire('send_email')} sx={{ ...menuItemSx, color: 'info.main' }}>
            <ListItemIcon><i className='ri-mail-send-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionSendEmail}</ListItemText>
          </MenuItem>
        )}
        {canNewComment && (
          <MenuItem onClick={() => fire('new_comment')} sx={{ ...menuItemSx, color: 'secondary.main' }}>
            <ListItemIcon><i className='ri-chat-new-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionNewComment}</ListItemText>
          </MenuItem>
        )}

        {/* ── Group 4: Documents ── */}
        {hasDocumentsGroup && <Divider />}
        {canPreMeeting && (
          <MenuItem onClick={() => fire('pre_meeting_document')} sx={{ ...menuItemSx, ...dimmedSx }}>
            <ListItemIcon><i className='ri-file-text-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionPreMeetingDocument}</ListItemText>
          </MenuItem>
        )}
        {canDocumentsForm && (
          <MenuItem onClick={() => fire('documents_form')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-file-list-3-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionDocumentsForm}</ListItemText>
          </MenuItem>
        )}
        {canGenerateCumac && (
          <MenuItem onClick={() => fire('generate_cumac')} sx={{ ...menuItemSx, ...dimmedSx }}>
            <ListItemIcon><i className='ri-flashlight-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionGenerateCumac}</ListItemText>
          </MenuItem>
        )}

        {/* ── Group 5: Export & Products ── */}
        {hasExportGroup && <Divider />}
        {canBilling && (
          <MenuItem onClick={() => fire('billing')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-money-euro-circle-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionBilling}</ListItemText>
          </MenuItem>
        )}
        {canExportKml && (
          <MenuItem onClick={() => fire('export_kml')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-map-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionExportKml}</ListItemText>
          </MenuItem>
        )}
        {canExportPdf && (
          <MenuItem onClick={() => fire('export_pdf')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-file-pdf-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionExportPdf}</ListItemText>
          </MenuItem>
        )}
        {canCreateProducts && (
          <MenuItem onClick={() => fire('create_default_products')} sx={{ ...menuItemSx, ...dimmedSx }}>
            <ListItemIcon><i className='ri-shopping-bag-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionCreateDefaultProducts}</ListItemText>
          </MenuItem>
        )}

        {/* ── Group 6: Hold/Lock + Copy + Delete ── */}
        {(hasHoldGroup || canCopyContract || canDelete) && <Divider />}
        {canHold && (
          <MenuItem
            onClick={() => fire(isHold ? 'unhold' : 'hold')}
            sx={{ ...menuItemSx, color: isHold ? 'success.main' : 'warning.main' }}
          >
            <ListItemIcon>
              <i className={isHold ? 'ri-lock-unlock-line' : 'ri-lock-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{isHold ? t.actionUnhold : t.actionHold}</ListItemText>
          </MenuItem>
        )}
        {canHoldQuote && (
          <MenuItem
            onClick={() => fire(isHoldQuote ? 'unhold_quote' : 'hold_quote')}
            sx={{ ...menuItemSx, color: isHoldQuote ? 'success.main' : 'warning.main' }}
          >
            <ListItemIcon>
              <i className={isHoldQuote ? 'ri-lock-unlock-line' : 'ri-lock-2-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{isHoldQuote ? t.actionUnholdQuote : t.actionHoldQuote}</ListItemText>
          </MenuItem>
        )}
        {canHoldAdmin && (
          <MenuItem
            onClick={() => fire(isHoldAdmin ? 'unhold_admin' : 'hold_admin')}
            sx={{ ...menuItemSx, color: isHoldAdmin ? 'success.main' : 'warning.main' }}
          >
            <ListItemIcon>
              <i className={isHoldAdmin ? 'ri-shield-check-line' : 'ri-shield-keyhole-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{isHoldAdmin ? t.actionUnholdAdmin : t.actionHoldAdmin}</ListItemText>
          </MenuItem>
        )}
        {canCopyContract && (
          <MenuItem onClick={() => fire('copy_contract')} sx={{ ...menuItemSx, color: 'secondary.main' }}>
            <ListItemIcon><i className='ri-file-copy-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionCopyContract}</ListItemText>
          </MenuItem>
        )}
        {canDelete && (
          <MenuItem onClick={() => fire('delete')} sx={{ ...menuItemSx, color: 'error.main' }}>
            <ListItemIcon><i className='ri-delete-bin-7-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionDelete}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export type { ActionType, ContractActionsCellProps }
