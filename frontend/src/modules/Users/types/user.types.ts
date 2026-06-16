/**
 * User group information
 */
export interface UserGroup {
  id: number;
  name: string;
  permissions: string[] | null;
}

/**
 * User entity from the API
 */
export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  full_name: string;
  email: string;
  sex: string;
  phone: string;
  mobile: string;
  birthday: string | null;
  picture: string;
  application: string;
  is_active: 'YES' | 'NO';
  is_guess: 'YES' | 'NO';
  is_locked: 'YES' | 'NO';
  locked_at: string | null;
  is_secure_by_code: 'YES' | 'NO';
  status: string;
  number_of_try: number;
  last_password_gen: string;
  lastlogin: string | null;
  created_at: string;
  updated_at: string;
  groups_list: string;
  teams_list: string;
  functions_list: string;
  profiles_list: string;
  groups: UserGroup[];
  company_id: number | null;
  callcenter_id: number;
  team_id: number | null;
  creator_id: number | null;
  unlocked_by: number | null;
  permissions: string[];
  roles: string[];
  is_superadmin: boolean;
}

/**
 * Filters for user list
 */
export interface UserFilters {
  search?: string;
  status?: string;
  is_active?: 'YES' | 'NO';
  is_locked?: 'YES' | 'NO';
  team_id?: number;
  application?: string;
}

/**
 * Pagination meta information
 */
export interface PaginationMeta {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Statistics for users
 */
export interface UserStatistics {
  total_users: number;
  active_users: number;
  inactive_users: number;
  locked_users: number;
}

/**
 * Paginated response from API
 */
export interface PaginatedUsersResponse {
  data: User[];
  meta: PaginationMeta;
  statistics: UserStatistics;
}

/**
 * Query parameters for user list
 */
export interface UserQueryParams {
  page?: number;
  nbitemsbypage?: number;
  filter?: {
    search?: string; // Global search across multiple fields
    equal?: Record<string, string | number>; // Exact match filters
    like?: Record<string, string>; // Partial match filters (for column-specific search)
    order?: Record<string, 'asc' | 'desc'>; // Sorting
    range?: Record<string, { from: string; to: string }>; // Date/Number ranges
  };
}

/**
 * Permission in a permission group
 */
export interface Permission {
  id: number;
  name: string;
}

/**
 * Permission group
 */
export interface PermissionGroup {
  id: number;
  name: string;
  permissions: Permission[];
}

/**
 * User group with permission IDs
 */
export interface GroupOption {
  id: number;
  name: string;
  permissions_count: number;
  permission_ids: number[];
}

/**
 * Function option
 */
export interface FunctionOption {
  id: number;
  name: string;
}

/**
 * Profile option
 */
export interface ProfileOption {
  id: number;
  name: string;
}

/**
 * Team option
 */
export interface TeamOption {
  id: number;
  name: string;
  manager_id?: number;
}

/**
 * Attribution option
 */
export interface AttributionOption {
  id: number;
  name: string;
}

/**
 * Call center option
 */
export interface CallCenterOption {
  id: number;
  name: string;
}

/**
 * User creation options response
 */
export interface UserCreationOptions {
  groups: GroupOption[];
  permission_groups: PermissionGroup[];
  functions: FunctionOption[];
  profiles: ProfileOption[];
  teams: TeamOption[];
  attributions: AttributionOption[];
  callcenters: CallCenterOption[];
}

/**
 * User creation payload
 */
export interface CreateUserPayload {
  username: string;
  password: string;
  email: string;
  firstname?: string;
  lastname?: string;
  sex?: 'Mr' | 'Ms' | 'Mrs';
  phone?: string;
  mobile?: string;
  birthday?: string;
  is_active?: 'YES' | 'NO';
  application: 'admin' | 'frontend';
  callcenter_id?: number;
  team_id?: number;
  company_id?: number;
  group_ids?: number[];
  function_ids?: number[];
  profile_ids?: number[];
  team_ids?: number[];
  attribution_ids?: number[];
  permission_ids?: number[];
}

/**
 * User update payload
 */
export interface UpdateUserPayload {
  username?: string;
  password?: string; // Optional - only if changing password
  email?: string;
  firstname?: string;
  lastname?: string;
  sex?: 'Mr' | 'Ms' | 'Mrs';
  phone?: string;
  mobile?: string;
  birthday?: string;
  is_active?: 'YES' | 'NO';
  is_locked?: 'YES' | 'NO';
  application?: 'admin' | 'frontend';
  callcenter_id?: number;
  team_id?: number;
  company_id?: number;
  group_ids?: number[];
  function_ids?: number[];
  profile_ids?: number[];
  team_ids?: number[];
  attribution_ids?: number[];
  permission_ids?: number[];
}
