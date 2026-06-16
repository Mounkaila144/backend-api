'use client'

/**
 * Debug Permissions State Component
 *
 * Comprehensive debug tool to diagnose permission loading issues
 */

import { useState, useEffect } from 'react'

import { usePermissionsOptional } from '@/shared/contexts/PermissionsContext'
import { useAuth } from '@/modules/UsersGuard'
import { loadPermissionsFromStorage } from '@/shared/lib/permissions/extractPermissions'

export function DebugPermissionsState() {
  const permissionsContext = usePermissionsOptional()
  const { user, isAuthenticated, token } = useAuth()
  const [localStorageData, setLocalStorageData] = useState<any>(null)
  const [allLocalStorage, setAllLocalStorage] = useState<Record<string, any>>({})

  useEffect(() => {
    // Load from localStorage
    const stored = loadPermissionsFromStorage()

    setLocalStorageData(stored)

    // Get all localStorage keys
    const allKeys: Record<string, any> = {}

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key) {
        try {
          allKeys[key] = JSON.parse(localStorage.getItem(key) || 'null')
        } catch {
          allKeys[key] = localStorage.getItem(key)
        }
      }
    }

    setAllLocalStorage(allKeys)
  }, [])

  return (
    <div className="bg-red-50 border-2 border-red-500 p-6 rounded-lg shadow-lg max-w-6xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-red-800">🚨 Debug: Permissions State</h2>

      {/* Status Overview */}
      <div className="bg-white p-4 rounded-lg mb-6 border border-red-200">
        <h3 className="font-semibold text-lg mb-3 text-red-800">Status Overview</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600 text-sm">PermissionsContext Available:</p>
            <p className={`font-bold ${permissionsContext ? 'text-green-600' : 'text-red-600'}`}>
              {permissionsContext ? '✅ YES' : '❌ NO'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Permissions Loaded:</p>
            <p className={`font-bold ${permissionsContext?.permissions ? 'text-green-600' : 'text-red-600'}`}>
              {permissionsContext?.permissions ? '✅ YES' : '❌ NO'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">User Authenticated:</p>
            <p className={`font-bold ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated ? '✅ YES' : '❌ NO'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Token Present:</p>
            <p className={`font-bold ${token ? 'text-green-600' : 'text-red-600'}`}>
              {token ? '✅ YES' : '❌ NO'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">User Object:</p>
            <p className={`font-bold ${user ? 'text-green-600' : 'text-red-600'}`}>
              {user ? `✅ YES (ID: ${user.id})` : '❌ NO'}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">localStorage Permissions:</p>
            <p className={`font-bold ${localStorageData ? 'text-green-600' : 'text-red-600'}`}>
              {localStorageData ? '✅ YES' : '❌ NO'}
            </p>
          </div>
        </div>
      </div>

      {/* Problem Diagnosis */}
      <div className="bg-yellow-50 p-4 rounded-lg mb-6 border border-yellow-300">
        <h3 className="font-semibold text-lg mb-3 text-yellow-800">🔍 Problem Diagnosis</h3>
        {!permissionsContext && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-3">
            ❌ <strong>PermissionsContext is not available!</strong>
            <p className="text-sm mt-1">
              Make sure your component is inside the &lt;PermissionsProvider&gt;.
            </p>
          </div>
        )}
        {permissionsContext && !permissionsContext.permissions && !isAuthenticated && (
          <div className="bg-orange-100 text-orange-800 p-3 rounded mb-3">
            ⚠️ <strong>User is not authenticated</strong>
            <p className="text-sm mt-1">Please log in to load permissions.</p>
          </div>
        )}
        {permissionsContext && !permissionsContext.permissions && isAuthenticated && (
          <div className="bg-red-100 text-red-800 p-3 rounded mb-3">
            ❌ <strong>User is authenticated but permissions are not loaded!</strong>
            <p className="text-sm mt-1">
              This means the login process did not extract permissions. Check:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1">
              <li>Browser console for errors during login</li>
              <li>That useAuth hook is calling extractPermissionsFromLogin()</li>
              <li>That the login response contains groups and permissions data</li>
            </ul>
          </div>
        )}
        {permissionsContext && permissionsContext.permissions && (
          <div className="bg-green-100 text-green-800 p-3 rounded">
            ✅ <strong>Permissions are loaded correctly!</strong>
            <p className="text-sm mt-1">
              Total: {permissionsContext.permissions.permissions.length} permissions,{' '}
              {permissionsContext.permissions.groups.length} groups
            </p>
          </div>
        )}
      </div>

      {/* User Object */}
      {user && (
        <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-3">👤 User Object (from useAuth)</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-gray-600 text-sm">ID:</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Username:</p>
              <p className="font-mono text-sm">{user.username}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Email:</p>
              <p className="font-mono text-sm">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Application:</p>
              <p className="font-mono text-sm">{user.application}</p>
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              Show full user object
            </summary>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(user, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Permissions Context Data */}
      {permissionsContext?.permissions && (
        <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-3">🔐 Permissions Context Data</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-gray-600 text-sm">Username:</p>
              <p className="font-mono text-sm">{permissionsContext.permissions.username}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">User ID:</p>
              <p className="font-mono text-sm">{permissionsContext.permissions.user_id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Permissions:</p>
              <p className="font-mono text-sm text-green-600">
                {permissionsContext.permissions.permissions.length}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Groups:</p>
              <p className="font-mono text-sm text-blue-600">
                {permissionsContext.permissions.groups.length}
              </p>
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              Show permissions data
            </summary>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(permissionsContext.permissions, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* localStorage Data */}
      {localStorageData && (
        <div className="bg-white p-4 rounded-lg mb-6 border border-gray-200">
          <h3 className="font-semibold text-lg mb-3">💾 localStorage Permissions</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-gray-600 text-sm">Username:</p>
              <p className="font-mono text-sm">{localStorageData.username}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Permissions:</p>
              <p className="font-mono text-sm text-green-600">{localStorageData.permissions.length}</p>
            </div>
          </div>
          <details>
            <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
              Show localStorage data
            </summary>
            <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* All localStorage Keys */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-lg mb-3">🗄️ All localStorage Keys</h3>
        <div className="space-y-2">
          {Object.entries(allLocalStorage).map(([key, value]) => (
            <details key={key} className="border-b border-gray-100 pb-2">
              <summary className="cursor-pointer text-sm font-mono text-blue-600 hover:text-blue-800">
                {key}
              </summary>
              <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
                {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mt-6">
        <h3 className="font-semibold text-lg mb-3">🔧 Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Reload Page
          </button>
          <button
            onClick={() => {
              localStorage.clear()
              window.location.reload()
            }}
            className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            🗑️ Clear localStorage & Reload
          </button>
          <button
            onClick={() => {
              window.location.href = '/admin/login'
            }}
            className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            🔐 Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}
