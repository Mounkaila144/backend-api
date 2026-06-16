'use client'

// React Imports
// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'

// Translation Imports
import { useTranslation } from '@/shared/i18n'

// Type Imports
import type { User } from '../../types/user.types'

interface UserGroupsModalProps {
  open: boolean
  onClose: () => void
  user: User | null
}

const UserGroupsModal = ({ open, onClose, user }: UserGroupsModalProps) => {
  const { t } = useTranslation('Users')

  if (!user) return null

  // Use groups array if available, otherwise parse groups_list
  const groups = user.groups && user.groups.length > 0
    ? user.groups
    : user.groups_list
      ? user.groups_list.split(',').map((name, index) => ({
          id: index,
          name: name.trim(),
          permissions: null
        })).filter(g => g.name)
      : []

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <div>
          <Typography variant='h5'>{t('User Groups')}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {user.username} - {user.full_name}
          </Typography>
        </div>
        <IconButton onClick={onClose} size='small'>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {groups.length === 0 ? (
          <Typography color='text.secondary' className='text-center py-8'>
            {t('No groups assigned to this user')}
          </Typography>
        ) : (
          <div className='space-y-4'>
            <Typography variant='body2' color='text.secondary'>
              {t('Total')}: {groups.length} {groups.length > 1 ? t('groups') : t('group')}
            </Typography>
            <div className='grid grid-cols-1 gap-2'>
              {groups.map((group, index) => (
                <div
                  key={group.id}
                  className='flex items-center justify-between gap-3 p-3 rounded border border-gray-200 hover:bg-gray-50'
                >
                  <div className='flex items-center gap-3 flex-1'>
                    <Chip
                      label={index + 1}
                      size='small'
                      color='primary'
                      variant='outlined'
                      className='min-w-[40px]'
                    />
                    <Typography className='font-medium'>{group.name}</Typography>
                  </div>
                  {group.permissions && group.permissions.length > 0 && (
                    <Chip
                      label={`${group.permissions.length} ${t('permissions')}`}
                      size='small'
                      color='info'
                      variant='tonal'
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <Divider />
      <DialogActions>
        <Button onClick={onClose} variant='outlined' color='secondary'>
          {t('Close')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default UserGroupsModal
