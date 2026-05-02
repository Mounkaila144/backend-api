# 10. Guide Pratique : Operations Courantes

## A. Ajouter un nouveau module complet (Backend + Frontend)

### Scenario : creer un module "Invoices" (Factures)

#### Etape 1 : Creer le module backend

```bash
# Utiliser le script automatique
.\create-module.ps1 Invoices

# OU manuellement :
php artisan module:make Invoices
```

#### Etape 2 : Creer le modele (Entity)

```php
// Modules/Invoices/Entities/Invoice.php

namespace Modules\Invoices\Entities;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_invoices';       // Table existante Symfony 1
    public $timestamps = false;

    protected $fillable = [
        'contract_id',
        'amount',
        'status',
        'invoice_date',
        'due_date',
    ];

    // Relations
    public function contract()
    {
        return $this->belongsTo(
            \Modules\CustomersContracts\Entities\CustomerContract::class,
            'contract_id'
        );
    }
}
```

#### Etape 3 : Creer le repository

```php
// Modules/Invoices/Repositories/InvoiceRepository.php

namespace Modules\Invoices\Repositories;

use Modules\Invoices\Entities\Invoice;

class InvoiceRepository
{
    public function getPaginated(array $filters, int $perPage = 10)
    {
        $query = Invoice::query()->with(['contract.customer']);

        if (!empty($filters['search'])) {
            $query->where('id', 'LIKE', "%{$filters['search']}%");
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query
            ->orderBy($filters['sort_by'] ?? 'id', $filters['sort_order'] ?? 'desc')
            ->paginate($perPage);
    }

    public function findById(int $id): ?Invoice
    {
        return Invoice::with(['contract.customer'])->find($id);
    }

    public function create(array $data): Invoice
    {
        return Invoice::create($data);
    }

    public function update(int $id, array $data): Invoice
    {
        $invoice = Invoice::findOrFail($id);
        $invoice->update($data);
        return $invoice->fresh();
    }

    public function delete(int $id): bool
    {
        return Invoice::findOrFail($id)->delete();
    }
}
```

#### Etape 4 : Creer la Resource

```php
// Modules/Invoices/Http/Resources/InvoiceResource.php

namespace Modules\Invoices\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'           => $this->id,
            'contract_id'  => $this->contract_id,
            'amount'       => (float) $this->amount,
            'status'       => $this->status,
            'invoice_date' => $this->invoice_date,
            'due_date'     => $this->due_date,
            'contract'     => [
                'id'        => $this->contract?->id,
                'reference' => $this->contract?->reference,
                'customer'  => $this->contract?->customer?->lastname,
            ],
        ];
    }
}
```

#### Etape 5 : Creer le controleur admin

```php
// Modules/Invoices/Http/Controllers/Admin/InvoiceController.php

namespace Modules\Invoices\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Invoices\Http\Resources\InvoiceResource;
use Modules\Invoices\Repositories\InvoiceRepository;

class InvoiceController extends Controller
{
    public function __construct(
        private InvoiceRepository $repository
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filters = [
            'search'     => $request->input('search'),
            'status'     => $request->input('status'),
            'sort_by'    => $request->input('sort_by', 'id'),
            'sort_order' => $request->input('sort_order', 'desc'),
        ];
        $perPage = (int) $request->input('nbitemsbypage', 10);

        $invoices = $this->repository->getPaginated($filters, $perPage);

        return response()->json([
            'success' => true,
            'data'    => InvoiceResource::collection($invoices->items()),
            'meta'    => [
                'current_page' => $invoices->currentPage(),
                'last_page'    => $invoices->lastPage(),
                'per_page'     => $invoices->perPage(),
                'total'        => $invoices->total(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $invoice = $this->repository->findById($id);

        if (!$invoice) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => new InvoiceResource($invoice),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contract_id'  => 'required|integer',
            'amount'       => 'required|numeric|min:0',
            'status'       => 'required|string',
            'invoice_date' => 'required|date',
            'due_date'     => 'nullable|date|after:invoice_date',
        ]);

        $invoice = $this->repository->create($validated);

        return response()->json([
            'success' => true,
            'data'    => new InvoiceResource($invoice),
            'message' => 'Invoice created successfully',
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'amount'       => 'nullable|numeric|min:0',
            'status'       => 'nullable|string',
            'due_date'     => 'nullable|date',
        ]);

        $invoice = $this->repository->update($id, $validated);

        return response()->json([
            'success' => true,
            'data'    => new InvoiceResource($invoice),
            'message' => 'Invoice updated successfully',
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->repository->delete($id);

        return response()->json([
            'success' => true,
            'message' => 'Invoice deleted successfully',
        ], 200);
    }
}
```

