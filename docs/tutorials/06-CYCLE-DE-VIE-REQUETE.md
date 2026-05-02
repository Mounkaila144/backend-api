# 6. Cycle de Vie d'une Requete (de bout en bout)

## Scenario : L'admin consulte la liste des contrats

L'utilisateur est connecte sur l'interface admin. Il clique sur "Contrats" dans le menu.
Suivons le parcours complet de la requete.

---

## Etape 1 : Le clic dans le frontend

```
[Navigateur]
L'utilisateur clique sur "Contrats" dans le menu lateral.
→ Le routeur Next.js navigue vers /fr/admin/contracts
→ Le composant ContractsPage se monte
→ useEffect() declenche le chargement des donnees
```

### Le composant appelle le service

```typescript
// Dans le composant de page
useEffect(() => {
    fetchContracts();
}, [page, filters]);

const fetchContracts = async () => {
    setLoading(true);
    const response = await contractService.getList({
        page: currentPage,
        nbitemsbypage: 10,
        search: searchTerm,
        sort_by: 'id',
        sort_order: 'desc',
    });
    setContracts(response.data);
    setMeta(response.meta);
    setLoading(false);
};
```

### Le service utilise le client API

```typescript
// services/contractService.ts
class ContractService {
    async getList(params: ListParams) {
        const response = await apiClient.get('/admin/contracts', { params });
        return response.data;
    }
}
```

---

## Etape 2 : L'intercepteur axios prepare la requete

**Fichier** : `src/shared/lib/api-client.ts`

```typescript
// AVANT que la requete parte, l'intercepteur ajoute les headers :

apiClient.interceptors.request.use((config) => {
    // 1. Token d'authentification
    const token = localStorage.getItem('auth_token');
    config.headers.Authorization = `Bearer ${token}`;
    //   → Authorization: Bearer 3|abc123xyz...

    // 2. Identifiant du tenant
    const tenantId = localStorage.getItem('tenant_id');
    config.headers['X-Tenant-ID'] = tenantId;
    //   → X-Tenant-ID: 3

    // 3. Langue
    const lang = localStorage.getItem('app_language');
    config.headers['Accept-Language'] = lang;
    //   → Accept-Language: fr

    return config;
});
```

### La requete HTTP finale

```
GET /api/admin/contracts?page=1&nbitemsbypage=10&sort_by=id&sort_order=desc
Host: localhost:8000
Authorization: Bearer 3|abc123xyz...
X-Tenant-ID: 3
Accept-Language: fr
```

---

## Etape 3 : Laravel recoit la requete

### 3a. Le routeur trouve la route

```php
// Modules/CustomersContracts/Routes/admin.php

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('contracts')->group(function () {
        Route::get('/', [ContractController::class, 'index'])
            ->middleware('credential:admin,superadmin,contract_list_view_all,...');
    });
});
```

Laravel identifie :
- **Route** : `GET /api/admin/contracts`
- **Middleware a executer** : `tenant` → `auth:sanctum` → `credential:admin,...`
- **Controleur** : `ContractController@index`

### 3b. Pipeline de middlewares

Les middlewares s'executent dans l'ordre, comme une pile de couches :

```
Requete HTTP entrante
    │
    ▼
┌─────────────────────────────────────────────┐
│  MIDDLEWARE 1 : SetLocale                    │
│  Lit Accept-Language: fr                     │
│  → app()->setLocale('fr')                    │
│  Maintenant toutes les traductions sont en FR│
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  MIDDLEWARE 2 : InitializeTenancy (tenant)   │
│  Lit X-Tenant-ID: 3                          │
│  → SELECT * FROM t_sites WHERE site_id = 3   │
│    (sur la base centrale site_dev1)          │
│  → Trouve: db_name="client_abc"              │
│  → Configure connexion "tenant" avec les     │
│    credentials du tenant                     │
│  → Toutes les requetes SQL sur "tenant"      │
│    iront vers "client_abc"                   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  MIDDLEWARE 3 : auth:sanctum                 │
│  Lit Authorization: Bearer 3|abc123xyz...    │
│  → Extrait l'ID du token: 3                  │
│  → SELECT * FROM personal_access_tokens      │
│    WHERE id = 3                              │
│    (sur la base TENANT, pas centrale !)      │
│  → Verifie le hash SHA-256                   │
│  → Verifie expires_at                        │
│  → Charge User WHERE id = tokenable_id       │
│  → $request->user() = User#42               │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│  MIDDLEWARE 4 : credential:admin,...          │
│  $user = $request->user()  // User#42        │
│  $user->hasCredential([                      │
│    'admin', 'superadmin',                    │
│    'contract_list_view_all', ...             │
│  ]) // logique OR                            │
│  → Charge les permissions (si pas en cache)  │
│  → L'utilisateur a "admin" → PASSE           │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
                  CONTROLEUR
```

