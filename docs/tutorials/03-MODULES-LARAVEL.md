# 3. Le Systeme Modulaire (nwidart/laravel-modules)

## Pourquoi des modules ?

Dans un Laravel classique, tout est dans `app/` : controleurs, modeles, routes...
Ca fonctionne pour un petit projet, mais avec 27 domaines metier (Contrats, Utilisateurs,
Partenaires, Produits...), ca devient un bazar ingerable.

Le package **nwidart/laravel-modules** permet de decouper l'application en "mini-applications"
independantes. Chaque module a ses propres controleurs, modeles, routes, etc.

**Analogie** : Pensez a des applications Django ou des "bundles" Symfony.
Chaque module est un dossier autonome qui contient tout ce dont il a besoin.

---

## Liste des 27 modules

```
Modules/
├── AppDomoprime              # Application Domoprime (calculs energetiques)
├── AppDomoprimeISO3          # Variante ISO3 de Domoprime
├── Customer                  # Gestion des clients
├── CustomersCommunicationEmails    # Emails clients
├── CustomersCommunicationSms       # SMS clients
├── CustomersCommunicationWhatsApp  # WhatsApp clients
├── CustomersContracts        # Contrats (module le plus complexe, 20+ relations)
├── CustomersContractsBilling # Facturation des contrats
├── CustomersContractsComments      # Commentaires sur les contrats
├── CustomersContractsDocumentsCheck # Verification des documents
├── CustomersDocuments        # Documents clients
├── CustomersMeetings         # Rendez-vous/planification
├── CustomersMeetingsForms    # Formulaires de rendez-vous
├── Dashboard                 # Tableau de bord
├── ParticipantsManager       # Gestion des participants
├── Partner                   # Partenaires (t_partners_company)
├── PartnerLayer              # Sous-traitants (t_partner_layer_company)
├── PartnerPolluter           # Obliges CEE (t_partner_polluter_company)
├── PartnersCommunicationWhatsApp   # WhatsApp partenaires
├── Product                   # Produits (t_products_taxes)
├── ProductsInstallerSchedule # Planning installateurs
├── ServicesFidealis          # Service Fidealis
├── ServicesPrimerenov        # Service Prime Renov
├── Site                      # Gestion des sites (superadmin)
├── Superadmin                # Fonctionnalites superadmin
├── User                      # Gestion utilisateurs (tenant)
└── UsersGuard                # Authentification et autorisation
```

---

## Anatomie d'un module

Prenons le module `User` comme exemple :

```
Modules/User/
│
├── Config/
│   └── config.php              # Configuration specifique au module
│
├── Entities/                    # = Les Modeles (nom legacy du package)
│   └── User.php                # Modele Eloquent, connexion 'tenant'
│
├── Http/
│   ├── Controllers/
│   │   ├── Admin/
│   │   │   └── UserController.php    # CRUD admin (base tenant)
│   │   ├── Superadmin/
│   │   │   └── UserController.php    # CRUD superadmin (base centrale)
│   │   └── Frontend/
│   │       └── IndexController.php   # Consultation (base tenant)
│   │
│   ├── Requests/                # Validation des requetes (optionnel)
│   │   └── StoreUserRequest.php
│   │
│   └── Resources/               # Transformation des donnees en JSON
│       └── UserResource.php
│
├── Repositories/                # Couche d'acces aux donnees
│   └── UserRepository.php
│
├── Routes/
│   ├── admin.php               # Routes tenant + auth:sanctum
│   ├── superadmin.php          # Routes centrales
│   └── frontend.php            # Routes publiques/auth
│
├── Services/                    # Logique metier (optionnel)
│
├── Providers/
│   └── UserServiceProvider.php  # Enregistre le module dans Laravel
│
├── Tests/                       # Tests du module
│
└── module.json                  # Metadata : nom, alias, priorite
```

---

## Comment les routes sont chargees automatiquement

Chaque module a un **ServiceProvider** qui enregistre ses routes. Voici le mecanisme :

### 1. `module.json` declare le module

