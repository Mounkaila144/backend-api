'use client'

// React Imports
import { useEffect, useState, useMemo, useCallback } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'

// Third-party Imports
import { createColumnHelper } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// Translation Imports
import { useTranslation } from '@/shared/i18n'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { User , UserCreationOptions } from '../../types/user.types'

// Component Imports
import dynamic from 'next/dynamic'

import CustomAvatar from '@core/components/mui/Avatar'

// Heavy modals are lazy-loaded — only mount when actually opened.
const UserFunctionsModal = dynamic(() => import('./UserFunctionsModal'), { ssr: false })
const UserGroupsModal = dynamic(() => import('./UserGroupsModal'), { ssr: false })
const UserAddModal = dynamic(() => import('./UserAddModal'), { ssr: false })
const UserEditModal = dynamic(() => import('./UserEditModal'), { ssr: false })

// Shared DataTable Components
import { DataTable, StandardMobileCard } from '@/components/shared/DataTable'
import type { DataTableConfig, ColumnConfig } from '@/components/shared/DataTable'

// Context Imports
import { useUsersContext } from './UsersList'

// Service Imports
import { userService } from '../services/userService'


type UserWithAction = User & {
  action?: string
}

type UserStatusType = {
  [key: string]: ThemeColor
}

// Vars
const userStatusObj: UserStatusType = {
  YES: 'success',
  NO: 'secondary'
}

const userLockStatusObj: UserStatusType = {
  YES: 'error',
  NO: 'success'
}

// Available columns configuration
const AVAILABLE_COLUMNS: ColumnConfig[] = [
  { id: 'username', label: 'Username', defaultVisible: true },
  { id: 'firstname', label: 'Firstname', defaultVisible: true },
  { id: 'lastname', label: 'Lastname', defaultVisible: true },
  { id: 'email', label: 'Email', defaultVisible: true },
  { id: 'code_by_email', label: 'Code by Email', defaultVisible: false },
  { id: 'teams', label: 'Teams', defaultVisible: false },
  { id: 'profiles', label: 'Profiles', defaultVisible: false },
  { id: 'groups', label: 'Groups', defaultVisible: true },
  { id: 'permissions', label: 'Permissions', defaultVisible: false },
  { id: 'functions', label: 'Functions', defaultVisible: false },
  { id: 'state', label: 'State', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: false },
  { id: 'managers_teams', label: 'Managers/Teams', defaultVisible: false },
  { id: 'creator', label: 'Creator', defaultVisible: false },
  { id: 'created_at', label: 'Date Creation', defaultVisible: true },
  { id: 'lastlogin', label: 'Last Login', defaultVisible: true },
  { id: 'last_password_gen', label: 'Last Password Gen', defaultVisible: false },
  { id: 'locked', label: 'Locked', defaultVisible: false },
  { id: 'locked_at', label: 'Locked At', defaultVisible: false },
  { id: 'unlocked_by', label: 'Unlocked By', defaultVisible: false },
  { id: 'number_of_try', label: 'Number of Tries', defaultVisible: false },
  { id: 'callcenter', label: 'Callcenter', defaultVisible: false },
  { id: 'company', label: 'Company', defaultVisible: false }
]

const STORAGE_KEY = 'userListTableColumns'

// Column Definitions
const columnHelper = createColumnHelper<UserWithAction>()

