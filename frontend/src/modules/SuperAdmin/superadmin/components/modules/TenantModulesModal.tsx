'use client';

import React from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
} from '@mui/material';

import { TenantModulesView } from './TenantModulesView';

/**
 * Props du composant TenantModulesModal
 */
interface TenantModulesModalProps {

  /** Contrôle l'ouverture du modal */
  isOpen: boolean;

  /** Callback de fermeture du modal */
  onClose: () => void;

  /** ID du tenant */
  tenantId: number;

  /** Nom du tenant (pour l'affichage) */
  tenantName: string;
}

/**
 * Modal pour gérer les modules d'un tenant
 * Affiche TenantModulesView dans un Dialog Material-UI
 *
 * @example
 * ```tsx
 * <TenantModulesModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   tenantId={123}
 *   tenantName="example.com"
 * />
 * ```
 */
export function TenantModulesModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
}: TenantModulesModalProps) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          Gestion des modules
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <i className="tabler-x" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <TenantModulesView tenantId={tenantId} tenantName={tenantName} />
      </DialogContent>
    </Dialog>
  );
}
