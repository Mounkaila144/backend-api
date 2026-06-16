'use client';

import React from 'react';

import { useParams } from 'next/navigation';

import { ServiceConfigLayout } from './ServiceConfigLayout';
import { S3ConfigForm } from './S3ConfigForm';
import { useServiceConfig } from '../../hooks/useServiceConfig';
import { SERVICE_LABELS, SERVICE_DESCRIPTIONS } from '../../../types/service-config.types';
import type { S3Config } from '../../../types/service-config.types';

/**
 * Page de configuration S3/MinIO
 */
export function S3ConfigPage() {
  const params = useParams();
  const lang = (params?.lang as string) || 'fr';

  const {
    config,
    isLoading,
    error,
    save,
    isSaving,
    test,
    isTesting,
    testResult,
    isEditable,
  } = useServiceConfig<S3Config>('s3');

  return (
    <ServiceConfigLayout
      title={SERVICE_LABELS['s3']}
      description={SERVICE_DESCRIPTIONS['s3']}
      readOnly={!isEditable}
      isLoading={isLoading}
      lang={lang}
    >
      <S3ConfigForm
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