const UserListTable = () => {
  // Translation
  const { t } = useTranslation('Users')

  // Context
  const {
    users,
    loading,
    pagination,
    params,
    updateParams,
    setPage,
    setPageSize,
    setSearch,
    refresh,
    deleteUser
  } = useUsersContext()

  // States
  const [functionsModalOpen, setFunctionsModalOpen] = useState(false)
  const [groupsModalOpen, setGroupsModalOpen] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Column filters state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [filterOptions, setFilterOptions] = useState<UserCreationOptions | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {}

    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return {}
      }
    }

    const defaultVisibility: Record<string, boolean> = {}

    AVAILABLE_COLUMNS.forEach(col => {
      defaultVisibility[col.id] = col.defaultVisible !== false
    })

    return defaultVisibility
  })

  // Save column visibility to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  // Handle modals
  const handleOpenFunctionsModal = useCallback((user: User) => {
    setSelectedUser(user)
    setFunctionsModalOpen(true)
  }, [])

  const handleCloseFunctionsModal = useCallback(() => {
    setFunctionsModalOpen(false)
    setSelectedUser(null)
  }, [])

  const handleOpenGroupsModal = useCallback((user: User) => {
    setSelectedUser(user)
    setGroupsModalOpen(true)
  }, [])

  const handleCloseGroupsModal = useCallback(() => {
    setGroupsModalOpen(false)
    setSelectedUser(null)
  }, [])

  const handleOpenAddModal = useCallback(() => {
    setAddModalOpen(true)
  }, [])

  const handleCloseAddModal = useCallback(() => {
    setAddModalOpen(false)
  }, [])

  const handleAddSuccess = useCallback(() => {
    refresh()
  }, [refresh])

  const handleOpenEditModal = useCallback((user: User) => {
    setSelectedUser(user)
    setEditModalOpen(true)
  }, [])

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false)
    setSelectedUser(null)
  }, [])

  const handleEditSuccess = useCallback(() => {
    refresh()
  }, [refresh])

  // Load filter options (teams, groups, callcenters, etc.)
  useEffect(() => {
    const loadFilterOptions = async () => {
      setLoadingOptions(true)

      try {
        const options = await userService.getCreationOptions()

        setFilterOptions(options)
      } catch (error) {
        console.error('Failed to load filter options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    loadFilterOptions()
  }, [])

  // Handle column filters with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      // Build filters for API
      const equal: Record<string, string | number> = {}
      const like: Record<string, string> = {}

      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          // Use 'equal' for exact match fields (dropdowns, selects)
          // Use 'like' for text search fields
          const exactMatchFields = [
            'is_active',
            'is_locked',
            'is_secure_by_code',
            'status',
            'application',
            'callcenter_id',
            'team_id',
            'company_id',
            'sex'
          ]

          if (exactMatchFields.includes(key)) {
            equal[key] = value
          } else {
            like[key] = value
          }
        }
      })

      // Update params with new filters
      updateParams({
        filter: {
          ...params.filter,
          search: params.filter?.search, // Preserve global search
          order: params.filter?.order, // Preserve sorting
          equal: Object.keys(equal).length > 0 ? equal : undefined,
          like: Object.keys(like).length > 0 ? like : undefined
        }
      })
    }, 500)

    return () => clearTimeout(timer)
  }, [columnFilters, params.filter?.search, params.filter?.order, updateParams])

  // Handle column filter change
  const handleColumnFilterChange = useCallback((columnId: string, value: string) => {
    setColumnFilters(prev => {
      if (value === '' || value === null || value === undefined) {
        // Remove filter if empty
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [columnId]: _removed, ...rest } = prev


return rest
      }

      
return {
        ...prev,
        [columnId]: value
      }
    })
  }, [])

  // Clear all column filters
  const handleClearAllFilters = useCallback(() => {
    setColumnFilters({})
  }, [])

  // Toggle filters visibility
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev)
  }, [])

  // Get avatar helper
  const getAvatar = (params: Pick<User, 'sex' | 'full_name'>) => {
    const { sex } = params

    if (sex === 'MR' || sex === 'Mr') {
      return <CustomAvatar src='/images/avatars/1.png' skin='light' size={34} />
    } else {
      return <CustomAvatar src='/images/avatars/4.png' skin='light' size={34} />
    }
  }

  // Column definitions
  const columns = useMemo<ColumnDef<UserWithAction, any>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            {...{
              checked: table.getIsAllRowsSelected(),
              indeterminate: table.getIsSomeRowsSelected(),
              onChange: table.getToggleAllRowsSelectedHandler()
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            {...{
              checked: row.getIsSelected(),
              disabled: !row.getCanSelect(),
              indeterminate: row.getIsSomeSelected(),
              onChange: row.getToggleSelectedHandler()
            }}
          />
        )
      },
      columnHelper.accessor('id', {
        id: 'id',
        header: '#',
        cell: ({ row }) => <Typography>{row.original.id || '-'}</Typography>
      }),
      columnHelper.accessor('username', {
        id: 'username',
        header: t('Username'),
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            {getAvatar({ sex: row.original.sex, full_name: row.original.full_name })}
            <Typography color='text.primary' className='font-medium'>
              {row.original.username}
            </Typography>
          </div>
        )
      }),
      columnHelper.accessor('firstname', {
        id: 'firstname',
        header: t('Firstname'),
        cell: ({ row }) => <Typography>{row.original.firstname || '-'}</Typography>
      }),
      columnHelper.accessor('lastname', {
        id: 'lastname',
        header: t('Lastname'),
        cell: ({ row }) => <Typography>{row.original.lastname || '-'}</Typography>
      }),
      columnHelper.accessor('email', {
        id: 'email',
        header: t('Email'),
        cell: ({ row }) => <Typography>{row.original.email || '-'}</Typography>
      }),
      columnHelper.accessor('is_secure_by_code', {
        id: 'code_by_email',
        header: t('Code by Email'),
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.is_secure_by_code === 'YES' ? t('Yes') : t('No')}
            size='small'
            color={row.original.is_secure_by_code === 'YES' ? 'success' : 'secondary'}
          />
        )
      }),
      columnHelper.accessor('teams_list', {
        id: 'teams',
        header: t('Teams'),
        cell: ({ row }) => <Typography className='max-w-xs truncate'>{row.original.teams_list || '-'}</Typography>
      }),
      columnHelper.accessor('profiles', {
        id: 'profiles',
        header: t('Profiles'),
        cell: ({ row }) => <Typography className='max-w-xs truncate'>{row.original.profiles || '-'}</Typography>
      }),
      columnHelper.accessor('groups_list', {
        id: 'groups',
        header: t('Groups'),
        cell: ({ row }) => {
          const groupsCount = row.original.groups.length > 0
            ? row.original.groups.length
            : row.original.groups_list
              ? row.original.groups_list.split(',').filter(Boolean).length
              : 0

          return groupsCount > 0 ? (
            <Chip
              variant='tonal'
              label={`${groupsCount} ${groupsCount > 1 ? t('groups') : t('group')}`}
              size='small'
              color='success'
              onClick={() => handleOpenGroupsModal(row.original)}
              className='cursor-pointer'
            />
          ) : (
            <Typography>-</Typography>
          )
        }
      }),
      columnHelper.accessor('permissions', {
        id: 'permissions',
        header: t('Permissions'),
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={`${row.original.permissions} ${t('perms')}`}
            size='small'
            color='info'
          />
        )
      }),
      columnHelper.accessor('functions_list', {
        id: 'functions',
        header: t('Functions'),
        cell: ({ row }) => {
          const functionsCount = row.original.functions_list
            ? row.original.functions_list.split(',').filter(Boolean).length
            : 0

          return functionsCount > 0 ? (
            <Chip
              variant='tonal'
              label={`${functionsCount} ${functionsCount > 1 ? t('functions') : t('function')}`}
              size='small'
              color='info'
              onClick={() => handleOpenFunctionsModal(row.original)}
              className='cursor-pointer'
            />
          ) : (
            <Typography>-</Typography>
          )
        }
      }),
      columnHelper.accessor('is_active', {
        id: 'state',
        header: t('State'),
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.is_active === 'YES' ? t('Active') : t('Inactive')}
            size='small'
            color={userStatusObj[row.original.is_active]}
          />
        )
      }),
      columnHelper.accessor('status', {
        id: 'status',
        header: t('Status'),
        cell: ({ row }) => (
          <Typography className='capitalize' color='text.primary'>
            {row.original.status}
          </Typography>
        )
      }),
      columnHelper.accessor('team_id', {
        id: 'managers_teams',
        header: t('Managers/Teams'),
        cell: ({ row }) => <Typography>{row.original.team_id || '-'}</Typography>
      }),
      columnHelper.accessor('creator_id', {
        id: 'creator',
        header: t('Creator'),
        cell: ({ row }) => <Typography>{row.original.creator_id || '-'}</Typography>
      }),
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: t('Date Creation'),
        cell: ({ row }) => (
          <Typography>
            {row.original.created_at ? new Date(row.original.created_at).toLocaleString() : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('lastlogin', {
        id: 'lastlogin',
        header: t('Last Login'),
        cell: ({ row }) => (
          <Typography>
            {row.original.lastlogin ? new Date(row.original.lastlogin).toLocaleString() : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('last_password_gen', {
        id: 'last_password_gen',
        header: t('Last Password Gen'),
        cell: ({ row }) => (
          <Typography>
            {row.original.last_password_gen ? new Date(row.original.last_password_gen).toLocaleString() : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('is_locked', {
        id: 'locked',
        header: t('Locked'),
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={row.original.is_locked === 'YES' ? t('Locked') : t('Unlocked')}
            size='small'
            color={userLockStatusObj[row.original.is_locked]}
          />
        )
      }),
      columnHelper.accessor('locked_at', {
        id: 'locked_at',
        header: t('Locked At'),
        cell: ({ row }) => (
          <Typography>
            {row.original.locked_at ? new Date(row.original.locked_at).toLocaleString() : '-'}
          </Typography>
        )
      }),
      columnHelper.accessor('unlocked_by', {
        id: 'unlocked_by',
        header: t('Unlocked By'),
        cell: ({ row }) => <Typography>{row.original.unlocked_by || '-'}</Typography>
      }),
      columnHelper.accessor('number_of_try', {
        id: 'number_of_try',
        header: t('Number of Tries'),
        cell: ({ row }) => <Typography>{row.original.number_of_try}</Typography>
      }),
      columnHelper.accessor('callcenter_id', {
        id: 'callcenter',
        header: t('Callcenter'),
        cell: ({ row }) => <Typography>{row.original.callcenter_id || '-'}</Typography>
      }),
      columnHelper.accessor('company_id', {
        id: 'company',
        header: t('Company'),
        cell: ({ row }) => <Typography>{row.original.company_id || '-'}</Typography>
      }),
      columnHelper.accessor('action', {
        header: t('Actions'),
        cell: ({ row }) => (
          <div className='flex items-center gap-0.5'>
            <IconButton
              size='small'
              onClick={async () => {
                if (confirm(t('Are you sure you want to delete this user?'))) {
                  try {
                    await deleteUser(row.original.id)
                  } catch (error) {
                    console.error('Failed to delete user:', error)
                  }
                }
              }}
            >
              <i className='ri-delete-bin-7-line text-textSecondary' />
            </IconButton>
            <IconButton size='small'>
              <i className='ri-eye-line text-textSecondary' />
            </IconButton>
            <IconButton size='small' onClick={() => handleOpenEditModal(row.original)}>
              <i className='ri-edit-box-line text-textSecondary' />
            </IconButton>
          </div>
        ),
        enableSorting: false
      })
    ],
    [t, deleteUser, handleOpenFunctionsModal, handleOpenGroupsModal, handleOpenEditModal]
  )

  // Helper to create column filter component
  const createColumnFilter = useCallback(
    (columnId: string) => {
      const value = columnFilters[columnId] || ''

      // Text search filters
      const textSearchColumns = [
        'username',
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobile',
        'profiles',
        'groups_list',
        'teams_list',
        'functions_list'
      ]

      if (textSearchColumns.includes(columnId)) {
        return (
          <TextField
            size='small'
            value={value}
            onChange={e => handleColumnFilterChange(columnId, e.target.value)}
            placeholder={t('Search')}
            fullWidth
            variant='outlined'
            sx={{ minWidth: 120 }}
          />
        )
      }

      // Status filters (is_active)
      if (columnId === 'is_active' || columnId === 'state') {
        return (
          <FormControl size='small' fullWidth sx={{ minWidth: 120 }}>
            <Select
              value={value}
              onChange={e => handleColumnFilterChange('is_active', e.target.value)}
              displayEmpty
              disabled={loading}
            >
              <MenuItem value=''>{t('All')}</MenuItem>
              <MenuItem value='YES'>{t('Active')}</MenuItem>
              <MenuItem value='NO'>{t('Inactive')}</MenuItem>
            </Select>
          </FormControl>
        )
      }

      // Lock status filters (is_locked)
      if (columnId === 'is_locked' || columnId === 'locked') {
        return (
          <FormControl size='small' fullWidth sx={{ minWidth: 120 }}>
            <Select
              value={value}
              onChange={e => handleColumnFilterChange('is_locked', e.target.value)}
              displayEmpty
              disabled={loading}
            >
              <MenuItem value=''>{t('All')}</MenuItem>
              <MenuItem value='YES'>{t('Locked')}</MenuItem>
              <MenuItem value='NO'>{t('Unlocked')}</MenuItem>
            </Select>
          </FormControl>
        )
      }

      // Code by email filter (is_secure_by_code)
      if (columnId === 'is_secure_by_code' || columnId === 'code_by_email') {
        return (
          <FormControl size='small' fullWidth sx={{ minWidth: 120 }}>
            <Select
              value={value}
              onChange={e => handleColumnFilterChange('is_secure_by_code', e.target.value)}
              displayEmpty
              disabled={loading}
            >
              <MenuItem value=''>{t('All')}</MenuItem>
              <MenuItem value='YES'>{t('Yes')}</MenuItem>
              <MenuItem value='NO'>{t('No')}</MenuItem>
            </Select>
          </FormControl>
        )
      }

      // Callcenter filter
      if ((columnId === 'callcenter_id' || columnId === 'callcenter') && filterOptions) {
        return (
          <FormControl size='small' fullWidth sx={{ minWidth: 150 }}>
            <Select
              value={value}
              onChange={e => handleColumnFilterChange('callcenter_id', e.target.value)}
              displayEmpty
              disabled={loading || loadingOptions}
            >
              <MenuItem value=''>{t('All')}</MenuItem>
              {filterOptions.callcenters.map(cc => (
                <MenuItem key={cc.id} value={cc.id}>
                  {cc.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      }

      // Team filter
      if ((columnId === 'team_id' || columnId === 'managers_teams') && filterOptions) {
        return (
          <FormControl size='small' fullWidth sx={{ minWidth: 150 }}>
            <Select
              value={value}
              onChange={e => handleColumnFilterChange('team_id', e.target.value)}
              displayEmpty
              disabled={loading || loadingOptions}
            >
              <MenuItem value=''>{t('All')}</MenuItem>
              {filterOptions.teams.map(team => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      }

      // Default: no filter for this column
      return null
    },
    [columnFilters, handleColumnFilterChange, loading, loadingOptions, filterOptions, t]
  )

  // DataTable configuration
  const tableConfig: DataTableConfig<User> = {
    columns,
    data: users as User[],
    loading,
    pagination,
    availableColumns: AVAILABLE_COLUMNS,
    columnVisibility,
    onColumnVisibilityChange: setColumnVisibility,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    onSearch: setSearch,
    onRefresh: refresh,
    searchPlaceholder: t('Search User'),
    emptyMessage: t('No data available'),
    rowsPerPageOptions: [10, 25, 50, 100],

    // Column Filters
    showColumnFilters: showFilters,
    onToggleColumnFilters: handleToggleFilters,
    columnFilters,
    onClearAllFilters: handleClearAllFilters,
    createColumnFilter,

    // Actions
    actions: [
      {
        label: t('Add'),
        icon: 'ri-user-add-line',
        color: 'primary',
        onClick: handleOpenAddModal,
        disabled: loading
      }
    ],

    // Mobile card configuration
    mobileCard: {
      renderCard: user => {
        const groupsCount = user.groups.length > 0
          ? user.groups.length
          : user.groups_list
            ? user.groups_list.split(',').filter(Boolean).length
            : 0

        const functionsCount = user.functions_list
          ? user.functions_list.split(',').filter(Boolean).length
          : 0

        return (
          <StandardMobileCard
            avatar={
              user.sex === 'MR' || user.sex === 'Mr' ? (
                <CustomAvatar src='/images/avatars/1.png' skin='light' size={50} />
              ) : (
                <CustomAvatar src='/images/avatars/4.png' skin='light' size={50} />
              )
            }
            title={user.full_name || user.username}
            subtitle={`@${user.username}`}
            status={{
              label: user.is_active === 'YES' ? t('Active') : t('Inactive'),
              color: user.is_active === 'YES' ? 'success' : 'secondary'
            }}
            fields={[
              {
                icon: 'ri-mail-line',
                value: user.email || '-'
              },
              user.firstname || user.lastname
                ? {
                    icon: 'ri-user-line',
                    value: `${user.firstname} ${user.lastname}`
                  }
                : { icon: '', value: '', hidden: true },
              groupsCount > 0
                ? {
                    icon: 'ri-group-line',
                    value: (
                      <Chip
                        variant='tonal'
                        label={`${groupsCount} ${groupsCount > 1 ? t('groups') : t('group')}`}
                        size='small'
                        color='primary'
                        onClick={() => handleOpenGroupsModal(user)}
                        className='cursor-pointer'
                      />
                    )
                  }
                : { icon: '', value: '', hidden: true },
              functionsCount > 0
                ? {
                    icon: 'ri-function-line',
                    value: (
                      <Chip
                        variant='tonal'
                        label={`${functionsCount} ${functionsCount > 1 ? t('functions') : t('function')}`}
                        size='small'
                        color='info'
                        onClick={() => handleOpenFunctionsModal(user)}
                        className='cursor-pointer'
                      />
                    )
                  }
                : { icon: '', value: '', hidden: true },
              {
                icon: 'ri-calendar-line',
                label: t('Created'),
                value: user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'
              },
              user.lastlogin
                ? {
                    icon: 'ri-login-circle-line',
                    label: t('Last Login'),
                    value: new Date(user.lastlogin).toLocaleDateString()
                  }
                : { icon: '', value: '', hidden: true },
              user.is_locked === 'YES'
                ? {
                    icon: 'ri-lock-line',
                    value: <Chip variant='tonal' label={t('Locked')} size='small' color='error' />
                  }
                : { icon: '', value: '', hidden: true }
            ]}
            actions={[
              {
                icon: 'ri-delete-bin-7-line',
                color: 'error',
                onClick: async () => {
                  if (confirm(t('Are you sure you want to delete this user?'))) {
                    try {
                      await deleteUser(user.id)
                    } catch (error) {
                      console.error('Failed to delete user:', error)
                    }
                  }
                }
              },
              {
                icon: 'ri-eye-line',
                color: 'default',
                onClick: () => { /* TODO: implement view user */ }
              },
              {
                icon: 'ri-edit-box-line',
                color: 'primary',
                onClick: () => handleOpenEditModal(user)
              }
            ]}
            item={user}
          />
        )
      }
    }
  }

  return (
    <>
      <DataTable {...tableConfig} />

      {functionsModalOpen && (
        <UserFunctionsModal open onClose={handleCloseFunctionsModal} user={selectedUser} />
      )}

      {groupsModalOpen && (
        <UserGroupsModal open onClose={handleCloseGroupsModal} user={selectedUser} />
      )}

      {addModalOpen && (
        <UserAddModal open onClose={handleCloseAddModal} onSuccess={handleAddSuccess} />
      )}

      {editModalOpen && (
        <UserEditModal open onClose={handleCloseEditModal} onSuccess={handleEditSuccess} user={selectedUser} />
      )}
    </>
  )
}

export default UserListTable
