# Dashboard Module

Le module Dashboard fournit une gestion complète des menus pour l'interface d'administration. Il remplace les anciens modules `MenuManager` et `MenuRegistry` avec une solution unifiée connectée au backend Laravel.

## Architecture

```
src/modules/Dashboard/
├── admin/
│   ├── components/     # Composants UI
│   │   ├── MenuList.tsx        # Liste hiérarchique des menus
│   │   ├── MenuForm.tsx        # Formulaire création/édition
│   │   ├── MenuManager.tsx     # Composant principal de gestion
│   │   ├── Sidebar.tsx         # Barre de navigation
│   │   └── index.ts
│   ├── hooks/          # Hooks React personnalisés
│   │   ├── useMenus.ts         # Gestion des menus (CRUD)
│   │   └── index.ts
│   ├── services/       # Services API
│   │   ├── menuService.ts      # Appels API vers Laravel
│   │   └── index.ts
│   └── index.ts
├── types/              # Types TypeScript
│   ├── menu.types.ts
│   └── index.ts
├── index.ts
└── README.md
```

## Fonctionnalités

### Gestion des Menus (CRUD)
- ✅ Créer de nouveaux menus
- ✅ Modifier les menus existants
- ✅ Supprimer des menus
- ✅ Réorganiser les menus (ordre)
- ✅ Créer des sous-menus (hiérarchie)
- ✅ Dupliquer des menus
- ✅ Basculer la visibilité
- ✅ Basculer l'état actif/inactif

### Hiérarchie
- Support des menus imbriqués (parent/enfant)
- Affichage en arborescence
- Déplacement de menus entre parents
- Construction automatique de la hiérarchie

### Permissions
- Support des permissions par menu
- Filtrage basé sur les droits utilisateur

## Installation

Le module est déjà intégré. Pour l'utiliser :

```typescript
import { MenuManager, Sidebar, useMenus } from '@/src/modules/Dashboard';
```

## Utilisation

### 1. Composant de Gestion (Admin)

```tsx
import { MenuManager } from '@/src/modules/Dashboard';

export default function MenusPage() {
  return <MenuManager />;
}
```

### 2. Barre de Navigation (Sidebar)

```tsx
import { Sidebar } from '@/src/modules/Dashboard';

export default function AdminLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <aside style={{ width: '250px' }}>
        <Sidebar />
      </aside>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
```

### 3. Hook useMenus

```tsx
import { useMenus } from '@/src/modules/Dashboard';

function MyComponent() {
  const {
    menus,          // Menus hiérarchiques
    flatMenus,      // Menus à plat
    isLoading,      // État de chargement
    error,          // Erreur éventuelle
    createMenu,     // Créer un menu
    updateMenu,     // Mettre à jour un menu
    deleteMenu,     // Supprimer un menu
    reorderMenus,   // Réorganiser les menus
    toggleVisibility, // Basculer la visibilité
    toggleActive,   // Basculer l'état actif
    moveMenu,       // Déplacer vers un parent
    duplicateMenu,  // Dupliquer un menu
    resetOrder,     // Réinitialiser l'ordre
    refresh,        // Rafraîchir les données
  } = useMenus();

  // Créer un nouveau menu
  const handleCreate = async () => {
    const newMenu = await createMenu({
      label: 'Nouveau Menu',
      path: '/admin/nouveau',
      order: 10,
      parent_id: null,
      is_active: true,
      is_visible: true,
    });
  };

  return <div>...</div>;
}
```

### 4. Hook useMenu (menu unique)

```tsx
import { useMenu } from '@/src/modules/Dashboard';

function MenuDetails({ menuId }: { menuId: string }) {
  const { menu, isLoading, error } = useMenu(menuId);

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!menu) return <div>Menu introuvable</div>;

  return (
    <div>
      <h2>{menu.label}</h2>
      <p>Path: {menu.path}</p>
    </div>
  );
}
```

## Types TypeScript

### MenuItem

```typescript
interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: MenuIcon;
  order: number;
  parent_id?: string | null;
  is_active: boolean;
  is_visible: boolean;
  module?: string;
  permission?: string | null;
  children?: MenuItem[];
  created_at?: string;
  updated_at?: string;
}
```

### MenuFormData

```typescript
interface MenuFormData {
  label: string;
  path?: string;
  icon?: MenuIcon;
  order: number;
  parent_id?: string | null;
  is_active: boolean;
  is_visible: boolean;
  module?: string;
  permission?: string | null;
}
```

### MenuIcon

