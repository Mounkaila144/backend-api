'use client';

import { useState, useEffect } from 'react';

import type { Site, CreateSiteData, UpdateSiteData, SiteType, YesNo, SslMode } from '../../types/site.types';
import DatabaseProvisioningPanel from './DatabaseProvisioningPanel';

interface SiteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSiteData | UpdateSiteData) => Promise<void>;
  site?: Site | null;
  mode: 'create' | 'edit';
}

export default function SiteFormModal({ isOpen, onClose, onSubmit, site, mode }: SiteFormModalProps) {
  const [formData, setFormData] = useState<any>({
    site_host: '',
    site_db_name: '',
    site_db_host: 'localhost',
    site_db_port: '3306',
    site_db_ssl_enabled: 'NO' as YesNo,
    site_db_ssl_mode: 'PREFERRED' as SslMode,
    site_db_ssl_ca: '',
    site_db_login: 'root',
    site_db_password: '',
    use_db_password: false, // Checkbox pour indiquer si on utilise un mot de passe
    site_company: '',
    site_type: 'CUST' as SiteType,
    site_available: 'YES' as YesNo,
    site_admin_available: 'YES' as YesNo,
    site_frontend_available: 'YES' as YesNo,
    is_customer: 'NO' as YesNo,
    site_access_restricted: 'NO' as YesNo,
    price: '',
    create_database: false,
    setup_tables: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'edit' && site) {
      // Vérifier si le site a un mot de passe (le backend renvoie has_password)
      const hasPassword = !!site.database.has_password;

      setFormData({
        site_host: site.host,
        site_db_name: site.database.name,
        site_db_host: site.database.host,
        site_db_port: site.database.port?.toString() || '3306',
        site_db_ssl_enabled: site.database.ssl?.enabled ? 'YES' : 'NO',
        site_db_ssl_mode: site.database.ssl?.mode || 'PREFERRED',
        site_db_ssl_ca: site.database.ssl?.ca || '',
        site_db_login: site.database.login || '',
        site_db_password: '', // Toujours vide par défaut, pour ne pas afficher le mot de passe
        use_db_password: hasPassword, // Coché si le site a un mot de passe
        site_company: site.company || '',
        site_type: site.type || 'CUST',
        site_available: site.availability.site ? 'YES' : 'NO',
        site_admin_available: site.availability.admin ? 'YES' : 'NO',
        site_frontend_available: site.availability.frontend ? 'YES' : 'NO',
        is_customer: site.is_customer ? 'YES' : 'NO',
        site_access_restricted: site.access_restricted ? 'YES' : 'NO',
        price: site.price?.toString() || '',
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        site_host: '',
        site_db_name: '',
        site_db_host: 'localhost',
        site_db_port: '3306',
        site_db_ssl_enabled: 'NO' as YesNo,
        site_db_ssl_mode: 'PREFERRED' as SslMode,
        site_db_ssl_ca: '',
        site_db_login: 'root',
        site_db_password: '',
        use_db_password: false, // Par défaut, pas de mot de passe
        site_company: '',
        site_type: 'CUST' as SiteType,
        site_available: 'YES' as YesNo,
        site_admin_available: 'YES' as YesNo,
        site_frontend_available: 'YES' as YesNo,
        is_customer: 'NO' as YesNo,
        site_access_restricted: 'NO' as YesNo,
        price: '',
        create_database: false,
        setup_tables: false,
      });
    }
  }, [mode, site, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const submitData: any = { ...formData };

      // Convertir le prix en nombre
      if (submitData.price) {
        submitData.price = parseFloat(submitData.price);
      }

      // Convertir le port en nombre
      if (submitData.site_db_port) {
        submitData.site_db_port = parseInt(submitData.site_db_port, 10);
      }

      // Gestion du mot de passe selon la checkbox
      if (!submitData.use_db_password) {
        // Si la checkbox n'est pas cochée, on envoie explicitement une chaîne vide
        // pour indiquer au backend qu'on ne veut pas de mot de passe
        submitData.site_db_password = '';
      } else if (mode === 'edit' && !submitData.site_db_password) {
        // En mode édition, si la checkbox est cochée mais le champ vide,
        // ne pas envoyer le mot de passe (garder l'existant)
        delete submitData.site_db_password;
      }

      // Supprimer use_db_password car ce n'est pas un champ du backend
      delete submitData.use_db_password;

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {mode === 'create' ? 'Créer un nouveau site' : 'Modifier le site'}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Domaine */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domaine <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="site_host"
                    value={formData.site_host}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="exemple.com"
                  />
                </div>

                {/* Base de données */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la base de données <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="site_db_name"
                    value={formData.site_db_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="db_exemple"
                  />
                </div>

                {/* Hôte DB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hôte de la base de données <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="site_db_host"
                    value={formData.site_db_host}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="localhost"
                  />
                </div>

                {/* Port DB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Port de la base de données
                  </label>
                  <input
                    type="number"
                    name="site_db_port"
                    value={formData.site_db_port}
                    onChange={handleChange}
                    min="1"
                    max="65535"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="3306"
                  />
                </div>

                {/* Login DB */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Login de la base de données {mode === 'create' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    name="site_db_login"
                    value={formData.site_db_login}
                    onChange={handleChange}
                    required={mode === 'create'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="root"
                  />
                </div>

                {/* Checkbox utiliser mot de passe */}
                <div className="flex items-center">
                  <div className="flex items-center h-full pt-6">
                    <input
                      id="use_db_password"
                      name="use_db_password"
                      type="checkbox"
                      checked={formData.use_db_password}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="use_db_password" className="ml-2 block text-sm text-gray-900">
                      La base de données nécessite un mot de passe
                    </label>
                  </div>
                </div>

                {/* Password DB - affiché seulement si use_db_password est coché */}
                {formData.use_db_password && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe de la base de données
                      {mode === 'edit' && <span className="text-xs text-gray-500 ml-2">(laisser vide pour garder l&apos;existant)</span>}
                    </label>
                    <input
                      type="password"
                      name="site_db_password"
                      value={formData.site_db_password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder={mode === 'edit' ? '••••••••' : 'Mot de passe'}
                    />
                  </div>
                )}

                {/* SSL Enabled */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SSL activé
                  </label>
                  <select
                    name="site_db_ssl_enabled"
                    value={formData.site_db_ssl_enabled}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="NO">Non</option>
                    <option value="YES">Oui</option>
                  </select>
                </div>

                {/* SSL Mode - affiché seulement si SSL activé */}
                {formData.site_db_ssl_enabled === 'YES' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mode SSL
                    </label>
                    <select
                      name="site_db_ssl_mode"
                      value={formData.site_db_ssl_mode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="PREFERRED">Préféré</option>
                      <option value="REQUIRED">Requis</option>
                      <option value="VERIFY_CA">Vérifier CA</option>
                      <option value="VERIFY_IDENTITY">Vérifier identité</option>
                    </select>
                  </div>
                )}
              </div>

              {/* SSL CA Certificate - affiché seulement si SSL activé */}
              {formData.site_db_ssl_enabled === 'YES' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Certificat CA SSL
                    <span className="text-xs text-gray-500 ml-2">(contenu du fichier .pem ou chemin vers le fichier)</span>
                  </label>
                  <textarea
                    name="site_db_ssl_ca"
                    value={formData.site_db_ssl_ca}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 font-mono text-xs"
                    placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Société */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Société
                  </label>
                  <input
                    type="text"
                    name="site_company"
                    value={formData.site_company}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nom de la société"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de site
                  </label>
                  <select
                    name="site_type"
                    value={formData.site_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="CUST">CRM</option>
                    <option value="ECOM">E-commerce</option>
                    <option value="CMS">CMS</option>
                  </select>
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Disponibilité Site */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site disponible
                  </label>
                  <select
                    name="site_available"
                    value={formData.site_available}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="YES">Oui</option>
                    <option value="NO">Non</option>
                  </select>
                </div>

                {/* Disponibilité Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin disponible
                  </label>
                  <select
                    name="site_admin_available"
                    value={formData.site_admin_available}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="YES">Oui</option>
                    <option value="NO">Non</option>
                  </select>
                </div>

                {/* Disponibilité Frontend */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frontend disponible
                  </label>
                  <select
                    name="site_frontend_available"
                    value={formData.site_frontend_available}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="YES">Oui</option>
                    <option value="NO">Non</option>
                  </select>
                </div>

                {/* Est client */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Est un client
                  </label>
                  <select
                    name="is_customer"
                    value={formData.is_customer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="YES">Oui</option>
                    <option value="NO">Non</option>
                  </select>
                </div>

                {/* Accès restreint */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accès restreint
                  </label>
                  <select
                    name="site_access_restricted"
                    value={formData.site_access_restricted}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="YES">Oui</option>
                    <option value="NO">Non</option>
                  </select>
                </div>
              </div>

              {mode === 'create' && (
                <DatabaseProvisioningPanel
                  host={formData.site_db_host}
                  port={formData.site_db_port}
                  username={formData.site_db_login}
                  password={formData.use_db_password ? formData.site_db_password : ''}
                  database={formData.site_db_name}
                />
              )}
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enregistrement...' : mode === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
            </div>
          </form>
      </div>
    </div>
  );
}
