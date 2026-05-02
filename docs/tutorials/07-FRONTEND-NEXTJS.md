# 7. Frontend Next.js : Architecture Complete

## C'est quoi Next.js ?

Next.js est un framework React qui ajoute :
- **Routing automatique** : les fichiers dans `app/` deviennent des routes
- **Server-Side Rendering (SSR)** : le HTML est genere cote serveur (plus rapide, meilleur SEO)
- **App Router** (Next.js 13+) : le systeme de routing utilise dans ce projet
- **Middleware** : du code qui s'execute entre la requete et la page

---

## Structure de l'App Router

```
src/app/
├── api/
│   └── auth/
│       └── [...nextauth]/        # NextAuth.js (gestion de sessions)
│           └── route.ts
│
├── [lang]/                        # Parametre dynamique : fr, en, ar
│   │
│   ├── layout.tsx                 # Layout RACINE (wraps tout)
│   │                              # Contient tous les Providers
│   │
│   ├── admin/                     # Toutes les pages admin
│   │   ├── layout.tsx             # Layout admin (sidebar + navbar)
│   │   ├── login/
│   │   │   └── page.tsx           # Page de login admin
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Tableau de bord
│   │   ├── users/
│   │   │   └── page.tsx           # Gestion utilisateurs
│   │   └── [...slug]/             # CATCH-ALL : routes dynamiques
│   │       └── page.tsx           # Charge le bon module selon l'URL
│   │
│   ├── superadmin/                # Toutes les pages superadmin
│   │   ├── layout.tsx             # Layout superadmin
│   │   └── [...slug]/             # Catch-all superadmin
│   │       └── page.tsx
│   │
│   └── [...not-found]/            # Page 404
│
└── middleware.ts                   # Middleware Next.js (i18n, redirections)
```

### Comment le routing fonctionne

Quand vous naviguez vers `/fr/admin/users` :

1. Next.js matche `[lang]` → `lang = "fr"`
2. Descend dans `admin/`
3. Trouve `users/page.tsx` → charge cette page
4. Applique les layouts en cascade : `[lang]/layout.tsx` → `admin/layout.tsx` → `page.tsx`

Pour `/fr/admin/contracts` (pas de dossier `contracts/`) :

1. Next.js matche `[lang]` → `lang = "fr"`
2. Descend dans `admin/`
3. Pas de dossier `contracts/` → tombe dans `[...slug]/page.tsx`
4. `slug = ["contracts"]` → le catch-all charge le module CustomersContracts dynamiquement

---

## Le parametre `[lang]` : internationalisation

**Fichier** : `middleware.ts`

Ce middleware intercepte TOUTES les requetes :

```typescript
export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Detecter la langue dans l'URL
    const locale = pathname.split('/')[1]; // "fr", "en", "ar"

    // Si pas de langue → rediriger vers /fr/...
    if (!['fr', 'en', 'ar'].includes(locale)) {
        return NextResponse.redirect(new URL(`/fr${pathname}`, request.url));
    }

    // Ajouter le contexte (admin ou superadmin) dans un header
    if (pathname.includes('/admin/')) {
        request.headers.set('X-Context', 'admin');
    } else if (pathname.includes('/superadmin/')) {
        request.headers.set('X-Context', 'superadmin');
    }

    return NextResponse.next();
}
```

**Langues supportees** :
- `fr` (francais) - par defaut
- `en` (anglais)
- `ar` (arabe) - avec support **RTL** (right-to-left)

---

## Les Layouts (emboitement)

Next.js utilise un systeme de **layouts imbriques**. Chaque `layout.tsx` wrap les pages enfants.

### Layout racine : `src/app/[lang]/layout.tsx`

```
┌─────────────────────────────────────────────────────┐
│ Layout Racine [lang]/layout.tsx                      │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │ TranslationWrapper (traductions serveur)         │ │
│  │  ┌───────────────────────────────────────────┐  │ │
│  │  │ ClientProviders (tous les contexts React) │  │ │
│  │  │  ├── LanguageProvider                     │  │ │
│  │  │  ├── TranslationProvider                  │  │ │
│  │  │  ├── TenantProvider                       │  │ │
│  │  │  ├── PermissionsProvider                  │  │ │
│  │  │  ├── SidebarProvider                      │  │ │
│  │  │  ├── ThemeProvider (MUI)                  │  │ │
│  │  │  └── ReduxProvider                        │  │ │
│  │  │                                           │  │ │
│  │  │       {children} ← Le layout admin        │  │ │
│  │  │                    ou superadmin           │  │ │
│  │  └───────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Layout admin : `src/app/[lang]/admin/layout.tsx`

```
┌─────────────────────────────────────────────────────┐
│ Layout Admin admin/layout.tsx                        │
│                                                      │
│  ┌──────────┐  ┌────────────────────────────────┐   │
│  │ Sidebar  │  │ Zone principale                 │   │
│  │          │  │                                  │   │
│  │ Menu     │  │  ┌────────────────────────────┐ │   │
│  │ - Accueil│  │  │ Navbar (header)             │ │   │
│  │ - Users  │  │  │ [Titre] [Recherche] [User]  │ │   │
│  │ - Contrats│ │  └────────────────────────────┘ │   │
│  │ - etc.   │  │                                  │   │
│  │          │  │  ┌────────────────────────────┐ │   │
│  │          │  │  │                             │ │   │
│  │          │  │  │     {children}              │ │   │
│  │          │  │  │     ← La page reelle        │ │   │
│  │          │  │  │     (users, contracts...)   │ │   │
│  │          │  │  │                             │ │   │
│  │          │  │  └────────────────────────────┘ │   │
│  │          │  │                                  │   │
│  │          │  │  ┌────────────────────────────┐ │   │
│  │          │  │  │ Footer                      │ │   │
│  │          │  │  └────────────────────────────┘ │   │
│  └──────────┘  └────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Les Providers (contextes React)

