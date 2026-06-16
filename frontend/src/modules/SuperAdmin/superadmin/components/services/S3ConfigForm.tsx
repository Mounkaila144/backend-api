'use client';

import React, { useState, useEffect } from 'react';

import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
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
import type { S3Config, TestResult } from '../../../types/service-config.types';

/**
 * Schéma de validation Yup pour la configuration S3
 */
const s3Schema = yup.object({
  access_key: yup.string().required('Access Key requis'),
  secret_key: yup.string().required('Secret Key requis'),
  bucket: yup.string().required('Bucket requis'),
  region: yup.string().required('Région requise'),
  endpoint: yup
    .string()
    .nullable()
    .transform((value) => (value === '' ? null : value))
    .url('URL invalide'),
  use_path_style: yup.boolean(),
});

/**
 * Type pour les données du formulaire
 */
type S3FormData = yup.InferType<typeof s3Schema>;

/**
 * Props du composant S3ConfigForm
 */
interface S3ConfigFormProps {

  /** Configuration S3 actuelle */
  config: S3Config | null;

  /** Callback appelé lors de la sauvegarde */
  onSave: (data: Partial<S3Config>) => Promise<boolean>;

  /** Indique si la sauvegarde est en cours */
  isSaving?: boolean;

  /** Callback appelé pour tester la connexion (utilise la config sauvegardée) */
  onTest: () => Promise<void>;

  /** Indique si le test est en cours */
  isTesting?: boolean;

  /** Résultat du dernier test */
  testResult: TestResult | null;

  /** Erreur globale */
  error?: string | null;
}

/**
 * Formulaire de configuration S3/MinIO (modifiable)
 * Utilise react-hook-form + yup pour la validation
 *
 * @example
 * ```tsx
 * <S3ConfigForm
 *   config={config}
 *   onSave={save}
 *   isSaving={isSaving}
 *   onTest={test}
 *   isTesting={isTesting}
 *   testResult={testResult}
 * />
 * ```
 */
export function S3ConfigForm({
  config,
  onSave,
  isSaving = false,
  onTest,
  isTesting = false,
  testResult,
  error,
}: S3ConfigFormProps) {
  // État pour afficher/masquer le secret key
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Initialisation du formulaire avec react-hook-form
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<S3FormData>({
    resolver: yupResolver(s3Schema),
    defaultValues: {
      access_key: '',
      secret_key: '',
      bucket: '',
      region: '',
      endpoint: '',
      use_path_style: false,
    },
    mode: 'onChange',
  });

  // Mettre à jour le formulaire quand la config change
  useEffect(() => {
    if (config) {
      reset({
        access_key: config.access_key || '',
        secret_key: config.secret_key || '',
        bucket: config.bucket || '',
        region: config.region || '',
        endpoint: config.endpoint || '',
        use_path_style: config.use_path_style || false,
      });
    }
  }, [config, reset]);

  // Handler de soumission
  const onSubmit = async (data: S3FormData) => {
    // Ne pas envoyer le secret_key s'il n'a pas changé (contient des ●)
    const submitData: Partial<S3Config> = {
      access_key: data.access_key,
      bucket: data.bucket,
      region: data.region,
      endpoint: data.endpoint || undefined,
      use_path_style: data.use_path_style,
    };

    // Envoyer le secret_key seulement s'il a été modifié
    if (data.secret_key && !data.secret_key.includes('●')) {
      submitData.secret_key = data.secret_key;
    }

    await onSave(submitData);
  };

  // Handler de test - utilise la config sauvegardée en base
  const handleTest = async () => {
    await onTest();
  };

  // Handler pour annuler (reset)
  const handleCancel = () => {
    if (config) {
      reset({
        access_key: config.access_key || '',
        secret_key: config.secret_key || '',
        bucket: config.bucket || '',
        region: config.region || '',
        endpoint: config.endpoint || '',
        use_path_style: config.use_path_style || false,
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* Erreur globale */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Access Key */}
        <Grid item xs={12} md={6}>
          <Controller
            name="access_key"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Access Key"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                error={!!errors.access_key}
                helperText={errors.access_key?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-key" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Secret Key */}
        <Grid item xs={12} md={6}>
          <Controller
            name="secret_key"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Secret Key"
                type={showSecretKey ? 'text' : 'password'}
                placeholder="●●●●●●●●"
                error={!!errors.secret_key}
                helperText={errors.secret_key?.message || 'Laissez vide pour conserver la valeur actuelle'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-lock" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSecretKey(!showSecretKey)}
                        edge="end"
                        size="small"
                      >
                        <i
                          className={showSecretKey ? 'tabler-eye-off' : 'tabler-eye'}
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

        {/* Bucket */}
        <Grid item xs={12} md={6}>
          <Controller
            name="bucket"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Bucket"
                placeholder="my-bucket-name"
                error={!!errors.bucket}
                helperText={errors.bucket?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-bucket" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Region */}
        <Grid item xs={12} md={6}>
          <Controller
            name="region"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Région"
                placeholder="eu-west-3"
                error={!!errors.region}
                helperText={errors.region?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-world" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Endpoint (optionnel pour MinIO) */}
        <Grid item xs={12}>
          <Controller
            name="endpoint"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Endpoint (optionnel)"
                placeholder="https://minio.example.com"
                error={!!errors.endpoint}
                helperText={errors.endpoint?.message || 'URL personnalisée pour MinIO ou autre stockage compatible S3'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-link" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        {/* Use Path Style (pour MinIO) */}
        <Grid item xs={12}>
          <Controller
            name="use_path_style"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                }
                label="Utiliser Path-Style (requis pour MinIO et certains stockages compatibles S3)"
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Résultat du test */}
      <TestResultAlert result={testResult} isLoading={isTesting} />

      {/* Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {/* Bouton Test */}
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

        {/* Bouton Annuler */}
        <Button
          variant="outlined"
          color="inherit"
          onClick={handleCancel}
          disabled={isSaving || !isDirty}
        >
          Annuler
        </Button>

        {/* Bouton Enregistrer */}
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
