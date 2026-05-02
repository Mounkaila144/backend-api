# 8. Patterns et Conventions du Projet

## Les 4 patterns fondamentaux du backend

### Pattern 1 : Controller Mince (Thin Controller)

Le controleur ne fait que 3 choses :
1. **Valider** les donnees entrantes
2. **Deleguer** au repository ou service
3. **Retourner** une reponse JSON via Resource

```php
// BON : Controller mince
class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);           // 1. Valider
        $user = $this->userRepository->create($validated); // 2. Deleguer
        return response()->json([                          // 3. Retourner
            'success' => true,
            'data' => new UserResource($user),
        ], 201);
    }
}

// MAUVAIS : Controller gras (tout dedans)
class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([...]);
        $user = new User();
        $user->username = $validated['username'];
        $user->email = $validated['email'];
        $user->password = bcrypt($validated['password']);
        $user->save();  // ← Requete SQL dans le controleur !
        // ← Logique metier dans le controleur !
        return response()->json([
            'id' => $user->id,
            'username' => $user->username, // ← Transformation dans le controleur !
        ]);
    }
}
```

### Pattern 2 : Repository (acces aux donnees)

Le Repository encapsule TOUTE la logique de requete SQL :

```php
class ContractRepository
{
    // Requete complexe = dans le repository
    public function getPaginated(array $filters, int $perPage): LengthAwarePaginator
    {
        $query = CustomerContract::query()
            ->with(['customer', 'partner', 'status.translations']);

        // Filtres
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('reference', 'LIKE', "%{$filters['search']}%")
                  ->orWhereHas('customer', fn($q2) =>
                      $q2->where('lastname', 'LIKE', "%{$filters['search']}%")
                  );
            });
        }

        return $query->orderBy($filters['sort_by'] ?? 'id', $filters['sort_order'] ?? 'desc')
                     ->paginate($perPage);
    }

    // Requete simple = aussi dans le repository
    public function findById(int $id): ?CustomerContract
    {
        return CustomerContract::with(['customer', 'partner'])->find($id);
    }
}
```

**Regle** : Si ca touche a la base de donnees, ca va dans le Repository. JAMAIS dans le controleur.

### Pattern 3 : Resource (transformation JSON)

La Resource controle exactement ce qui est envoye au frontend :

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'username'   => $this->username,
            'email'      => $this->email,
            'full_name'  => trim($this->firstname . ' ' . $this->lastname),
            'is_active'  => $this->is_active === 'YES',  // Convertir ENUM en boolean
            'groups'     => GroupResource::collection($this->whenLoaded('groups')),
            // PAS de password, PAS de champs internes
        ];
    }
}
```

**Regles** :
- Ne JAMAIS renvoyer le mot de passe
- Convertir les valeurs legacy (ex: "YES"/"NO" → boolean) si necessaire
- Utiliser `whenLoaded()` pour les relations optionnelles
- Ajouter des champs calcules (`full_name`)

### Pattern 4 : Format de reponse JSON standard

Toutes les reponses suivent le meme format :

```php
// SUCCES - Liste paginee
return response()->json([
    'success' => true,
    'data'    => UserResource::collection($users->items()),
    'meta'    => [
        'current_page' => $users->currentPage(),
        'last_page'    => $users->lastPage(),
        'per_page'     => $users->perPage(),
        'total'        => $users->total(),
        'from'         => $users->firstItem(),
        'to'           => $users->lastItem(),
    ],
]);

// SUCCES - Element unique
return response()->json([
    'success' => true,
    'data'    => new UserResource($user),
]);

// SUCCES - Creation
return response()->json([
    'success' => true,
    'data'    => new UserResource($user),
    'message' => 'User created successfully',
], 201);

// ERREUR
return response()->json([
    'success' => false,
    'message' => 'User not found',
], 404);
```

---

## Conventions de nommage

### Backend (PHP / Laravel)

| Element | Convention | Exemple |
|---------|-----------|---------|
| Module | PascalCase | `CustomersContracts` |
| Controleur | PascalCase + Controller | `ContractController` |
| Modele (Entity) | PascalCase singulier | `CustomerContract` |
| Repository | PascalCase + Repository | `ContractRepository` |
| Resource | PascalCase + Resource | `ContractListResource` |
| Table SQL | snake_case, prefixe `t_` | `t_customers_contracts` |
| Colonne SQL | snake_case | `created_at`, `user_id` |
| Route API | kebab-case, pluriel | `/api/admin/contracts` |
| Middleware | camelCase | `credential:admin` |
| Variable | camelCase | `$userRepository`, `$perPage` |
| Methode | camelCase | `getPaginated()`, `findById()` |

### Frontend (TypeScript / React)

| Element | Convention | Exemple |
|---------|-----------|---------|
| Module | PascalCase | `CustomersContracts` |
| Composant | PascalCase | `ContractList.tsx` |
| Hook | camelCase, prefixe `use` | `useContracts.ts` |
| Service | camelCase + Service | `contractService.ts` |
| Type/Interface | PascalCase | `Contract`, `CreateContractDTO` |
| Variable | camelCase | `contractList`, `isLoading` |
| Constante | SCREAMING_SNAKE | `API_BASE_URL` |
| Props | PascalCase + Props | `ContractListProps` |
| Context | PascalCase + Context | `PermissionsContext` |

---

## Conventions des routes API

### URL structure

```
/api/{layer}/{resource}/{id?}/{sub-resource?}

