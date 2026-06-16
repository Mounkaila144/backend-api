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
  Collapse,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { TestResultAlert } from './TestResultAlert';
import type { ResendConfig, TestResult } from '../../../types/service-config.types';

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
 * Schéma de validation pour Resend
 */
const resendSchema = yup.object({
  api_key: yup.string().required('API Key requise'),
  from_address: yup.string().email('Email invalide').required('Email expéditeur requis'),
  from_name: yup.string().required('Nom expéditeur requis'),
  reply_to: yup.string().email('Email invalide').nullable(),
});

type ResendFormData = yup.InferType<typeof resendSchema>;

interface ResendConfigFormProps {
  config: ResendConfig | null;
  onSave: (data: Partial<ResendConfig>) => Promise<boolean>;
  isSaving?: boolean;
  onTest: () => Promise<void>;
  isTesting?: boolean;
  testResult: TestResult | null;
  error?: string | null;
}

export function ResendConfigForm({
  config,
  onSave,
  isSaving = false,
  onTest,
  isTesting = false,
  testResult,
  error,
}: ResendConfigFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ResendFormData>({
    resolver: yupResolver(resendSchema),
    defaultValues: {
      api_key: '',
      from_address: '',
      from_name: '',
      reply_to: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (config) {
      reset({
        api_key: config.api_key || '',
        from_address: config.from_address || '',
        from_name: config.from_name || '',
        reply_to: config.reply_to || '',
      });
    }
  }, [config, reset]);

  const onSubmit = async (data: ResendFormData) => {
    const submitData: any = {
      from_address: data.from_address,
      from_name: data.from_name,
      reply_to: data.reply_to || undefined,
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
        api_key: config.api_key || '',
        from_address: config.from_address || '',
        from_name: config.from_name || '',
        reply_to: config.reply_to || '',
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
        <Grid item xs={12}>
          <Controller
            name="api_key"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="API Key Resend"
                type={showApiKey ? 'text' : 'password'}
                placeholder="re_..."
                error={!!errors.api_key}
                helperText={errors.api_key?.message || 'Votre clé API Resend (laisser vide pour ne pas modifier)'}
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
            name="from_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Adresse email expéditeur"
                type="email"
                placeholder="noreply@example.com"
                error={!!errors.from_address}
                helperText={errors.from_address?.message || 'Email par défaut pour les envois (doit être vérifié chez Resend)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-mail" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="from_name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nom expéditeur"
                placeholder="Mon Application"
                error={!!errors.from_name}
                helperText={errors.from_name?.message || 'Nom affiché dans les emails'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-user" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Controller
            name="reply_to"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Adresse de réponse (Reply-To)"
                type="email"
                placeholder="support@example.com"
                error={!!errors.reply_to}
                helperText={errors.reply_to?.message || 'Email où les réponses seront envoyées (optionnel)'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="tabler-mail-reply" style={{ fontSize: 18, color: '#666' }} />
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </Grid>
      </Grid>

      {/* Section Test Email */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="text"
          onClick={() => setShowTestEmail(!showTestEmail)}
          startIcon={<i className="tabler-mail-forward" style={{ fontSize: 18 }} />}
        >
          {showTestEmail ? 'Masquer' : 'Envoyer un email de test'}
        </Button>

        <Collapse in={showTestEmail}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <TextField
              fullWidth
              label="Email de test"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              helperText="Un email de test sera envoyé à cette adresse"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="tabler-mail" style={{ fontSize: 18, color: '#666' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Collapse>
      </Box>

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
