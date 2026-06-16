'use client';

import { memo } from 'react';

import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import type { ModuleNodeData } from '../../hooks/useDependencyGraph';

/**
 * Couleurs selon le statut du module
 */
const statusColors = {
  standalone: {
    background: '#dcfce7', // green-100
    border: '#16a34a', // green-600
    text: '#166534', // green-800
  },
  hasDependencies: {
    background: '#fef3c7', // amber-100
    border: '#d97706', // amber-600
    text: '#92400e', // amber-800
  },
  critical: {
    background: '#fee2e2', // red-100
    border: '#dc2626', // red-600
    text: '#991b1b', // red-800
  },
};

/**
 * Labels des statuts en français
 */
const statusLabels = {
  standalone: 'Standalone',
  hasDependencies: 'A des dépendances',
  critical: 'Module critique',
};

/**
 * Composant de noeud personnalisé pour React Flow
 * Affiche un module avec ses informations de dépendances
 */
function ModuleNodeComponent({ data, selected }: NodeProps<ModuleNodeData>) {
  const colors = statusColors[data.status];
  const statusLabel = statusLabels[data.status];

  // Construire le contenu du tooltip
  const tooltipContent = (
    <Box sx={{ p: 1 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {data.label}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        {statusLabel}
      </Typography>

      {data.dependencies.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Dépendances ({data.dependencies.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {data.dependencies.map((dep) => (
              <Chip key={dep} label={dep} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
            ))}
          </Box>
        </Box>
      )}

      {data.dependents.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" fontWeight="bold">
            Modules dépendants ({data.dependents.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {data.dependents.map((dep) => (
              <Chip key={dep} label={dep} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} placement="right" arrow>
      <Box
        sx={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: colors.background,
          border: `2px solid ${colors.border}`,
          boxShadow: selected ? `0 0 0 2px ${colors.border}` : '0 1px 3px rgba(0,0,0,0.1)',
          minWidth: 150,
          maxWidth: 200,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: `0 4px 12px rgba(0,0,0,0.15)`,
            transform: 'translateY(-1px)',
          },
        }}
      >
        {/* Handle d'entrée (haut) */}
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: colors.border,
            width: 10,
            height: 10,
            border: '2px solid white',
          }}
        />

        {/* Contenu du noeud */}
        <Box sx={{ textAlign: 'center' }}>
          {/* Nom du module */}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: colors.text,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.label}
          </Typography>

          {/* Badges de compteurs */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
            {/* Badge dépendances */}
            <Chip
              label={`${data.dependencies.length} dép`}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                backgroundColor: data.dependencies.length > 0 ? '#fef3c7' : '#f1f5f9',
                color: data.dependencies.length > 0 ? '#92400e' : '#64748b',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />

            {/* Badge dépendants */}
            <Chip
              label={`${data.dependents.length} dep.`}
              size="small"
              sx={{
                fontSize: '0.65rem',
                height: 20,
                backgroundColor: data.dependents.length > 2 ? '#fee2e2' : '#f1f5f9',
                color: data.dependents.length > 2 ? '#991b1b' : '#64748b',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>
        </Box>

        {/* Handle de sortie (bas) */}
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: colors.border,
            width: 10,
            height: 10,
            border: '2px solid white',
          }}
        />
      </Box>
    </Tooltip>
  );
}

/**
 * Export mémoïsé pour optimiser les performances de React Flow
 */
export const ModuleNode = memo(ModuleNodeComponent);
