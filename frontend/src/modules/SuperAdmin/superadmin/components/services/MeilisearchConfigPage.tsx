'use client';

import { ServiceConfigLayout } from './ServiceConfigLayout';
import { MeilisearchConfigForm } from './MeilisearchConfigForm';
import { useServiceConfig } from '../../hooks/useServiceConfig';
import type { MeilisearchConfig } from '../../../types/service-config.types';

export function MeilisearchConfigPage() {
  const {
    config,
    isLoading,
    error,
    save,
    isSaving,
    test,
    isTesting,
    testResult,
  } = useServiceConfig<MeilisearchConfig>('meilisearch');

  return (
    <ServiceConfigLayout
      title="Meilisearch"
      description="Configuration du moteur de recherche Meilisearch"
      isLoading={isLoading}
      breadcrumbs={[
        { label: 'Services', href: '/superadmin/services' },
        { label: 'Meilisearch' },
      ]}
    >
      <MeilisearchConfigForm
        config={config}
        onSave={save}
        isSaving={isSaving}
        onTest={test}
        isTesting={isTesting}
        testResult={testResult}
        error={error}
      />
    </ServiceConfigLayout>
  );
}