Les Providers sont des composants qui fournissent des donnees a TOUS les composants enfants
via le Context API de React. C'est comme des "variables globales" propres.

### Hierarchie des Providers

```typescript
// Simplifie - ordre d'imbrication
<LanguageProvider>        // Langue actuelle (fr, en, ar)
  <TranslationProvider>   // Fonctions de traduction t('key')
    <TenantProvider>      // ID et domaine du tenant actuel
      <PermissionsProvider> // Permissions de l'utilisateur
        <SidebarProvider>   // Etat du menu (ouvert/ferme)
          <ThemeProvider>   // Theme MUI (couleurs, mode sombre)
            <ReduxProvider> // Store Redux (minimal)
              {children}    // Votre page
            </ReduxProvider>
          </ThemeProvider>
        </SidebarProvider>
      </PermissionsProvider>
    </TenantProvider>
  </TranslationProvider>
</LanguageProvider>
```

### TenantProvider en detail

```typescript
// src/shared/lib/tenant-context.tsx

function TenantProvider({ children }) {
    const [tenantId, setTenantId] = useState<string | null>(null);
    const [domain, setDomain] = useState<string | null>(null);

    // Au chargement : lire depuis localStorage
    useEffect(() => {
        const storedId = localStorage.getItem('tenant_id');
        const storedDomain = localStorage.getItem('tenant_domain');

        setTenantId(storedId);
        setDomain(storedDomain || window.location.hostname);
    }, []);

    // Quand le tenant change : sauvegarder
    const updateTenant = (id: string, dom: string) => {
        setTenantId(id);
        setDomain(dom);
        localStorage.setItem('tenant_id', id);
        localStorage.setItem('tenant_domain', dom);
    };

    return (
        <TenantContext.Provider value={{ tenantId, domain, updateTenant }}>
            {children}
        </TenantContext.Provider>
    );
}
```

**Usage** :
```typescript
function MonComposant() {
    const { tenantId } = useTenant();
    // tenantId est disponible partout dans l'application
}
```

---

## Les Modules Frontend

Chaque module frontend est un miroir de son equivalent backend.

### Structure d'un module frontend

```
src/modules/CustomersContracts/
├── admin/
│   ├── components/
│   │   ├── ContractList.tsx        # Composant tableau des contrats
│   │   ├── ContractForm.tsx        # Formulaire creation/edition
│   │   ├── ContractDetail.tsx      # Vue detail d'un contrat
│   │   └── ContractFilters.tsx     # Filtres de recherche
│   │
│   ├── hooks/
│   │   ├── useContracts.ts         # Hook pour charger les contrats
│   │   └── useContractForm.ts      # Hook pour le formulaire
│   │
│   ├── services/
│   │   └── contractService.ts      # Appels API (CRUD)
│   │
│   ├── config/
│   │   └── columns.ts             # Configuration des colonnes du tableau
│   │
│   └── init.ts                     # Point d'entree du module
│
├── types/
│   └── contract.types.ts          # Types TypeScript
│
├── translations/
│   ├── fr.json                    # Traductions francaises
│   └── en.json                    # Traductions anglaises
│
├── menu.config.ts                  # Configuration du menu lateral
│
└── index.ts                        # Barrel export
```

### Correspondance Backend ↔ Frontend

| Backend | Frontend |
|---------|----------|
| `Entities/CustomerContract.php` | `types/contract.types.ts` |
| `Http/Controllers/Admin/ContractController.php` | `admin/services/contractService.ts` |
| `Repositories/ContractRepository.php` | (pas d'equivalent, c'est cote backend) |
| `Http/Resources/ContractListResource.php` | `admin/config/columns.ts` |
| `Routes/admin.php` | `admin/init.ts` (route registration) |

---

## Le client API (axios)

**Fichier** : `src/shared/lib/api-client.ts`

