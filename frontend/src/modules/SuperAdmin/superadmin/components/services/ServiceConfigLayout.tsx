'use client';

import React from 'react';

import NextLink from 'next/link';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Breadcrumbs,
  Link,
  Alert,
  Skeleton,
} from '@mui/material';

/**
 * Props du composant ServiceConfigLayout
 */
interface ServiceConfigLayoutProps {

  /** Titre de la page de configuration */
  title: string;

  /** Description du service */
  description: string;

  /** Contenu du formulaire */
  children: React.ReactNode;

  /** Indique si la configuration est en lecture seule */
  readOnly?: boolean;

  /** Indique si le contenu est en cours de chargement */
  isLoading?: boolean;

  /** Langue pour les liens (optionnel) */
  lang?: string;
}

/**
 * Layout réutilisable pour toutes les pages de configuration de services
 * Affiche les breadcrumbs, un alert si read-only, et le formulaire
 *
 * @example
 * ```tsx
 * <ServiceConfigLayout
 *   title="Configuration S3"
 *   description="Configuration du stockage de fichiers"
 *   readOnly={false}
 * >
 *   <S3ConfigForm config={config} onSave={handleSave} />
 * </ServiceConfigLayout>
 * ```
 */
export function ServiceConfigLayout({
  title,
  description,
  children,
  readOnly = false,
  isLoading = false,
  lang = 'fr',
}: ServiceConfigLayoutProps) {
  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component={NextLink}
          href={`/${lang}/superadmin/dashboard`}
          underline="hover"
          color="inherit"
        >
          SuperAdmin
        </Link>
        <Link
          component={NextLink}
          href={`/${lang}/superadmin/services`}
          underline="hover"
          color="inherit"
        >
          Services
        </Link>
        <Typography color="text.primary">{title}</Typography>
      </Breadcrumbs>

      {/* Titre et description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {/* Alert pour configuration read-only */}
      {readOnly && (
        <Alert
          severity="info"
          icon={<i className="tabler-info-circle" style={{ fontSize: 20 }} />}
          sx={{ mb: 3 }}
        >
          Cette configuration est gérée via les variables d&apos;environnement (.env).
          Les valeurs affichées sont en lecture seule. Pour modifier cette configuration,
          veuillez mettre à jour le fichier .env et redémarrer l&apos;application.
        </Alert>
      )}

      {/* Carte contenant le formulaire */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Skeleton variant="rectangular" height={56} />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Skeleton variant="rectangular" width={150} height={40} />
                <Skeleton variant="rectangular" width={150} height={40} />
              </Box>
            </Box>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