```typescript
interface MenuIcon {
  type: 'svg' | 'emoji' | 'icon-class' | 'lucide';
  value: string;
}
```

## API Backend

Le module communique avec le backend Laravel via ces endpoints :

```
GET    /api/admin/menus              # Liste hiérarchique
GET    /api/admin/menus/flat         # Liste à plat
GET    /api/admin/menus/tree         # Arbre complet
GET    /api/admin/menus/{id}         # Menu spécifique
POST   /api/admin/menus              # Créer un menu
PUT    /api/admin/menus/{id}         # Mettre à jour
DELETE /api/admin/menus/{id}         # Supprimer
POST   /api/admin/menus/reorder      # Réorganiser
PATCH  /api/admin/menus/{id}/toggle-visibility  # Visibilité
PATCH  /api/admin/menus/{id}/toggle-active      # État actif
PATCH  /api/admin/menus/{id}/move              # Déplacer
POST   /api/admin/menus/{id}/duplicate         # Dupliquer
POST   /api/admin/menus/reset-order            # Reset ordre
```

## Configuration

### Multi-tenancy

Le module utilise automatiquement le `tenantId` du contexte :

```typescript
const { tenantId } = useTenant();
// Le tenantId est automatiquement ajouté aux appels API
```

### Authentification

Les tokens sont automatiquement injectés via `createApiClient()` :

```typescript
// Dans menuService.ts
const client = createApiClient(tenantId);
// Ajoute automatiquement: Authorization: Bearer {token}
// Ajoute automatiquement: X-Tenant-ID: {tenantId}
```

## Exemples d'Utilisation Avancée

### Créer un menu avec icône

```typescript
const menu = await createMenu({
  label: 'Dashboard',
  path: '/admin/dashboard',
  order: 1,
  is_active: true,
  is_visible: true,
  icon: {
    type: 'emoji',
    value: '📊',
  },
});
```

### Créer un sous-menu

```typescript
// D'abord créer le parent
const parent = await createMenu({
  label: 'Paramètres',
  order: 10,
  is_active: true,
  is_visible: true,
});

// Puis créer l'enfant
const child = await createMenu({
  label: 'Général',
  path: '/admin/settings/general',
  parent_id: parent.id,
  order: 1,
  is_active: true,
  is_visible: true,
});
```

### Réorganiser plusieurs menus

```typescript
await reorderMenus([
  { id: 'menu-1', order: 1, parent_id: null },
  { id: 'menu-2', order: 2, parent_id: null },
  { id: 'menu-3', order: 3, parent_id: 'menu-1' }, // Sous-menu
]);
```

## Migration depuis MenuManager/MenuRegistry

Si vous utilisiez les anciens modules, voici comment migrer :

### Avant (MenuRegistry)

```typescript
import { menuRegistryService } from '@/src/modules/MenuRegistry';

// Enregistrement statique
menuRegistryService.registerModule({
  module: 'Users',
  menuItems: [{ id: 'users', label: 'Users', path: '/admin/users', order: 1 }],
});

const menus = menuRegistryService.getAllMenuItems();
```

### Après (Dashboard)

```typescript
import { useMenus } from '@/src/modules/Dashboard';

function MyComponent() {
  const { menus, createMenu } = useMenus();

  // Les menus sont chargés depuis l'API Laravel
  // Plus besoin d'enregistrement manuel

  return <div>...</div>;
}
```

## Notes Importantes

1. **Tenant-aware** : Tous les appels API incluent le `X-Tenant-ID` header automatiquement
2. **Authentification** : Le token est injecté automatiquement depuis localStorage
3. **Hiérarchie** : Les menus sont construits automatiquement en arborescence
4. **Permissions** : Les permissions sont gérées côté backend et respectées côté frontend
5. **Cache** : Les menus sont rechargés après chaque opération CRUD pour garantir la cohérence

## Dépannage

### Les menus ne s'affichent pas

1. Vérifier que l'API backend répond correctement
2. Vérifier le `tenantId` dans le contexte
3. Vérifier le token d'authentification
4. Consulter la console pour les erreurs

### Erreur 401 Unauthorized

Le token a expiré ou est invalide. L'utilisateur sera redirigé vers la page de connexion automatiquement.

### Menus non ordonnés correctement

Utiliser la fonction `resetOrder()` pour réinitialiser l'ordre par défaut, puis réorganiser manuellement.

## Support

Pour toute question ou problème, consulter :
- `CLAUDE.md` - Instructions générales du projet
- `ARCHITECTURE.md` - Architecture détaillée
- `MODULES.md` - Guide des modules
