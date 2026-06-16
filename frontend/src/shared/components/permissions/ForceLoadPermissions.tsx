'use client'

/**
 * Force Load Permissions Component
 *
 * Manually loads permissions from stored user data
 * Useful when user was logged in before permissions system was installed
 */

import { useState } from 'react'

import { usePermissionsOptional } from '@/shared/contexts/PermissionsContext'
import { useAuth } from '@/modules/UsersGuard'
import { extractPermissionsFromLogin } from '@/shared/lib/permissions/extractPermissions'

export function ForceLoadPermissions() {
  const permissionsContext = usePermissionsOptional()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleForceLoad = () => {
    setLoading(true)
    setResult(null)

    try {
      // SPA mode: there is no token in localStorage; auth lives in an httpOnly cookie.
      const storedUser = localStorage.getItem('user')
      const storedTenant = localStorage.getItem('tenant')

      if (!storedUser) {
        setResult({
          success: false,
          message: 'User data not found in localStorage. Please log out and log in again.',
        })
        setLoading(false)

return
      }

      const userData = JSON.parse(storedUser)

      // Check if user has groups and permissions
      if (!userData.groups || !Array.isArray(userData.groups)) {
        setResult({
          success: false,
          message:
            'User data does not contain groups. The backend may not be sending groups in the login response.',
        })
        setLoading(false)

return
      }

      // Reconstruct login response format (token field is no longer present in SPA mode)
      const reconstructedResponse = {
        success: true,
        data: {
          user: userData,
          tenant: storedTenant ? JSON.parse(storedTenant) : null,
        },
      }

      // Extract permissions
      const permissions = extractPermissionsFromLogin(reconstructedResponse)

      // Save permissions
      if (permissionsContext) {
        permissionsContext.setPermissions(permissions)

        setResult({
          success: true,
          message: `✅ Permissions loaded successfully! Found ${permissions.permissions.length} permissions and ${permissions.groups.length} groups.`,
        })
      } else {
        setResult({
          success: false,
          message: 'PermissionsContext not available.',
        })
      }
    } catch (error: any) {
      console.error('Error loading permissions:', error)
      setResult({
        success: false,
        message: `Error: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    window.location.href = '/admin/login'
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-500 p-6 rounded-lg shadow-lg max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-blue-800">🔧 Force Load Permissions</h2>

      <div className="bg-white p-4 rounded-lg mb-4 border border-blue-200">
        <p className="text-gray-700 mb-4">
          You are logged in but permissions were not extracted. This can happen if you logged in before
          the permissions system was installed.
        </p>
        <p className="text-gray-700 mb-4 font-semibold">Choose one of the following options:</p>
      </div>

      {/* Option 1: Force Load */}
      <div className="bg-white p-4 rounded-lg mb-4 border border-blue-200">
        <h3 className="font-semibold text-lg mb-2 text-blue-800">
          Option 1: Try to load permissions from current session
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          This will attempt to extract permissions from your current login data stored in localStorage.
        </p>
        <button
          onClick={handleForceLoad}
          disabled={loading}
          className={`w-full px-4 py-2 rounded font-semibold text-white ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? '⏳ Loading...' : '🔄 Force Load Permissions'}
        </button>
      </div>

      {/* Option 2: Fresh Login */}
      <div className="bg-white p-4 rounded-lg mb-4 border border-blue-200">
        <h3 className="font-semibold text-lg mb-2 text-blue-800">
          Option 2: Log out and log in again (Recommended)
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          This ensures permissions are loaded correctly from a fresh login response.
        </p>
        <button
          onClick={handleLogout}
          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold"
        >
          🚪 Log Out & Go to Login
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`p-4 rounded-lg ${
            result.success
              ? 'bg-green-100 border border-green-400 text-green-800'
              : 'bg-red-100 border border-red-400 text-red-800'
          }`}
        >
          <p className="font-semibold">{result.message}</p>
          {result.success && (
            <p className="text-sm mt-2">
              ✨ Refresh the page to see the changes take effect, or{' '}
              <button
                onClick={() => window.location.reload()}
                className="underline font-semibold hover:text-green-900"
              >
                click here to reload
              </button>
              .
            </p>
          )}
        </div>
      )}

      {/* Debug info */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-semibold">
          Show debug info
        </summary>
        <div className="mt-3 bg-gray-100 p-3 rounded text-xs">
          <p>
            <strong>User ID:</strong> {user?.id}
          </p>
          <p>
            <strong>Username:</strong> {user?.username}
          </p>
          <p>
            <strong>Groups in user object:</strong> {user?.groups ? 'Yes' : 'No'}
          </p>
          {user?.groups && (
            <p>
              <strong>Number of groups:</strong> {Array.isArray(user.groups) ? user.groups.length : 'N/A'}
            </p>
          )}
          <p>
            <strong>Permissions in user object:</strong> {user?.permissions ? 'Yes' : 'No'}
          </p>
          {user?.permissions && (
            <p>
              <strong>Number of permissions:</strong>{' '}
              {Array.isArray(user.permissions) ? user.permissions.length : 'N/A'}
            </p>
          )}
        </div>
      </details>
    </div>
  )
}
