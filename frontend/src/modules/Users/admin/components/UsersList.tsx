'use client'

// React Imports
import { createContext, useContext } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import UserListTable from './UserListTable'

// Hook Imports
import { useUsers } from '../hooks/useUsers'

// Type Imports
import type {
  User,
  PaginationMeta,
  UserStatistics,
  UserQueryParams
} from '../../types/user.types'

// Create context for sharing user data between components
interface UsersContextType {
  users: User[]
  loading: boolean
  error: Error | null
  pagination: PaginationMeta
  statistics: UserStatistics
  params: UserQueryParams
  updateParams: (newParams: Partial<UserQueryParams>) => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  setSearch: (search: string) => void
  refresh: () => void
  deleteUser: (userId: number) => Promise<void>
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

export const useUsersContext = () => {
  const context = useContext(UsersContext)

  if (!context) {
    throw new Error('useUsersContext must be used within UsersList')
  }

  return context
}

/**
 * UsersList Component
 * Main component for displaying users with statistics cards and table
 */
export const UsersList = () => {
  const usersData = useUsers()

  return (
    <UsersContext.Provider value={usersData}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <UserListTable />
        </Grid>
      </Grid>
    </UsersContext.Provider>
  )
}
