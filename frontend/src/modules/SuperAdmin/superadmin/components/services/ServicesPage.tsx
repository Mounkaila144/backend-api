'use client';

import React from 'react';

import { useRouter, useParams } from 'next/navigation';

import NextLink from 'next/link';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CardActionArea,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material';

import {
  SERVICE_LABELS,
  SERVICE_DESCRIPTIONS,
  SERVICE_EDITABLE,
} from '../../../types/service-config.types';
import type { ServiceType } from '../../../types/service-config.types';

/**
 * Liste des services disponibles
 */
const services: ServiceType[] = ['s3', 'resend', 'meilisearch'];

/**
 * Icônes pour chaque service
 */
const serviceIcons: Record<ServiceType, string> = {
  's3': 'tabler-cloud',
  'resend': 'tabler-mail',
  'meilisearch': 'tabler-search',
};

/**
 * Couleurs pour chaque service
 */
const serviceColors: Record<ServiceType, string> = {
  's3': '#ff9800',
  'resend': '#9c27b0',
  'meilisearch': '#00bcd4',
};

/**
 * Page de liste des services configurables
 */
export function ServicesPage() {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'fr';

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
        <Typography color="text.primary">Services</Typography>
      </Breadcrumbs>

      {/* Titre */}
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Configuration des Services
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Gérez la configuration des services externes de la plateforme.
      </Typography>

      {/* Grille des services */}
      <Grid container spacing={3}>
        {services.map((service) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={service}>
            <Card
              sx={{
                height: '100%',
                '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <CardActionArea
                onClick={() => router.push(`/${lang}/superadmin/services/${service}`)}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        bgcolor: `${serviceColors[service]}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <i
                        className={serviceIcons[service]}
                        style={{ fontSize: 28, color: serviceColors[service] }}
                      />
                    </Box>
                  </Box>

                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {SERVICE_LABELS[service]}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {SERVICE_DESCRIPTIONS[service]}
                  </Typography>

                  <Chip
                    label={SERVICE_EDITABLE[service] ? 'Modifiable' : 'Lecture seule'}
                    size="small"
                    color={SERVICE_EDITABLE[service] ? 'success' : 'default'}
                    variant="outlined"
                    icon={
                      <i
                        className={SERVICE_EDITABLE[service] ? 'tabler-edit' : 'tabler-lock'}
                        style={{ fontSize: 14 }}
                      />
                    }
                  />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