#### Etape 6 : Definir les routes

```php
// Modules/Invoices/Routes/admin.php

use Modules\Invoices\Http\Controllers\Admin\InvoiceController;

Route::prefix('api/admin')->middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::prefix('invoices')->name('admin.invoices.')->group(function () {
        Route::get('/', [InvoiceController::class, 'index'])
            ->middleware('credential:admin,superadmin,billing_view')
            ->name('index');

        Route::get('/{id}', [InvoiceController::class, 'show'])
            ->middleware('credential:admin,superadmin,billing_view')
            ->name('show');

        Route::post('/', [InvoiceController::class, 'store'])
            ->middleware('credential:admin,superadmin,billing_edit')
            ->name('store');

        Route::put('/{id}', [InvoiceController::class, 'update'])
            ->middleware('credential:admin,superadmin,billing_edit')
            ->name('update');

        Route::delete('/{id}', [InvoiceController::class, 'destroy'])
            ->middleware('credential:admin,superadmin')
            ->name('destroy');
    });
});
```

#### Etape 7 : Creer le module frontend

```
src/modules/Invoices/
├── admin/
│   ├── components/
│   │   └── InvoiceList.tsx
│   ├── hooks/
│   │   └── useInvoices.ts
│   └── services/
│       └── invoiceService.ts
├── types/
│   └── invoice.types.ts
└── index.ts
```

```typescript
// types/invoice.types.ts
export interface Invoice {
    id: number;
    contract_id: number;
    amount: number;
    status: string;
    invoice_date: string;
    due_date: string | null;
    contract?: {
        id: number;
        reference: string;
        customer: string;
    };
}

// services/invoiceService.ts
import { apiClient } from '@/shared/lib/api-client';

class InvoiceService {
    async getList(params?: Record<string, any>) {
        const response = await apiClient.get('/admin/invoices', { params });
        return response.data;
    }

    async getById(id: number) {
        const response = await apiClient.get(`/admin/invoices/${id}`);
        return response.data;
    }

    async create(data: Partial<Invoice>) {
        const response = await apiClient.post('/admin/invoices', data);
        return response.data;
    }

    async update(id: number, data: Partial<Invoice>) {
        const response = await apiClient.put(`/admin/invoices/${id}`, data);
        return response.data;
    }

    async delete(id: number) {
        const response = await apiClient.delete(`/admin/invoices/${id}`);
        return response.data;
    }
}

export const invoiceService = new InvoiceService();
```

#### Etape 8 : Verifier

```bash
# Backend : verifier que les routes sont enregistrees
php artisan route:list --path=invoices

# Backend : tester avec curl
curl -H "X-Tenant-ID: 1" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8000/api/admin/invoices
```

---

## B. Deboguer un probleme courant

### Probleme : "Tenant not found" (404)

```
Cause : Le header X-Tenant-ID n'est pas envoye ou le tenant n'existe pas.

Verification :
1. Ouvrir les DevTools du navigateur → Network
2. Cliquer sur la requete qui echoue
3. Verifier l'onglet "Headers" :
   - X-Tenant-ID est-il present ?
   - Quelle valeur a-t-il ?
4. Verifier dans la base centrale :
   SELECT * FROM t_sites WHERE site_id = [valeur];
   - La ligne existe-t-elle ?
   - site_available = 'YES' ?
```

### Probleme : "Unauthenticated" (401)

```
Causes possibles :
1. Token expire → Le refresh a echoue
2. Token dans mauvaise base → Le middleware tenant est apres auth:sanctum
3. Token invalide → L'utilisateur a ete supprime

Verification :
1. localStorage.getItem('auth_token') → le token existe ?
2. Le header Authorization est-il present dans la requete ?
3. Verifier l'ordre des middlewares : tenant AVANT auth:sanctum
4. Dans tinker :
   $token = PersonalAccessToken::findToken('votre-token');
   dd($token); // null = token invalide
```

### Probleme : "Insufficient permissions" (403)

```
Verification :
1. Quel credential est requis ? Regarder la route dans admin.php
   ->middleware('credential:admin,superadmin,billing_view')

2. L'utilisateur a-t-il ce credential ?
   En tinker :
   $user = User::find(42);
   $user->getAllPermissions()->pluck('name');
   $user->hasCredential('billing_view'); // true/false ?

3. Verifier les groupes :
   $user->groups->pluck('name');
   $user->groups->first()->permissions->pluck('name');
```

### Probleme : Requete SQL lente

