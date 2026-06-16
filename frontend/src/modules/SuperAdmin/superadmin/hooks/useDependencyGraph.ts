'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { Node, Edge } from '@xyflow/react';
import Dagre from 'dagre';

import { createApiClient } from '@/shared/lib/api-client';

/**
 * Type représentant un module dans le graphe de l'API
 */
interface ModuleGraphItem {
  name: string;
  dependencies: string[];
  dependents: string[];
}

/**
 * Réponse de l'API pour le graphe de dépendances
 */
interface DependencyGraphApiResponse {
  data: ModuleGraphItem[];
}

/**
 * Type de noeud personnalisé pour React Flow
 */
export interface ModuleNodeData {
  label: string;
  dependencies: string[];
  dependents: string[];
  status: 'standalone' | 'hasDependencies' | 'critical';
}

/**
 * Type de noeud React Flow pour les modules
 */
export type ModuleNode = Node<ModuleNodeData>;

/**
 * Interface de retour du hook useDependencyGraph
 */
interface UseDependencyGraphReturn {

  /** Données brutes du graphe */
  graph: ModuleGraphItem[];

  /** Noeuds formatés pour React Flow */
  nodes: ModuleNode[];

  /** Arêtes formatées pour React Flow */
  edges: Edge[];

  /** Indique si les données sont en cours de chargement */
  isLoading: boolean;

  /** Erreur survenue lors du chargement */
  error: Error | null;

  /** Fonction pour recharger les données */
  refresh: () => Promise<void>;
}

/**
 * Applique un layout automatique avec Dagre
 * @param nodes - Noeuds React Flow
 * @param edges - Arêtes React Flow
 * @returns Noeuds et arêtes avec positions calculées
 */
function getLayoutedElements(nodes: ModuleNode[], edges: Edge[]) {
  const g = new Dagre.graphlib.Graph();

  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => g.setNode(node.id, { width: 180, height: 60 }));
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90, // Centrer le node (width/2)
          y: nodeWithPosition.y - 30, // Centrer le node (height/2)
        },
      };
    }),
    edges,
  };
}

/**
 * Détermine le statut d'un module basé sur ses dépendances et dépendants
 * @param dependencies - Liste des dépendances
 * @param dependents - Liste des dépendants
 * @returns Statut du module
 */
function getModuleStatus(dependencies: string[], dependents: string[]): 'standalone' | 'hasDependencies' | 'critical' {
  // Module critique si plus de 2 dépendants
  if (dependents.length > 2) {
    return 'critical';
  }

  // Module avec dépendances
  if (dependencies.length > 0) {
    return 'hasDependencies';
  }

  // Module standalone
  return 'standalone';
}

/**
 * Hook personnalisé pour récupérer et transformer le graphe de dépendances
 *
 * @returns {UseDependencyGraphReturn} État du graphe et fonctions utilitaires
 *
 * @example
 * ```typescript
 * const { nodes, edges, isLoading, error, refresh } = useDependencyGraph();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Alert severity="error">{error.message}</Alert>;
 * return <ReactFlow nodes={nodes} edges={edges} />;
 * ```
 */
export function useDependencyGraph(): UseDependencyGraphReturn {
  const [graph, setGraph] = useState<ModuleGraphItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Charge les données du graphe depuis l'API
   */
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const client = createApiClient();
      const response = await client.get<DependencyGraphApiResponse>('/superadmin/modules/dependencies');

      if (response.data && Array.isArray(response.data.data)) {
        setGraph(response.data.data);
      } else {
        console.error('Invalid response format:', response.data);
        setGraph([]);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Erreur lors du chargement du graphe de dépendances');

      setError(errorObj);
      console.error('Error in useDependencyGraph:', errorObj);
      setGraph([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charge les données au montage
  useEffect(() => {
    refresh();
  }, [refresh]);

  /**
   * Transforme les données en noeuds React Flow
   */
  const rawNodes: ModuleNode[] = useMemo(() => {
    return graph.map((module, index) => ({
      id: module.name,
      type: 'moduleNode',
      position: { x: 0, y: index * 100 }, // Position temporaire, sera recalculée par Dagre
      data: {
        label: module.name,
        dependencies: module.dependencies,
        dependents: module.dependents,
        status: getModuleStatus(module.dependencies, module.dependents),
      },
    }));
  }, [graph]);

  /**
   * Transforme les données en arêtes React Flow
   */
  const rawEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];

    graph.forEach((module) => {
      // Créer des arêtes pour chaque dépendance
      module.dependencies.forEach((dep) => {
        edges.push({
          id: `${dep}-${module.name}`,
          source: dep,
          target: module.name,
          animated: false,
          style: { stroke: '#64748b', strokeWidth: 2 },
          markerEnd: {
            type: 'arrowclosed' as const,
            color: '#64748b',
          },
        });
      });
    });

    return edges;
  }, [graph]);

  /**
   * Noeuds et arêtes avec layout automatique
   */
  const { nodes, edges } = useMemo(() => {
    if (rawNodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    return getLayoutedElements(rawNodes, rawEdges);
  }, [rawNodes, rawEdges]);

  return {
    graph,
    nodes,
    edges,
    isLoading,
    error,
    refresh,
  };
}
