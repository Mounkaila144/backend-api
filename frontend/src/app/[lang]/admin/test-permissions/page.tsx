'use client'

/**
 * Page de test du système de permissions
 *
 * Accès : http://localhost:3000/admin/test-permissions
 *
 * Cette page affiche toutes les permissions chargées et permet de tester
 * les différentes fonctionnalités du système de permissions.
 */

import { usePermissions } from '@/shared/contexts/PermissionsContext'
import { Can, Cannot } from '@/shared/components/permissions'
import { useAuth } from '@/modules/UsersGuard'

export default function TestPermissionsPage() {
  const { permissions, hasCredential, hasGroup, isSuperadmin, isAdmin, loading } = usePermissions()
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Test du système de permissions</h1>

      {/* Section 1: Informations utilisateur */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Informations utilisateur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Username:</p>
            <p className="font-semibold text-lg">{permissions?.username || user?.username || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">User ID:</p>
            <p className="font-semibold text-lg">{permissions?.user_id || user?.id || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-600">Total permissions:</p>
            <p className="font-semibold text-lg text-green-600">{permissions?.permissions.length || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Total groups:</p>
            <p className="font-semibold text-lg text-blue-600">{permissions?.groups.length || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Is Superadmin:</p>
            <p className="font-semibold text-lg">{isSuperadmin() ? '✅ Yes' : '❌ No'}</p>
          </div>
          <div>
            <p className="text-gray-600">Is Admin:</p>
            <p className="font-semibold text-lg">{isAdmin() ? '✅ Yes' : '❌ No'}</p>
          </div>
        </div>
      </div>

      {/* Section 2: Test des groupes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test des groupes</h2>
        <div className="space-y-3">
          {permissions?.groups && permissions.groups.length > 0 ? (
            permissions.groups.map((group) => (
              <div key={group} className="flex items-center space-x-3">
                <Can credential={group}>
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg flex-1">
                    ✅ Groupe: <strong>{group}</strong>
                  </div>
                </Can>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">Aucun groupe trouvé</p>
          )}
        </div>
      </div>

      {/* Section 3: Test des permissions spécifiques */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test des permissions spécifiques</h2>
        <div className="space-y-3">
          {/* Test permissions communes basées sur vos données */}
          <Can credential="contract_meeting_request_default_value">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✅ Permission: <strong>contract_meeting_request_default_value</strong>
            </div>
          </Can>

          <Can credential="contract_new_partner_layer">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✅ Permission: <strong>contract_new_partner_layer</strong>
            </div>
          </Can>

          <Can credential="app_domoprime_contract_view_fidealis">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✅ Permission: <strong>app_domoprime_contract_view_fidealis</strong>
            </div>
          </Can>

          <Can credential="meeting_update_no_cumac_generation">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✅ Permission: <strong>meeting_update_no_cumac_generation</strong>
            </div>
          </Can>

          {/* Test permission inexistante */}
          <Can
            credential="permission_qui_nexiste_pas"
            fallback={
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg">
                ❌ Permission: <strong>permission_qui_nexiste_pas</strong> (non trouvée)
              </div>
            }
          >
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg">
              ✅ Permission: <strong>permission_qui_nexiste_pas</strong>
            </div>
          </Can>
        </div>
      </div>

      {/* Section 4: Test avec code JavaScript */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test avec code JavaScript</h2>
        <div className="space-y-3">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-mono text-sm mb-2">hasCredential(&apos;1-FIDEALIS&apos;)</p>
            <p className="font-semibold">{hasCredential('1-FIDEALIS') ? '✅ true' : '❌ false'}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-mono text-sm mb-2">hasGroup(&apos;1-FIDEALIS&apos;)</p>
            <p className="font-semibold">{hasGroup('1-FIDEALIS') ? '✅ true' : '❌ false'}</p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-mono text-sm mb-2">
              hasCredential([[&apos;admin&apos;, &apos;superadmin&apos;, &apos;1-FIDEALIS&apos;]])
            </p>
            <p className="font-semibold">
              {hasCredential([['admin', 'superadmin', '1-FIDEALIS']]) ? '✅ true' : '❌ false'}
            </p>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="font-mono text-sm mb-2">
              hasCredential([&apos;contract_meeting_request_default_value&apos;, &apos;contract_new_partner_layer&apos;], true)
            </p>
            <p className="font-semibold">
              {hasCredential(['contract_meeting_request_default_value', 'contract_new_partner_layer'], true)
                ? '✅ true (AND logic)'
                : '❌ false (AND logic)'}
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Test des composants Cannot */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Test du composant &lt;Cannot&gt;</h2>
        <div className="space-y-3">
          <Cannot credential="admin">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              ⚠️ Vous n&apos;êtes PAS admin
            </div>
          </Cannot>

          <Cannot credential="superadmin">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              ⚠️ Vous n&apos;êtes PAS superadmin
            </div>
          </Cannot>

          <Cannot credential="1-FIDEALIS">
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              ⚠️ Vous n&apos;appartenez PAS au groupe 1-FIDEALIS
            </div>
          </Cannot>
        </div>
      </div>

      {/* Section 6: Liste de toutes les permissions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Toutes les permissions ({permissions?.permissions.length || 0})
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-auto">
          {permissions?.permissions && permissions.permissions.length > 0 ? (
            <ul className="space-y-1">
              {permissions.permissions.map((perm, index) => (
                <li key={index} className="text-sm font-mono text-gray-700">
                  {index + 1}. {perm}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">Aucune permission trouvée</p>
          )}
        </div>
      </div>

      {/* Section 7: Liste de tous les groupes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">
          Tous les groupes ({permissions?.groups.length || 0})
        </h2>
        <div className="bg-gray-100 p-4 rounded-lg">
          {permissions?.groups && permissions.groups.length > 0 ? (
            <ul className="space-y-1">
              {permissions.groups.map((group, index) => (
                <li key={index} className="text-sm font-mono text-gray-700">
                  {index + 1}. {group}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">Aucun groupe trouvé</p>
          )}
        </div>
      </div>

      {/* Section 8: Données complètes (JSON) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Données complètes (JSON)</h2>
        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs">
          {JSON.stringify(permissions, null, 2)}
        </pre>
      </div>
    </div>
  )
}
