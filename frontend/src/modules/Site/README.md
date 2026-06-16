# Module Site

Module de gestion des sites (tenants) pour le superadmin.

## Structure

```
src/modules/Site/
├── types/
│   └── site.types.ts          # Types TypeScript
├── superadmin/
│   ├── components/
│   │   ├── StatisticsCards.tsx    # Cartes de statistiques
│   │   ├── SitesTable.tsx         # Table de liste des sites
│   │   └── SiteFormModal.tsx      # Formulaire création/édition
│   ├── hooks/
│   │   ├── useSites.ts            # Hook pour la liste des sites
│   │   └── useSite.ts             # Hook pour un site individuel
│   └── services/
│       └── siteService.ts         # Service API
└── index.ts                       # Exports publics
```

## Fonctionnalités

### 1. Liste des sites
- Affichage paginé avec filtres
- Recherche par nom de domaine
- Tri et filtrage avancés
- Sélection multiple

### 2. Statistiques
- Total des sites
- Sites disponibles
- Nombre de clients
- Répartition par type (CRM, E-commerce, CMS)

### 3. Gestion CRUD
- **Créer** : Nouveau site avec configuration complète
- **Lire** : Détails complets d'un site
- **Mettre à jour** : Modification des paramètres
- **Supprimer** : Avec option de suppression de la base de données

### 4. Actions avancées
- **Test de connexion** : Vérifier la connexion à la base de données
- **Mise à jour de la taille** : Calculer la taille de la base de données
- **Toggle availability** : Activer/désactiver plusieurs sites en masse

## Endpoints API

Tous les endpoints sont préfixés par `/api/superadmin/sites`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Liste des sites (avec pagination et filtres) |
| POST | `/` | Créer un nouveau site |
| GET | `/{id}` | Détails d'un site |
| PUT | `/{id}` | Mettre à jour un site |
| DELETE | `/{id}` | Supprimer un site |
| GET | `/statistics` | Statistiques globales |
| POST | `/{id}/test-connection` | Tester la connexion DB |
| POST | `/{id}/update-size` | Mettre à jour la taille DB |
| POST | `/toggle-availability` | Toggle disponibilité (masse) |

## Utilisation

### Page de gestion

```typescript
import { useSites, useSite } from '@/src/modules/Site';

function SitesPage() {
  const { sites, meta, statistics, isLoading, refresh } = useSites();
  const { createSite, updateSite, deleteSite } = useSite();

  // ...
}
```

### Composants

```typescript
import {
  StatisticsCards,
  SitesTable,
  SiteFormModal,
} from '@/src/modules/Site';

<StatisticsCards statistics={statistics} isLoading={isLoading} />
<SitesTable sites={sites} isLoading={isLoading} onEdit={handleEdit} />
<SiteFormModal isOpen={isOpen} onSubmit={handleSubmit} mode="create" />
```

## Types principaux

### Site
Représente un site complet avec toutes ses propriétés :
- Informations générales (id, host, company)
- Configuration base de données
- Thèmes (admin et frontend)
- Disponibilité (site, admin, frontend)
- Assets (logo, banner, favicon)
- Métadonnées (prix, dernière connexion)

### SiteListItem
Version simplifiée pour l'affichage en liste

### CreateSiteData / UpdateSiteData
Données pour les opérations CRUD

## Accès

Ce module est accessible uniquement aux **superadmins** via :
- URL : `/superadmin/sites`
- Lien depuis le dashboard superadmin

## Dépendances

- `date-fns` : Formatage des dates
- `axios` : Requêtes HTTP
- API Laravel backend : Module Site
