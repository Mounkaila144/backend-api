'use client';

import { ServiceConfigLayout } from './ServiceConfigLayout';
import { ResendConfigForm } from './ResendConfigForm';
import { useServiceConfig } from '../../hooks/useServiceConfig';
import type { ResendConfig } from '../../../types/service-config.types';

export function ResendConfigPage() {
  const {
    config,
    isLoading,
    error,
    save,
    isSaving,
    test,
    isTesting,
    testResult,
  } = useServiceConfig<ResendConfig>('resend');

  return (
    <ServiceConfigLayout
      title="Resend"
      description="Configuration du service d'envoi d'emails Resend"
      isLoading={isLoading}
      breadcrumbs={[
        { label: 'Services', href: '/superadmin/services' },
        { label: 'Resend' },
      ]}
    >
      <ResendConfigForm
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
