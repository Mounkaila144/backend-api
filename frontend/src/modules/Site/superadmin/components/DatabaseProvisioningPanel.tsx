'use client';

import { useState } from 'react';

import { databaseService } from '../services/databaseService';
import type { TestConnectionResult } from '../services/databaseService';

interface DatabaseProvisioningPanelProps {
  host: string;
  port: string | number;
  username: string;
  password: string;
  database: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'testing' }
  | { kind: 'tested'; result: TestConnectionResult }
  | { kind: 'provisioning' }
  | { kind: 'provisioned'; alreadyExisted: boolean }
  | { kind: 'error'; message: string };

export default function DatabaseProvisioningPanel({
  host,
  port,
  username,
  password,
  database,
}: DatabaseProvisioningPanelProps) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const credsWithDb = {
    host,
    port: typeof port === 'string' ? parseInt(port, 10) : port,
    username,
    password,
    database,
  };

  const credsValid = host && port && username && database;

  const handleTest = async () => {
    setStatus({ kind: 'testing' });

    try {
      const result = await databaseService.testConnection(credsWithDb);

      if (!result.can_connect) {
        setStatus({ kind: 'error', message: result.error || 'Connexion refusée' });

        return;
      }

      setStatus({ kind: 'tested', result });
    } catch (err: any) {
      setStatus({
        kind: 'error',
        message: err.response?.data?.message || err.message || 'Erreur réseau',
      });
    }
  };

  const handleProvision = async () => {
    setStatus({ kind: 'provisioning' });

    try {
      const result = await databaseService.provisionDatabase(credsWithDb);
      setStatus({ kind: 'provisioned', alreadyExisted: result.already_existed });
    } catch (err: any) {
      setStatus({
        kind: 'error',
        message: err.response?.data?.message || err.message || 'Création échouée',
      });
    }
  };

  const renderStatus = () => {
    switch (status.kind) {
      case 'idle':
        return null;
      case 'testing':
        return <p className="text-sm text-gray-600">⏳ Test de la connexion en cours…</p>;
      case 'tested':
        return (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
            ✓ Connexion OK · MySQL {status.result.server_version}
            {status.result.db_exists !== undefined && (
              <>
                {' · '}
                {status.result.db_exists
                  ? <span className="font-medium">DB &quot;{database}&quot; existe déjà</span>
                  : <span className="font-medium">DB &quot;{database}&quot; n&apos;existe pas (à créer)</span>
                }
              </>
            )}
          </div>
        );
      case 'provisioning':
        return <p className="text-sm text-gray-600">⏳ Création de la base de données…</p>;
      case 'provisioned':
        return (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
            {status.alreadyExisted
              ? <>· DB &quot;{database}&quot; existait déjà — aucune action</>
              : <>✓ DB &quot;{database}&quot; créée — vide, à peupler via phpMyAdmin du cloud</>
            }
          </div>
        );
      case 'error':
        return (
          <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">
            ✗ {status.message}
          </div>
        );
    }
  };

  const isBusy = ['testing', 'provisioning'].includes(status.kind);
  const canProvision =
    status.kind === 'tested' && status.result.can_connect && status.result.db_exists === false;

  return (
    <div className="md:col-span-2 mt-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Provisionnement de la base de données
      </h4>

      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          onClick={handleTest}
          disabled={!credsValid || isBusy}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🔌 Tester la connexion
        </button>

        {canProvision && (
          <button
            type="button"
            onClick={handleProvision}
            disabled={isBusy}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            ➕ Créer la base de données
          </button>
        )}
      </div>

      {!credsValid && (
        <p className="text-xs text-gray-500 italic">
          Remplis hôte, port, login, mot de passe et nom de DB pour activer les boutons.
        </p>
      )}

      {renderStatus()}

      <p className="text-xs text-gray-500 mt-3 italic">
        💡 Pour importer un dump SQL : utilise phpMyAdmin déployé dans ton cloud
        (réseau interne, beaucoup plus rapide qu&apos;un upload via cette interface).
      </p>
    </div>
  );
}