Exemples :
GET    /api/admin/users              → Liste des users (tenant)
GET    /api/admin/users/42           → Detail user 42 (tenant)
POST   /api/admin/users              → Creer un user (tenant)
PUT    /api/admin/users/42           → Modifier user 42 (tenant)
DELETE /api/admin/users/42           → Supprimer user 42 (tenant)

GET    /api/superadmin/sites         → Liste des sites (central)
GET    /api/frontend/products        → Produits publics (tenant)
```

### Codes HTTP

| Code | Signification | Usage |
|------|--------------|-------|
| 200 | OK | GET, PUT, PATCH reussis |
| 201 | Created | POST reussi (creation) |
| 204 | No Content | DELETE reussi |
| 400 | Bad Request | Requete mal formee |
| 401 | Unauthorized | Token manquant ou expire |
| 403 | Forbidden | Permissions insuffisantes |
| 404 | Not Found | Ressource inexistante |
| 422 | Unprocessable | Validation echouee |
| 500 | Server Error | Bug cote serveur |

---

## Pattern de traduction (i18n)

### Entites avec traduction

Certaines entites ont des tables de traduction separees (pattern legacy Symfony 1) :

```
t_contract_status              t_contract_status_i18n
├── id = 1                     ├── id
├── color = "#FF0000"          ├── status_id = 1
└── is_active = "YES"          ├── lang = "fr"
                               ├── name = "En cours"
                               │
                               ├── id
                               ├── status_id = 1
                               ├── lang = "en"
                               └── name = "In progress"
```

### Comment les charger

```php
// Modele principal
class CustomerContractStatus extends Model
{
    protected $table = 't_contract_status';

    public function translations()
    {
        return $this->hasMany(CustomerContractStatusI18n::class, 'status_id');
    }
}

// Modele de traduction
class CustomerContractStatusI18n extends Model
{
    protected $table = 't_contract_status_i18n';
}

// Dans le repository : eager loading avec filtre de langue
$query->with(['status' => function ($q) use ($lang) {
    $q->with(['translations' => function ($q2) use ($lang) {
        $q2->where('lang', $lang);
    }]);
}]);

// Dans la resource : extraire la traduction
'status_name' => $this->status?->translations?->first()?->name,
```

---

## Pattern des ENUM legacy

Les tables Symfony 1 utilisent des ENUM MySQL de facon **inconsistante** :

```
⚠️  ATTENTION : Pas de standard unique !

Table t_users           : is_active    → ENUM('YES', 'NO')
Table t_contracts       : isLast       → ENUM('YES', 'NO')
Table t_domoprime_calc  : is_valid     → ENUM('Y', 'N')
Table t_domoprime_calc  : status       → ENUM('ACCEPTED', 'REFUSED', 'REQUEST')
```

**Regle absolue** : Toujours verifier le schema de la table AVANT d'inserer une valeur.
Ne JAMAIS supposer que c'est "YES"/"NO". Ca peut etre "Y"/"N" ou autre chose.

---

## Pattern de permission dans les controleurs

```php
// Option 1 : Middleware dans les routes (recommande)
Route::get('/users', [UserController::class, 'index'])
    ->middleware('credential:admin,superadmin,settings_user_list');

// Option 2 : Verification dans le controleur (pour logique complexe)
public function update(Request $request, int $id): JsonResponse
{
    $user = $request->user();

    // L'admin peut modifier, le superadmin peut tout faire
    if (!$user->hasCredential(['admin', 'superadmin', 'settings_user'])) {
        return response()->json([
            'success' => false,
            'message' => 'Insufficient permissions',
        ], 403);
    }

    // Seul le superadmin peut modifier certains champs
    if (isset($data['is_admin']) && !$user->isSuperadmin()) {
        return response()->json([
            'success' => false,
            'message' => 'Only superadmin can change admin status',
        ], 403);
    }

    // ... reste de la logique
}
```

---

## Pattern Eager Loading (N+1 prevention)

```php
// MAUVAIS : N+1 queries
$contracts = Contract::all();
foreach ($contracts as $contract) {
    echo $contract->customer->name;  // 1 requete par contrat !
    echo $contract->partner->name;   // 1 requete de plus par contrat !
}
// Total : 1 + N + N requetes (pour 100 contrats = 201 requetes)

// BON : Eager loading
$contracts = Contract::with(['customer', 'partner'])->get();
foreach ($contracts as $contract) {
    echo $contract->customer->name;  // Deja charge, pas de requete
    echo $contract->partner->name;   // Deja charge, pas de requete
}
// Total : 3 requetes (contracts + customers IN(...) + partners IN(...))
```

---

## Recapitulatif des fichiers cles par pattern

```
PATTERN REPOSITORY:
  Modules/*/Repositories/*Repository.php

PATTERN RESOURCE:
  Modules/*/Http/Resources/*Resource.php

PATTERN CONTROLLER MINCE:
  Modules/*/Http/Controllers/Admin/*Controller.php
  Modules/*/Http/Controllers/Superadmin/*Controller.php
  Modules/*/Http/Controllers/Frontend/*Controller.php

PATTERN MIDDLEWARE:
  app/Http/Middleware/InitializeTenancy.php    (tenant)
  app/Http/Middleware/CheckCredential.php      (permissions)
  app/Http/Middleware/CheckPermission.php      (permissions)
  app/Http/Middleware/SetLocale.php            (langue)

PATTERN ENTITY (modele):
  Modules/*/Entities/*.php                     (tenant DB)
  app/Models/*.php                             (central DB)
```

---

## Prochaine etape

**[09-BASE-DE-DONNEES.md](09-BASE-DE-DONNEES.md)** : Schema legacy, connexions et migrations.