---

## Etape 4 : Le controleur s'execute

```php
// Modules/CustomersContracts/Http/Controllers/Admin/ContractController.php

class ContractController extends Controller
{
    public function __construct(
        private ContractRepository $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        // 1. PARSER les parametres de la requete
        $filters = [
            'search'      => $request->input('search'),
            'state_id'    => $request->input('state_id'),
            'partner_id'  => $request->input('partner_id'),
            'sort_by'     => $request->input('sort_by', 'id'),
            'sort_order'  => $request->input('sort_order', 'desc'),
        ];
        $perPage = (int) $request->input('nbitemsbypage', 10);
        $lang = app()->getLocale(); // 'fr'

        // 2. DELEGUER au repository
        $contracts = $this->repository->getPaginated($filters, $perPage, $lang);

        // 3. TRANSFORMER avec la Resource
        $data = ContractListResource::collection($contracts->items());

        // 4. RETOURNER la reponse JSON normalisee
        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => [
                'current_page' => $contracts->currentPage(),
                'last_page'    => $contracts->lastPage(),
                'per_page'     => $contracts->perPage(),
                'total'        => $contracts->total(),
                'from'         => $contracts->firstItem(),
                'to'           => $contracts->lastItem(),
            ],
        ]);
    }
}
```

---

## Etape 5 : Le repository execute les requetes SQL

```php
// Modules/CustomersContracts/Repositories/ContractRepository.php

class ContractRepository
{
    public function getPaginated(array $filters, int $perPage, string $lang)
    {
        // Requete de base avec eager loading des relations
        $query = CustomerContract::query()
            ->with([
                'customer',              // Le client
                'partner',               // Le partenaire
                'status' => function ($q) use ($lang) {
                    $q->with(['translations' => function ($q2) use ($lang) {
                        $q2->where('lang', $lang);  // Traductions FR
                    }]);
                },
                'opcStatus.translations',
                'products',              // Les produits du contrat
            ]);

        // Appliquer les filtres
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('id', 'LIKE', "%{$search}%")
                  ->orWhereHas('customer', function ($q2) use ($search) {
                      $q2->where('firstname', 'LIKE', "%{$search}%")
                         ->orWhere('lastname', 'LIKE', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['state_id'])) {
            $query->where('state_id', $filters['state_id']);
        }

        // Tri
        $query->orderBy(
            $filters['sort_by'] ?? 'id',
            $filters['sort_order'] ?? 'desc'
        );

        // Pagination
        return $query->paginate($perPage);
    }
}
```

### Les requetes SQL generees

Laravel genere automatiquement les requetes suivantes :

```sql
-- 1. Compter le total (pour la pagination)
SELECT COUNT(*) FROM `t_customers_contracts`
WHERE ...;

-- 2. Recuperer la page demandee
SELECT * FROM `t_customers_contracts`
WHERE ...
ORDER BY `id` DESC
LIMIT 10 OFFSET 0;

-- 3. Eager loading des relations (evite le N+1)
SELECT * FROM `t_customers`
WHERE `id` IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

SELECT * FROM `t_partners_company`
WHERE `id` IN (5, 12);

SELECT * FROM `t_contract_status`
WHERE `id` IN (1, 2, 3);

SELECT * FROM `t_contract_status_i18n`
WHERE `status_id` IN (1, 2, 3) AND `lang` = 'fr';

-- etc. pour chaque relation eager-loadee
```

**L'eager loading est crucial** : sans lui, chaque contrat ferait une requete separee
pour charger son client, son partenaire, etc. Pour 10 contrats avec 5 relations,
ca ferait 50 requetes au lieu de 6.

---

## Etape 6 : La Resource transforme en JSON

```php
// Modules/CustomersContracts/Http/Resources/ContractListResource.php

class ContractListResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'reference'    => $this->reference,
            'created_at'   => $this->created_at,

            // Relation : client
            'customer'     => [
                'id'        => $this->customer?->id,
                'firstname' => $this->customer?->firstname,
                'lastname'  => $this->customer?->lastname,
                'full_name' => trim(($this->customer?->firstname ?? '') . ' ' . ($this->customer?->lastname ?? '')),
            ],

            // Relation : partenaire
            'partner'      => [
                'id'   => $this->partner?->id,
                'name' => $this->partner?->name,
            ],

            // Relation : statut (avec traduction)
            'status'       => [
                'id'   => $this->status?->id,
                'name' => $this->status?->translations?->first()?->name,
            ],

            // ... autres champs
        ];
    }
}
```

