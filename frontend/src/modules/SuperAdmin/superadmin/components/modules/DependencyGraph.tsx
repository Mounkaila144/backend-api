'use client';

import { useCallback, useMemo } from 'react';

import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type OnNodeClick,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { ModuleNode } from './ModuleNode';
import { useDependencyGraph, type ModuleNode as ModuleNodeType } from '../../hooks/useDependencyGraph';

/**
 * Props du composant DependencyGraph
 */
interface DependencyGraphProps {

  /** Callback appelé lors du clic sur un noeud */
  onNodeClick?: (moduleName: string) => void;

  /** Nom du module à mettre en surbrillance */
  highlightModule?: string;

  /** Hauteur du conteneur (défaut: 100%) */
  height?: string | number;
}

/**
 * Types de noeuds personnalisés pour React Flow
 */
const nodeTypes = {
  moduleNode: ModuleNode,
};

/**
 * Couleurs pour la minimap selon le statut
 */
const minimapNodeColor = (node: ModuleNodeType) => {
  const status = node.data?.status;

  switch (status) {
    case 'critical':
      return '#dc2626'; // red-600
    case 'hasDependencies':
      return '#d97706'; // amber-600
    case 'standalone':
      return '#16a34a'; // green-600
    default:
      return '#64748b'; // slate-500
  }
};

/**
 * Composant de visualisation du graphe de dépendances des modules
 *
 * Utilise React Flow pour afficher un graphe interactif avec:
 * - Noeuds personnalisés (ModuleNode)
 * - Layout automatique (Dagre)
 * - Contrôles de zoom/pan
 * - Minimap
 *
 * @example
 * ```tsx
 * <DependencyGraph
 *   onNodeClick={(moduleName) => console.log('Clicked:', moduleName)}
 *   highlightModule="Customer"
 * />
 * ```
 */
export function DependencyGraph({ onNodeClick, highlightModule, height = '100%' }: DependencyGraphProps) {
  const { nodes: initialNodes, edges: initialEdges, isLoading, error, refresh } = useDependencyGraph();

  // États React Flow
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Mettre à jour les noeuds quand les données changent
  useMemo(() => {
    if (initialNodes.length > 0) {
      // Appliquer la surbrillance si un module est spécifié
      const nodesWithHighlight = initialNodes.map((node) => ({
        ...node,
        selected: highlightModule === node.id,
        style: highlightModule === node.id ? { zIndex: 1000 } : undefined,
      }));

      setNodes(nodesWithHighlight);
    }
  }, [initialNodes, highlightModule, setNodes]);

  useMemo(() => {
    if (initialEdges.length > 0) {
      // Mettre en surbrillance les arêtes liées au module sélectionné
      const edgesWithHighlight = initialEdges.map((edge) => ({
        ...edge,
        animated: highlightModule ? edge.source === highlightModule || edge.target === highlightModule : false,
        style: {
          ...edge.style,
          stroke:
            highlightModule && (edge.source === highlightModule || edge.target === highlightModule)
              ? '#3b82f6'
              : '#64748b',
          strokeWidth:
            highlightModule && (edge.source === highlightModule || edge.target === highlightModule) ? 3 : 2,
        },
      }));

      setEdges(edgesWithHighlight);
    }
  }, [initialEdges, highlightModule, setEdges]);

  /**
   * Gestionnaire de clic sur un noeud
   */
  const handleNodeClick: OnNodeClick = useCallback(
    (_, node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  // Affichage du chargement
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          Chargement du graphe de dépendances...
        </Typography>
      </Box>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Typography
              variant="body2"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => refresh()}
            >
              Réessayer
            </Typography>
          }
        >
          {error.message}
        </Alert>
      </Box>
    );
  }

  // Affichage si aucun module
  if (nodes.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          gap: 2,
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Aucun module disponible
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Le graphe de dépendances est vide.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
      >
        {/* Contrôles de zoom */}
        <Controls showInteractive={false} />

        {/* Minimap */}
        <MiniMap nodeColor={minimapNodeColor} nodeStrokeWidth={3} zoomable pannable />

        {/* Grille de fond */}
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
      </ReactFlow>
    </Box>
  );
}