```bash
# Activer le log de requetes
# Dans le controleur, temporairement :
DB::enableQueryLog();
// ... votre code ...
Log::info(DB::getQueryLog());

# Verifier les N+1 :
# Si vous voyez 50 requetes identiques avec des ID differents,
# c'est un N+1. Ajoutez ->with(['relation']) dans la requete.

# Voir les logs en temps reel :
php artisan pail --timeout=0
```

---

## C. Commandes utiles au quotidien

### Developpement

```bash
# Lancer tout l'environnement de dev
composer dev
# Lance en parallele : server, queue, log viewer

# OU lancer individuellement :
php artisan serve              # API sur port 8000
php artisan queue:listen       # Worker de queue
php artisan pail --timeout=0   # Viewer de logs temps reel
```

### Exploration

```bash
# Lister toutes les routes
php artisan route:list

# Filtrer par module
php artisan route:list --path=admin/contracts

# Lister les modules
php artisan module:list

# Ouvrir le REPL
php artisan tinker
```

### Qualite de code

```bash
# Formatter le code (Laravel Pint)
./vendor/bin/pint

# Formatter un fichier specifique
./vendor/bin/pint Modules/Invoices/Http/Controllers/Admin/InvoiceController.php

# Lancer les tests
php artisan test

# Tests d'un fichier specifique
php artisan test tests/Feature/AuthTest.php
```

### Cache

```bash
# Vider TOUT le cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Ou tout d'un coup :
php artisan optimize:clear
```

---

## D. Checklist pour toute modification

Avant de considerer votre travail comme termine, verifiez :

- [ ] **Le controleur est mince** : validation → delegation → reponse
- [ ] **Les requetes SQL sont dans le Repository**, pas dans le controleur
- [ ] **La transformation JSON est dans la Resource**, pas dans le controleur
- [ ] **Les routes ont les bons middlewares** :
  - Admin : `['tenant', 'auth:sanctum']` + `credential:...`
  - Superadmin : `['auth:sanctum']` (PAS de tenant !)
  - Frontend : `['tenant']` (+ optionnellement `auth:sanctum`)
- [ ] **Les ENUM sont corrects** : verifie dans le schema SQL
- [ ] **L'eager loading est en place** : pas de N+1
- [ ] **Le format JSON est standard** : `{ success, data, meta }`
- [ ] **Les permissions sont verifiees** : middleware credential sur la route
- [ ] **Pas de mot de passe** ni donnee sensible dans la reponse
- [ ] **`php artisan route:list`** montre la nouvelle route
- [ ] **Les tests passent** : `php artisan test`

---

## E. Glossaire

| Terme | Definition |
|-------|-----------|
| **Tenant** | Un client/site. Chaque tenant a sa propre base de donnees |
| **Central DB** | La base `site_dev1` qui contient la liste des tenants |
| **Tenant DB** | La base d'un client specifique (ex: `db_client_abc`) |
| **Sanctum** | Systeme de tokens API de Laravel |
| **Credential** | Une permission (terme Symfony 1) |
| **Entity** | Un modele Eloquent (terme nwidart/laravel-modules) |
| **Repository** | Classe qui encapsule les requetes SQL |
| **Resource** | Classe qui transforme un modele en JSON |
| **Middleware** | Code qui s'execute avant/apres le controleur |
| **Eager Loading** | Charger les relations en une seule requete (`with()`) |
| **N+1** | Bug de performance : 1 requete + N requetes par ligne |
| **Provider** | Classe qui enregistre des services dans le container Laravel |
| **Context (React)** | Donnees partagees entre composants sans passer par les props |
| **Intercepteur** | Code axios qui s'execute avant/apres chaque requete HTTP |
| **App Router** | Systeme de routing de Next.js 13+ (base sur les fichiers) |
| **SSR** | Server-Side Rendering (HTML genere cote serveur) |

---

## Felicitations !

Vous avez maintenant une comprehension complete du projet :

1. **Architecture** : Multi-tenant, modulaire, 3 couches (super/admin/front)
2. **Multi-tenancy** : Base par client, middleware de basculement
3. **Modules** : Chaque domaine metier isole dans son propre dossier
4. **Auth** : Sanctum tokens, refresh proactif, migration MD5→bcrypt
5. **Permissions** : Compatible Symfony 1, O(1), double securite front+back
6. **Cycle de vie** : Du clic au JSON en passant par 4 middlewares
7. **Frontend** : Next.js App Router, providers imbriques, axios intercepteurs
8. **Patterns** : Controller mince, Repository, Resource, format JSON standard
9. **Base de donnees** : Schema legacy, connexions dynamiques, pas de migration des `t_`
10. **Pratique** : Ajouter un module, debugger, tester

Pour toute question, relisez le tutoriel correspondant ou explorez le code
avec les chemins de fichiers indiques dans chaque section.