---

## Etape 7 : La reponse JSON finale

```json
{
    "success": true,
    "data": [
        {
            "id": 1234,
            "reference": "CTR-2025-001",
            "created_at": "2025-01-15",
            "customer": {
                "id": 42,
                "firstname": "Jean",
                "lastname": "Dupont",
                "full_name": "Jean Dupont"
            },
            "partner": {
                "id": 5,
                "name": "EcoEnergie SAS"
            },
            "status": {
                "id": 3,
                "name": "En cours"
            }
        },
        // ... 9 autres contrats
    ],
    "meta": {
        "current_page": 1,
        "last_page": 15,
        "per_page": 10,
        "total": 142,
        "from": 1,
        "to": 10
    }
}
```

---

## Etape 8 : Le frontend recoit et affiche

### L'intercepteur de reponse

```typescript
// Si tout va bien, la reponse passe directement
apiClient.interceptors.response.use(
    (response) => response, // Succes : rien a faire
    (error) => {
        if (error.response?.status === 401) {
            // Token expire → tenter refresh ou deconnecter
        }
        return Promise.reject(error);
    }
);
```

### Le composant affiche les donnees

```typescript
// Le composant recoit les donnees et les affiche dans un DataTable
function ContractsPage() {
    const [contracts, setContracts] = useState([]);
    const [meta, setMeta] = useState(null);

    useEffect(() => {
        fetchContracts();
    }, [page]);

    return (
        <DataTable
            data={contracts}
            columns={[
                { header: 'ID', accessorKey: 'id' },
                { header: 'Reference', accessorKey: 'reference' },
                { header: 'Client', accessorFn: (row) => row.customer?.full_name },
                { header: 'Partenaire', accessorFn: (row) => row.partner?.name },
                { header: 'Statut', accessorFn: (row) => row.status?.name },
            ]}
            pagination={{
                currentPage: meta?.current_page,
                lastPage: meta?.last_page,
                total: meta?.total,
            }}
            onPageChange={setPage}
        />
    );
}
```

---

## Nettoyage : apres la reponse

```
┌─────────────────────────────────────────────┐
│  Retour dans InitializeTenancy              │
│                                              │
│  tenancy()->end()                            │
│  → Purge la connexion "tenant"               │
│  → Revient a la base centrale                │
│  → Le prochain request repartira de zero     │
└─────────────────────────────────────────────┘
```

---

## Diagramme de sequence complet

```
Navigateur          Next.js           Axios            Laravel         MySQL
    │                  │                │                 │               │
    │ Clic "Contrats"  │                │                 │               │
    │─────────────────►│                │                 │               │
    │                  │ fetchContracts │                 │               │
    │                  │───────────────►│                 │               │
    │                  │                │ GET /api/admin  │               │
    │                  │                │ /contracts      │               │
    │                  │                │ + Token         │               │
    │                  │                │ + Tenant-ID     │               │
    │                  │                │────────────────►│               │
    │                  │                │                 │ SELECT t_sites│
    │                  │                │                 │──────────────►│
    │                  │                │                 │◄──────────────│
    │                  │                │                 │ Bascule DB    │
    │                  │                │                 │               │
    │                  │                │                 │ Verifie token │
    │                  │                │                 │──────────────►│
    │                  │                │                 │◄──────────────│
    │                  │                │                 │               │
    │                  │                │                 │ Verifie perms │
    │                  │                │                 │               │
    │                  │                │                 │ SELECT contrats│
    │                  │                │                 │──────────────►│
    │                  │                │                 │◄──────────────│
    │                  │                │                 │               │
    │                  │                │                 │ SELECT clients│
    │                  │                │                 │──────────────►│
    │                  │                │                 │◄──────────────│
    │                  │                │                 │               │
    │                  │                │  JSON response  │ tenancy->end()│
    │                  │                │◄────────────────│               │
    │                  │ setContracts() │                 │               │
    │                  │◄───────────────│                 │               │
    │  Affiche table   │                │                 │               │
    │◄─────────────────│                │                 │               │
    │                  │                │                 │               │
```

---

## Prochaine etape

**[07-FRONTEND-NEXTJS.md](07-FRONTEND-NEXTJS.md)** : Comprendre l'architecture frontend en detail.