```json
{
    "name": "User",
    "alias": "user",
    "description": "User management module",
    "providers": [
        "Modules\\User\\Providers\\UserServiceProvider"
    ]
}
```

### 2. Le ServiceProvider charge les routes

```php
// Modules/User/Providers/UserServiceProvider.php

class UserServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->registerRoutes();
    }

    protected function registerRoutes(): void
    {
        // Routes admin (tenant + auth)
        Route::middleware(['tenant', 'auth:sanctum'])
            ->group(module_path('User', '/Routes/admin.php'));

        // Routes superadmin (auth seulement)
        Route::middleware(['auth:sanctum'])
            ->group(module_path('User', '/Routes/superadmin.php'));

        // Routes frontend (tenant)
        Route::middleware(['tenant'])
            ->group(module_path('User', '/Routes/frontend.php'));
    }
}
```

### 3. Les fichiers de routes definissent les endpoints

```php
// Modules/User/Routes/admin.php

Route::prefix('api/admin')->group(function () {
    Route::prefix('users')->name('admin.users.')->group(function () {

        // GET /api/admin/users → Liste paginee
        Route::get('/', [UserController::class, 'index'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('index');

        // POST /api/admin/users → Creer un utilisateur
        Route::post('/', [UserController::class, 'store'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('store');

        // GET /api/admin/users/{id} → Detail d'un utilisateur
        Route::get('/{id}', [UserController::class, 'show'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('show');

        // PUT /api/admin/users/{id} → Modifier
        Route::put('/{id}', [UserController::class, 'update'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('update');

        // DELETE /api/admin/users/{id} → Supprimer
        Route::delete('/{id}', [UserController::class, 'destroy'])
            ->middleware('credential:admin,superadmin,settings_user_list')
            ->name('destroy');
    });
});
```

**Important** : Le middleware `credential:admin,superadmin,settings_user_list`
signifie : l'utilisateur doit avoir AU MOINS UN de ces credentials (logique OR).
C'est compatible avec Symfony 1.

---

## Les Entities (Modeles)

Le terme "Entities" vient du package nwidart/laravel-modules. Ce sont en realite
des **modeles Eloquent** classiques de Laravel.

```php
// Modules/User/Entities/User.php

namespace Modules\User\Entities;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    // Connexion : utilise la base du tenant actuel
    protected $connection = 'tenant';

    // Table legacy Symfony 1 (prefixe t_)
    protected $table = 't_users';

    // Pas de created_at / updated_at (schema Symfony 1)
    public $timestamps = false;

    // Cle primaire custom (si differente de "id")
    // protected $primaryKey = 'user_id';

    protected $fillable = [
        'username',
        'firstname',
        'lastname',
        'email',
        'password',
        'is_active',
        // ...
    ];
}
```

---

## Les Repositories (couche d'acces aux donnees)

Le **Repository Pattern** est utilise pour isoler les requetes SQL du controleur.
Le controleur ne fait JAMAIS de requetes directes a la base de donnees.

```php
// Modules/User/Repositories/UserRepository.php

class UserRepository
{
    /**
     * Recupere une liste paginee d'utilisateurs avec filtres
     */
    public function getPaginated(array $filters, int $perPage = 10)
    {
        $query = User::query();

        // Appliquer les filtres
        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('username', 'LIKE', "%{$filters['search']}%")
                  ->orWhere('email', 'LIKE', "%{$filters['search']}%")
                  ->orWhere('firstname', 'LIKE', "%{$filters['search']}%");
            });
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        // Tri
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortOrder = $filters['sort_order'] ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        return $query->paginate($perPage);
    }

    /**
     * Cree un utilisateur
     */
    public function create(array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        return User::create($data);
    }

    /**
     * Met a jour un utilisateur
     */
    public function update(int $id, array $data): User
    {
        $user = User::findOrFail($id);
        $user->update($data);
        return $user->fresh();
    }
}
```

**Pourquoi ?**
- Le controleur reste mince (validation + delegation)
- La logique de requete est reutilisable
- Plus facile a tester (on peut mocker le repository)
- Un seul endroit a modifier si la requete change

