// Next Imports
import type { Metadata } from 'next'

// Component Imports
import LoginSuperAdmin from '@views/LoginSuperAdmin'

// Server Action Imports
import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Super Admin Login',
  description: 'Login to your Super Admin account'
}

const LoginSuperAdminPage = async () => {
  // Vars
  const mode = await getServerMode()

  return <LoginSuperAdmin mode={mode} />
}

export default LoginSuperAdminPage
