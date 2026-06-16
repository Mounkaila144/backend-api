import { useState, useCallback, useMemo } from 'react'

import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import type { CustomerMeeting } from '../../../types'
import type { MeetingTranslations } from '../../hooks/useMeetingTranslations'
import {
  getMeetingActionPermissions,
  isMeetingActionsAuthorized,
  type MeetingActionName,
} from './meeting-actions-rules'

type LegacyActionType =
  | 'cancel' | 'uncancel'
  | 'hold' | 'unhold'
  | 'lock' | 'unlock'
  | 'cancel_callback'
  | 'copy_ref'

type ActionType = MeetingActionName | LegacyActionType

interface MeetingActionsCellProps {
  meeting: CustomerMeeting
  onAction: (id: number, action: ActionType) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  t: MeetingTranslations
}

export default function MeetingActionsCell({ meeting, onAction, onEdit, onDelete, t }: MeetingActionsCellProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { hasCredential, permissions } = usePermissions()

  const canViewActions = useMemo(() => {
    return isMeetingActionsAuthorized(meeting, hasCredential, permissions?.user_id)
      || hasCredential([['meeting_list_view_actions']])
  }, [hasCredential, meeting, permissions?.user_id])

  const actionPermissions = useMemo(
    () => getMeetingActionPermissions(meeting, hasCredential),
    [hasCredential, meeting]
  )

  const handleOpen = useCallback((e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget), [])
  const handleClose = useCallback(() => setAnchorEl(null), [])

  const fire = useCallback((action: ActionType) => {
    handleClose()

    if (action === 'edit') onEdit(meeting.id)
    else if (action === 'delete') onDelete(meeting.id)
    else if (action === 'copy_ref') navigator.clipboard.writeText(meeting.registration)
    else onAction(meeting.id, action)
  }, [handleClose, meeting.id, meeting.registration, onAction, onEdit, onDelete])

  if (!canViewActions) {
    return <Typography variant='body2' color='text.disabled'>---</Typography>
  }

  const isConfirmed = meeting.is_confirmed === 'YES'
  const isHoldQuote = meeting.is_hold_quote === 'YES'
  const statusAction = actionPermissions.statusAction
  const hasExportGroup = actionPermissions.canExportKml || actionPermissions.canExportPdf
  const hasCreateGroup = actionPermissions.canCreateContract || actionPermissions.canCreateDefaultProducts
  const hasTransferGroup = actionPermissions.canTransferToSlave || actionPermissions.canSlavesTransfer
  const hasCommunicationGroup = actionPermissions.canSendSms || actionPermissions.canSendEmail || actionPermissions.canNewComment
  const hasStatusGroup = actionPermissions.holdQuote.visible || actionPermissions.canDeleteOrRecycle

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
        slotProps={{ paper: { sx: { minWidth: 240, py: 0.5, maxHeight: 520 } } }}
      >
        {actionPermissions.canMigrate && (
          <MenuItem onClick={() => fire('migrate')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-recycle-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionMigrate}</ListItemText>
          </MenuItem>
        )}

        {actionPermissions.canConfirm && (
          <MenuItem
            onClick={() => fire(isConfirmed ? 'unconfirm' : 'confirm')}
            sx={{ ...menuItemSx, color: isConfirmed ? 'success.main' : undefined }}
          >
            <ListItemIcon>
              <i className={isConfirmed ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{isConfirmed ? t.actionUnconfirm : t.actionConfirm}</ListItemText>
          </MenuItem>
        )}

        {(actionPermissions.canMigrate || actionPermissions.canConfirm) && actionPermissions.canEdit && <Divider />}
        {actionPermissions.canEdit && (
          <MenuItem onClick={() => fire('edit')} sx={{ ...menuItemSx, color: 'primary.main' }}>
            <ListItemIcon><i className='ri-edit-box-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionEdit}</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={() => fire('copy_meeting')} sx={{ ...menuItemSx, color: 'secondary.main' }}>
          <ListItemIcon><i className='ri-file-copy-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
          <ListItemText>{t.actionCopyMeeting}</ListItemText>
        </MenuItem>

        {hasCommunicationGroup && <Divider />}
        {actionPermissions.canSendSms && (
          <MenuItem onClick={() => fire('send_sms')} sx={{ ...menuItemSx, color: 'info.main' }}>
            <ListItemIcon><i className='ri-message-2-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionSendSms}</ListItemText>
          </MenuItem>
        )}
        {actionPermissions.canSendEmail && (
          <MenuItem onClick={() => fire('send_email')} sx={{ ...menuItemSx, color: 'info.main' }}>
            <ListItemIcon><i className='ri-mail-send-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionSendEmail}</ListItemText>
          </MenuItem>
        )}
        {actionPermissions.canNewComment && (
          <MenuItem onClick={() => fire('new_comment')} sx={{ ...menuItemSx, color: 'secondary.main' }}>
            <ListItemIcon><i className='ri-chat-new-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionNewComment}</ListItemText>
          </MenuItem>
        )}

        {hasExportGroup && <Divider />}
        {actionPermissions.canExportKml && (
          <MenuItem onClick={() => fire('export_kml')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-map-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionExportKml}</ListItemText>
          </MenuItem>
        )}
        {actionPermissions.canExportPdf && (
          <MenuItem onClick={() => fire('export_pdf')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-file-pdf-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionExportPdf}</ListItemText>
          </MenuItem>
        )}

        {hasCreateGroup && <Divider />}
        {actionPermissions.canCreateContract && (
          <MenuItem onClick={() => fire('create_contract')} sx={{ ...menuItemSx, color: 'primary.main' }}>
            <ListItemIcon><i className='ri-file-add-line' style={{ ...iconSx, color: 'inherit' }} /></ListItemIcon>
            <ListItemText>{t.actionCreateContract}</ListItemText>
          </MenuItem>
        )}
        {actionPermissions.canCreateDefaultProducts && (
          <MenuItem onClick={() => fire('create_default_products')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-shopping-bag-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionCreateDefaultProducts}</ListItemText>
          </MenuItem>
        )}

        {hasStatusGroup && <Divider />}
        {actionPermissions.holdQuote.visible && (
          <MenuItem
            disabled={!actionPermissions.holdQuote.clickable}
            onClick={() => actionPermissions.holdQuote.clickable && fire(actionPermissions.holdQuote.action)}
            sx={{ ...menuItemSx, color: actionPermissions.holdQuote.clickable ? 'warning.main' : undefined }}
          >
            <ListItemIcon>
              <i className={isHoldQuote ? 'ri-lock-line' : 'ri-lock-unlock-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{isHoldQuote ? t.actionUnholdQuote : t.actionHoldQuote}</ListItemText>
          </MenuItem>
        )}

        {hasTransferGroup && <Divider />}
        {actionPermissions.canTransferToSlave && (
          <MenuItem onClick={() => fire('transfer_to_slave')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-upload-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionTransferToSlave}</ListItemText>
          </MenuItem>
        )}
        {actionPermissions.canSlavesTransfer && (
          <MenuItem onClick={() => fire('slaves_transfer')} sx={menuItemSx}>
            <ListItemIcon><i className='ri-upload-cloud-2-line' style={iconSx} /></ListItemIcon>
            <ListItemText>{t.actionSlavesTransfer}</ListItemText>
          </MenuItem>
        )}

        {actionPermissions.canDeleteOrRecycle && (
          <MenuItem
            onClick={() => fire(statusAction)}
            sx={{ ...menuItemSx, color: statusAction === 'delete' ? 'error.main' : 'success.main' }}
          >
            <ListItemIcon>
              <i className={statusAction === 'delete' ? 'ri-delete-bin-7-line' : 'ri-recycle-line'} style={{ ...iconSx, color: 'inherit' }} />
            </ListItemIcon>
            <ListItemText>{statusAction === 'delete' ? t.actionDelete : t.actionRecycle}</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  )
}

export type { ActionType, MeetingActionsCellProps }