---

## Les Resources (transformation JSON)

Les **Resources** transforment les modeles Eloquent en JSON propre pour l'API :

```php
// Modules/User/Http/Resources/UserResource.php

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id'         => $this->id,
            'username'   => $this->username,
            'firstname'  => $this->firstname,
            'lastname'   => $this->lastname,
            'email'      => $this->email,
            'is_active'  => $this->is_active,
            'last_login' => $this->lastlogin,
            // On ne renvoie PAS le mot de passe !
            // On peut ajouter des champs calcules :
            'full_name'  => trim($this->firstname . ' ' . $this->lastname),
        ];
    }
}
```

**Pourquoi ?**
- Controle precis de ce qui est expose dans l'API
- Jamais de donnees sensibles (password) envoyees par erreur
- Transformation coherente partout
- Possibilite d'ajouter des champs calcules

---

## Les Controllers (couche mince)

Le controleur est un **adaptateur** entre HTTP et la logique metier :

```php
// Modules/User/Http/Controllers/Admin/UserController.php

class UserController extends Controller
{
    // Injection de dependance du repository
    public function __construct(
        private UserRepository $userRepository
    ) {}

    /**
     * GET /api/admin/users
     * Liste paginee des utilisateurs
     */
    public function index(Request $request): JsonResponse
    {
        // 1. Extraire les parametres de la requete
        $filters = [
            'search'    => $request->input('search'),
            'is_active' => $request->input('is_active'),
            'sort_by'   => $request->input('sort_by', 'id'),
            'sort_order'=> $request->input('sort_order', 'desc'),
        ];
        $perPage = (int) $request->input('nbitemsbypage', 10);

        // 2. Deleguer au repository
        $users = $this->userRepository->getPaginated($filters, $perPage);

        // 3. Retourner avec le format JSON standard
        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users->items()),
            'meta'    => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'per_page'     => $users->perPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /**
     * POST /api/admin/users
     * Creer un utilisateur
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Valider les donnees entrantes
        $validated = $request->validate([
            'username'  => 'required|string|max:16|unique:t_users,username',
            'email'     => 'required|email|unique:t_users,email',
            'password'  => 'required|string|min:6',
            'firstname' => 'nullable|string|max:64',
            'lastname'  => 'nullable|string|max:64',
        ]);

        // 2. Deleguer la creation au repository
        $user = $this->userRepository->create($validated);

        // 3. Retourner le resultat avec status 201
        return response()->json([
            'success' => true,
            'data'    => new UserResource($user),
            'message' => 'User created successfully',
        ], 201);
    }
}
```

**Le pattern est toujours le meme** :
1. Valider (ou parser les parametres)
2. Deleguer au repository (ou service)
3. Retourner une reponse JSON avec Resource

---

## Creer un nouveau module

Le projet inclut un script PowerShell pour generer un module complet :

```powershell
# Cree un module avec Admin/Superadmin/Frontend deja configure
.\create-module.ps1 MonNouveauModule
```

Ou manuellement avec les commandes artisan :

```bash
# Creer le module de base
php artisan module:make MonModule

# Ajouter un controleur API
php artisan module:make-controller MonController MonModule --api

# Ajouter un modele
php artisan module:make-model MonModel MonModule
```

---

## Interaction entre modules

Les modules peuvent utiliser les entites d'autres modules :

```php
// Dans Modules/CustomersContracts/Entities/CustomerContract.php
use Modules\User\Entities\User;
use Modules\Partner\Entities\Partner;

class CustomerContract extends Model
{
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function partner()
    {
        return $this->belongsTo(Partner::class, 'partner_id');
    }
}
```

Les modules ne sont PAS completement isoles. Ils partagent :
- La meme connexion `tenant` (meme base de donnees)
- Les memes middlewares
- Les memes traits et helpers de `app/`

---

## Prochaine etape

**[04-AUTHENTIFICATION.md](04-AUTHENTIFICATION.md)** : Comment fonctionnent le login,
les tokens, et le refresh.
