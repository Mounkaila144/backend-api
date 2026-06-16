'use client';

import { useRouter, usePathname } from 'next/navigation';

import type { Site } from '../../types/site.types';

interface SiteDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  site: Site | null;
}

export default function SiteDetailModal({ isOpen, onClose, site }: SiteDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (!isOpen || !site) return null;

  // Extraire la langue depuis le pathname (ex: /fr/superadmin/... -> fr)
  const lang = pathname.split('/')[1] || 'fr';

  const handleManageModules = () => {
    router.push(`/${lang}/superadmin/sites/${site.id}/modules`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                Détails du site
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-6">
            {/* Informations générales */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Informations générales
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Domaine</label>
                  <p className="mt-1 text-sm text-gray-900 font-medium">{site.host}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Société</label>
                  <p className="mt-1 text-sm text-gray-900">{site.company || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.type === 'CUST' ? 'bg-blue-100 text-blue-800' :
                      site.type === 'ECOM' ? 'bg-green-100 text-green-800' :
                      site.type === 'CMS' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {site.type === 'CUST' ? 'CRM' : site.type === 'ECOM' ? 'E-commerce' : site.type === 'CMS' ? 'CMS' : 'N/A'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Prix</label>
                  <p className="mt-1 text-sm text-gray-900">{site.price ? `${site.price} €` : '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Est client</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.is_customer ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.is_customer ? 'Oui' : 'Non'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Accès restreint</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.access_restricted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {site.access_restricted ? 'Oui' : 'Non'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Base de données */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Base de données
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Nom</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{site.database.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Hôte</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{site.database.host}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Port</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{site.database.port || 3306}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Taille</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {site.database.size ? `${(site.database.size / 1024 / 1024).toFixed(2)} MB` : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">SSL</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.database.ssl?.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {site.database.ssl?.enabled ? `Activé (${site.database.ssl.mode})` : 'Désactivé'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Disponibilité */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Disponibilité
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Site</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.availability.site ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {site.availability.site ? 'Disponible' : 'Indisponible'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admin</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.availability.admin ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {site.availability.admin ? 'Disponible' : 'Indisponible'}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Frontend</label>
                  <p className="mt-1">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      site.availability.frontend ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {site.availability.frontend ? 'Disponible' : 'Indisponible'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Thèmes */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Thèmes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admin - Actuel</label>
                  <p className="mt-1 text-sm text-gray-900">{site.themes.admin.current || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admin - Base</label>
                  <p className="mt-1 text-sm text-gray-900">{site.themes.admin.base || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Frontend - Actuel</label>
                  <p className="mt-1 text-sm text-gray-900">{site.themes.frontend.current || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Frontend - Base</label>
                  <p className="mt-1 text-sm text-gray-900">{site.themes.frontend.base || '-'}</p>
                </div>
              </div>
            </div>

            {/* Assets */}
            {(site.assets.logo || site.assets.picture || site.assets.banner || site.assets.favicon) && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                  Assets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {site.assets.logo && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Logo</label>
                      <p className="mt-1 text-sm text-gray-900 truncate">{site.assets.logo}</p>
                    </div>
                  )}
                  {site.assets.picture && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Image</label>
                      <p className="mt-1 text-sm text-gray-900 truncate">{site.assets.picture}</p>
                    </div>
                  )}
                  {site.assets.banner && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Bannière</label>
                      <p className="mt-1 text-sm text-gray-900 truncate">{site.assets.banner}</p>
                    </div>
                  )}
                  {site.assets.favicon && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Favicon</label>
                      <p className="mt-1 text-sm text-gray-900 truncate">{site.assets.favicon}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              type="button"
              onClick={handleManageModules}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Gérer les modules
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Fermer
            </button>
          </div>
      </div>
    </div>
  );
}
