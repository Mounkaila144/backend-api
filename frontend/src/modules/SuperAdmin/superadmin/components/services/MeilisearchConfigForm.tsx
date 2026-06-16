'use client';

import React, { useState, useEffect } from 'react';

import {
  Box,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { TestResultAlert } from './TestResultAlert';
import type { MeilisearchConfig, TestResult } from '../../../types/service-config.types';

// Valeur masquée retournée par le backend pour les champs sensibles
const MASKED_VALUE = '********';

/**
 * Vérifie si une valeur est la valeur masquée du backend
 */
const isMaskedValue = (value: string | undefined | null): boolean => {
  if (!value) return false;

  // Vérifie si la valeur est exactement la valeur masquée ou contient uniquement des caractères de masquage
  return value === MASKED_VALUE || /^[*●•]+$/.test(value);
};

/**
 * Schéma de validation pour Meilisearch
 */
const meilisearchSchema = yup.object({
  url: yup.string().required('URL requise').url('URL invalide'),
  api_key: yup.string().required('API Key requise'),
  index_prefix: yup.string().nullable(),
});

type MeilisearchFormData = yup.InferType<typeof meilisearchSchema>;

interface MeilisearchConfigFormProps {
  config: MeilisearchConfig | null;
  onSave: (data: Partial<MeilisearchConfig>) => Promise<boolean>;
  isSaving?: boolean;
  onTest: () => Promise<void>;
  isTesting?: boolean;
  testResult: TestResult | null;
  error?: string | null;
}

export function MeilisearchConfigForm({
  config,
  onSave,
  isSaving = false,
  onTest,
  isTesting = false,
  testResult,
  error,
}: MeilisearchConfigFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<MeilisearchFormData>({
    resolver: yupResolver(meilisearchSchema),
    defaultValues: {
      url: '',
      api_key: '',
      index_prefix: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (config) {
      reset({
        url: config.url || '',
        api_key: config.api_key || '',
        index_prefix: config.index_prefix || '',
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: MeilisearchFormData) => {
    const submitData: any = {
      url: data.url,
      index_prefix: data.index_prefix || undefined,
    };

    // N'envoyer l'API key que si elle a été modifiée (pas la valeur masquée)
    if (data.api_key && !isMaskedValue(data.api_key)) {
      submitData.api_key = data.api_key;
    }

    await onSave(submitData);
  };

  // Handler de test - utilise la config sauvegardée en base
  const handleTest = async () => {
    await onTest();
  };

  const handleCancel = () => {
    if (config) {
      reset({
        url: config.url || '',
        api_key: config.api_key || '',
        index_prefix: config.index_prefix || '',
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Controller
            name="url"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="URL Meilisearch"
                placeholder="http://localhost:7700"
                error={!!errors.url}
                helperText={errors.url?.message || 'URL du serveur Meilisearch (avec http:// ou https://)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-server" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="api_key"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Master Key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="masterKey123..."
                error={!!errors.api_key}
                helperText={errors.api_key?.message || 'Master key de Meilisearch (laisser vide pour ne pas modifier)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-key" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                        size="small"
                      >
                        <i
                          className={showApiKey ? 'tabler-eye-off' : 'tabler-eye'}
                          style={{ fontSize: 18 }}
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="index_prefix"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Préfixe des index"
                placeholder="tenant_"
                error={!!errors.index_prefix}
                helperText={errors.index_prefix?.message || "Préfixe des index (ex: 'tenant_')"}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-tag" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>
      </Grid>

      <TestResultAlert result={testResult} isLoading={isTesting} />

      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="info"
          onClick={handleTest}
          disabled={isTesting || isSaving}
          startIcon={
            isTesting ? (
              <CircularProgress size={16} />
            ) : (
              <i className="tabler-plug-connected" style={{ fontSize: 18 }} />
            )
          }
        >
          {isTesting ? 'Test en cours...' : 'Tester la connexion'}
        </Button>

        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          disabled={isSaving || !isDirty}
        >
          Annuler
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSaving || !isDirty}
          startIcon={
            isSaving ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <i className="tabler-device-floppy" style={{ fontSize: 18 }} />
            )
          }
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </Box>
    </Box>
  );
}
