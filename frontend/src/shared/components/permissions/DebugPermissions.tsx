'use client'

/**
 * Debug Permissions Component
 *
 * Temporary component to debug permission issues
 * Shows all loaded permissions and tests specific permission checks
 */

import { useState } from 'react'

import { usePermissions } from '@/shared/contexts/PermissionsContext'

export function DebugPermissions() {
  const { permissions, hasCredential, hasGroup } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')

  if (!permissions) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded">
        ⚠️ No permissions loaded
      </div>
    )
  }

  const filteredPermissions = searchTerm
    ? permissions.permissions.filter((p) =>
        p.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : permissions.permissions

  return (
    <div className="bg-white border border-gray-300 p-6 rounded-lg shadow-lg max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">🔍 Debug Permissions</h2>

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-2">Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Username:</p>
            <p className="font-semibold">{permissions.username}</p>
          </div>
          <div>
            <p className="text-gray-600">User ID:</p>
            <p className="font-semibold">{permissions.user_id}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Permissions:</p>
            <p className="font-semibold text-green-600">{permissions.permissions.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Groups:</p>
            <p className="font-semibold text-blue-600">{permissions.groups.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Is Superadmin:</p>
            <p className="font-semibold">{permissions.is_superadmin ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <p className="text-gray-600">Is Admin:</p>
            <p className="font-semibold">{permissions.is_admin ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>

      {/* Test specific permission */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-3">Test: settings_user_list</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm">hasCredential(&apos;settings_user_list&apos;):</span>
            <span className={`font-bold ${hasCredential('settings_user_list') ? 'text-green-600' : 'text-red-600'}`}>
              {hasCredential('settings_user_list') ? '✅ TRUE' : '❌ FALSE'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm">
              hasCredential([[&apos;admin&apos;, &apos;superadmin&apos;, &apos;settings_user_list&apos;]]):
            </span>
            <span
              className={`font-bold ${
                hasCredential([['admin', 'superadmin', 'settings_user_list']]) ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {hasCredential([['admin', 'superadmin', 'settings_user_list']]) ? '✅ TRUE' : '❌ FALSE'}
            </span>
          </div>
          <div className="mt-3 p-3 bg-white rounded border">
            <p className="text-sm text-gray-700">
              Permission found in list:{' '}
              <span className={`font-bold ${permissions.permissions.includes('settings_user_list') ? 'text-green-600' : 'text-red-600'}`}>
                {permissions.permissions.includes('settings_user_list') ? '✅ YES' : '❌ NO'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Groups */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-3">Groups ({permissions.groups.length})</h3>
        <div className="space-y-1">
          {permissions.groups.map((group, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-purple-600">•</span>
              <span className="font-mono text-sm">{group}</span>
              <span className={`text-xs ${hasGroup(group) ? 'text-green-600' : 'text-red-600'}`}>
                {hasGroup(group) ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Search permissions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Permissions:
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Type to search (e.g., user, settings, contract)..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredPermissions.length} permission{filteredPermissions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Permissions list */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-3">
          All Permissions ({filteredPermissions.length})
        </h3>
        <div className="max-h-96 overflow-auto bg-white rounded border border-gray-200">
          {filteredPermissions.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredPermissions.map((perm, index) => (
                <li
                  key={index}
                  className="px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm text-gray-700">{perm}</span>
                    <span className="text-xs text-gray-400">#{index + 1}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? 'No permissions found matching your search' : 'No permissions loaded'}
            </p>
          )}
        </div>
      </div>

      {/* Raw JSON */}
      <details className="mt-6">
        <summary className="cursor-pointer font-semibold text-gray-700 hover:text-gray-900">
          Show Raw JSON
        </summary>
        <pre className="mt-3 bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-xs">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </details>
    </div>
  )
}