C'est le point central de communication avec le backend :

```typescript
import axios from 'axios';

// Creer une instance axios configuree
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// INTERCEPTEUR DE REQUETE (avant chaque appel)
apiClient.interceptors.request.use((config) => {
    // Token
    const token = getToken(); // auth_token ou superadmin_auth_token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Tenant ID (sauf superadmin)
    if (!isSuperadminContext()) {
        const tenantId = getTenantId();
        if (tenantId) {
            config.headers['X-Tenant-ID'] = tenantId;
        }
    }

    // Langue
    config.headers['Accept-Language'] = getLanguage();

    return config;
});

// INTERCEPTEUR DE REPONSE (apres chaque reponse)
apiClient.interceptors.response.use(
    (response) => response, // Succes → passer

    async (error) => {
        // 401 = token expire
        if (error.response?.status === 401 && !error.config._retry) {
            error.config._retry = true;

            // Tenter de rafraichir le token
            const newToken = await refreshToken();
            if (newToken) {
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(error.config); // Rejouer la requete
            }

            // Echec → deconnexion
            logout();
        }

        return Promise.reject(error);
    }
);
```

### Comment les appels API sont faits dans les services

```typescript
// src/modules/Users/admin/services/userService.ts

class UserService {
    // Liste paginee
    async getList(params: {
        page?: number;
        nbitemsbypage?: number;
        search?: string;
        sort_by?: string;
    }) {
        const response = await apiClient.get('/admin/users', { params });
        return response.data; // { success, data, meta }
    }

    // Detail
    async getById(id: number) {
        const response = await apiClient.get(`/admin/users/${id}`);
        return response.data; // { success, data }
    }

    // Creation
    async create(data: CreateUserDTO) {
        const response = await apiClient.post('/admin/users', data);
        return response.data; // { success, data, message }
    }

    // Mise a jour
    async update(id: number, data: UpdateUserDTO) {
        const response = await apiClient.put(`/admin/users/${id}`, data);
        return response.data;
    }

    // Suppression
    async delete(id: number) {
        const response = await apiClient.delete(`/admin/users/${id}`);
        return response.data;
    }
}

export const userService = new UserService();
```

---

## Le DataTable (TanStack React Table)

Le composant DataTable est un wrapper autour de TanStack React Table.

```typescript
// src/components/shared/DataTable/DataTable.tsx

function DataTable({
    data,          // Les donnees a afficher
    columns,       // Configuration des colonnes
    pagination,    // Infos de pagination du backend
    onPageChange,  // Callback quand on change de page
    onSort,        // Callback quand on trie
    isLoading,     // Afficher un spinner ?
}) {
    // TanStack React Table gere :
    // - Le tri (cliquer sur un header)
    // - La visibilite des colonnes (montrer/cacher)
    // - La pagination (navigation entre pages)
    // - Le responsive (mode carte sur mobile)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        // La pagination est geree cote SERVEUR (pas client)
        manualPagination: true,
        manualSorting: true,
        pageCount: pagination.lastPage,
    });

    return (
        <>
            {/* Affichage desktop : tableau classique */}
            <table>
                <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map(header => (
                                <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                                    {header.column.columnDef.header}
                                    {header.column.getIsSorted() ? ' ↑↓' : ''}
                                </th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <td key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Pagination */}
            <Pagination
                currentPage={pagination.currentPage}
                lastPage={pagination.lastPage}
                total={pagination.total}
                onPageChange={onPageChange}
            />
        </>
    );
}
```

### Pagination cote serveur

**Important** : la pagination est **cote serveur** (pas cote client).

```
Page 1 → GET /api/admin/users?page=1&nbitemsbypage=10
         → Backend retourne 10 users + meta { total: 142, last_page: 15 }

Page 2 → GET /api/admin/users?page=2&nbitemsbypage=10
         → Backend retourne les 10 suivants

Le frontend n'a JAMAIS toutes les donnees en memoire.
C'est indispensable pour des tables avec des milliers de lignes.
```

---

## Gestion de l'etat (State Management)

Le projet utilise une approche **hybride** :

| Outil | Usage | Exemples |
|-------|-------|----------|
| **React Context** | Donnees globales partagees | Permissions, Tenant, Langue, Theme |
| **localStorage** | Persistance entre sessions | Token, User, Permissions, Langue |
| **Redux** | Etat global complexe | Minimal dans ce projet (app state) |
| **useState/useEffect** | Etat local des composants | Donnees de page, loading, filtres |

**Pas de Redux Toolkit Query ni React Query** : les appels API sont geres manuellement
avec axios + useState. C'est plus simple mais demande plus de code repetitif.

---

## Prochaine etape

**[08-PATTERNS-ET-CONVENTIONS.md](08-PATTERNS-ET-CONVENTIONS.md)** : Les patterns de code
et conventions utilises dans tout le projet.
