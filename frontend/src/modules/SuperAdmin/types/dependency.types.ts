/**
 * Types pour la gestion des dépendances entre modules
 */

/**
 * Nœud dans le graphe de dépendances
 */
export interface DependencyNode {

  /** Identifiant unique du nœud (nom technique du module) */
  id: string;

  /** Label affiché (nom du module) */
  label: string;

  /** Type de dépendance */
  type: 'module' | 'external';

  /** Statut du module */
  status: 'active' | 'inactive' | 'missing';

  /** Si cette dépendance est requise */
  required: boolean;
}

/**
 * Arête dans le graphe de dépendances
 */
export interface DependencyEdge {

  /** Module source (qui dépend) */
  from: string;

  /** Module cible (dépendance) */
  to: string;

  /** Si cette dépendance est obligatoire */
  required: boolean;
}

/**
 * Graphe complet de dépendances
 */
export interface DependencyGraph {

  /** Liste des nœuds */
  nodes: DependencyNode[];

  /** Liste des arêtes */
  edges: DependencyEdge[];
}

/**
 * Résultat de la résolution de dépendances
 */
export interface DependencyResolution {

  /** Si l'installation est possible */
  canInstall: boolean;

  /** Modules requis à installer en plus */
  requiredModules: string[];

  /** Dépendances manquantes (non disponibles) */
  missingDependencies: string[];

  /** Ordre d'installation recommandé (tri topologique) */
  installOrder: string[];

  /** Message d'erreur si canInstall = false */
  error?: string;
}

/**
 * Requête de résolution de dépendances
 */
export interface ResolveDependenciesRequest {

  /** Liste des modules à installer */
  modules: string[];
}

/**
 * Réponse API pour la résolution de dépendances
 */
export interface ResolveDependenciesResponse {
  success: boolean;
  data: DependencyResolution;
  message?: string;
}

/**
 * Réponse API pour le graphe de dépendances
 */
export interface DependencyGraphResponse {
  success: boolean;
  data: DependencyGraph;
  message?: string;
}

/**
 * Réponse API pour les modules dépendants
 */
export interface DependentModulesResponse {
  success: boolean;
  data: string[];
  message?: string;
}
