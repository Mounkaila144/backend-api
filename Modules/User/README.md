# User Module

## Description

Module de gestion des utilisateurs avec support multi-tenant. Ce module a été migré depuis l'ancien projet Symfony 1 (`C:\xampp\htdocs\project\modules\users`).

## Fonctionnalités Migrées

### ✅ Liste des utilisateurs (ajaxListPartialAction)

L'action `ajaxListPartialAction` de Symfony 1 a été migrée vers Laravel avec les fonctionnalités suivantes :

- **Pagination** : Support de la pagination avec nombre d'items par page configurable
- **Filtrage avancé** :
  - Recherche par username, firstname, lastname, email
  - Filtres d'égalité : is_active, status, is_locked, group_id, creator_id, etc.
  - Tri par colonnes multiples
- **Agrégation de données** :
  - Liste des groupes de l'utilisateur
  - Informations sur le créateur
  - Informations sur qui a déverrouillé l'utilisateur

## Structure du Module

```
Modules/User/
├── Entities/                      # Modèles Eloquent (11 modèles)
│   ├── User.php                   # Modèle principal (t_users)
│   ├── UserFunction.php           # Fonctions/Rôles (t_users_function)
│   ├── UserFunctionI18n.php       # Traductions des fonctions
│   ├── UserFunctions.php          # Pivot User-Function
│   ├── UserTeam.php               # Équipes (t_users_team)
│   ├── UserTeamUsers.php          # Pivot User-Team
│   ├── UserTeamManager.php        # Pivot Manager-User
│   ├── UserAttribution.php        # Attributions (t_users_attribution)
│   ├── UserAttributionI18n.php    # Traductions des attributions
│   ├── UserAttributions.php       # Pivot User-Attribution
│   └── UserProperty.php           # Propriétés utilisateur (t_user_property)
├── Http/
│   ├── Controllers/
│   │   └── Admin/
│   │       └── UserController.php # Contrôleur principal
│   └── Resources/
│       └── UserResource.php       # Formatage des réponses API
├── Repositories/
│   └── UserRepository.php         # Logique d'accès aux données
├── Routes/
│   └── admin.php                  # Routes admin (tenant DB)
├── README.md                      # Documentation du module
└── MODELS.md                      # Documentation détaillée des modèles
```

## API Endpoints

### Liste des utilisateurs
```
GET /api/admin/users
```

**Headers requis:**
- `Authorization: Bearer {token}`
- `X-Tenant-ID: {site_id}` ou `Host: {domain}`

**Paramètres de requête:**
```json
{
  "filter": {
    "search": {
      "query": "john",
      "username": "john",
      "firstname": "John",
      "lastname": "Doe",
      "email": "john@example.com",
      "id": 123
    },
    "equal": {
      "is_active": "YES",
      "status": "ACTIVE",
      "is_locked": "NO",
      "group_id": 1,
      "creator_id": 5
    },
    "order": {
      "id": "asc",
      "username": "desc"
    }
  },
  "nbitemsbypage": 100,
  "page": 1
}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john.doe",
      "firstname": "John",
      "lastname": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "is_active": "YES",
      "status": "ACTIVE",
      "groups_list": "Admin,Manager",
      "created_at": "2024-01-01T00:00:00Z",
      ...
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 10,
    "per_page": 100,
    "total": 1000,
    "from": 1,
    "to": 100
  },
  "statistics": {
    "total": 1000,
    "active": 950,
    "inactive": 30,
    "locked": 20
  },
  "tenant": {
    "id": 1,
    "host": "site1.example.com"
  }
}
```

### Autres endpoints

- `POST /api/admin/users` - Créer un utilisateur
- `GET /api/admin/users/{id}` - Voir un utilisateur
- `PUT /api/admin/users/{id}` - Modifier un utilisateur
- `DELETE /api/admin/users/{id}` - Supprimer un utilisateur (soft delete)
- `GET /api/admin/users/statistics` - Obtenir les statistiques

## Modèles de Données

Le module User contient **11 modèles Eloquent** qui gèrent l'ensemble des données utilisateur. Pour la documentation complète des modèles, consultez **[MODELS.md](./MODELS.md)**.

### Modèles principaux

1. **User** - Modèle principal des utilisateurs
2. **UserFunction** - Fonctions/rôles assignables aux utilisateurs
3. **UserFunctionI18n** - Traductions des fonctions
4. **UserTeam** - Équipes d'utilisateurs
5. **UserAttribution** - Attributions/affectations
6. **UserAttributionI18n** - Traductions des attributions
7. **UserProperty** - Propriétés/paramètres personnalisés

### Modèles Pivot

8. **UserFunctions** - Liaison User ↔ Function
9. **UserTeamUsers** - Liaison User ↔ Team
10. **UserAttributions** - Liaison User ↔ Attribution
11. **UserTeamManager** - Liaison Manager ↔ User

### Modèle User (Principal)

Le modèle `User` utilise la table existante `t_users` avec les champs suivants :

**Champs principaux:**
- `id` : Clé primaire
- `username` : Nom d'utilisateur (unique par application)
- `password` : Mot de passe hashé
- `email` : Email (unique par application)
- `firstname`, `lastname` : Nom et prénom
- `application` : Type d'application (admin, frontend, superadmin)

**Champs de statut:**
- `is_active` : YES/NO
- `is_locked` : YES/NO
- `is_secure_by_code` : YES/NO
- `status` : ACTIVE/DELETE

**Dates:**
- `created_at` : Date de création
- `updated_at` : Date de mise à jour
- `lastlogin` : Dernière connexion
- `last_password_gen` : Dernière génération de mot de passe

## Relations

- **Groups** : Many-to-Many via `t_users_group`
- **Creator** : BelongsTo User (creator_id)
- **Unlocker** : BelongsTo User (unlocked_by)

## Filtres Disponibles

### Recherche (search)
- `query` : Recherche globale (username, firstname, lastname, email)
- `username` : Recherche par username
- `firstname` : Recherche par prénom
- `lastname` : Recherche par nom
- `email` : Recherche par email
- `id` : Recherche par ID

### Égalité (equal)
- `is_active` : YES/NO
- `status` : ACTIVE/DELETE
- `is_locked` : YES/NO
- `is_secure_by_code` : YES/NO
- `group_id` : ID du groupe
- `creator_id` : ID du créateur (ou IS_NULL)
- `unlocked_by` : ID du déverrouilleur (ou IS_NULL)
- `company_id` : ID de l'entreprise
- `callcenter_id` : ID du call center

### Tri (order)
Colonnes triables : `id`, `username`, `firstname`, `lastname`, `email`, `created_at`, `lastlogin`, `last_password_gen`

Valeurs : `asc` ou `desc`

## Migration depuis Symfony 1

### Correspondance des fichiers

| Symfony 1 | Laravel |
|-----------|---------|
| `modules/users/admin/actions/ajaxListPartialAction.class.php` | `Modules/User/Http/Controllers/Admin/UserController.php@index` |
| `modules/users/admin/locales/FormFilters/usersFormFilter.class.php` | `Modules/User/Repositories/UserRepository.php` (méthode applyFilters) |
| `modules/users/admin/locales/Pagers/UserPager.class.php` | `Modules/User/Repositories/UserRepository.php` (méthode getPaginated) |
| `modules/users/common/lib/User/User.class.php` | `Modules/User/Entities/User.php` |

### Différences principales

1. **ORM** : Passage de mfObject3 à Eloquent
2. **Validation** : Passage de mfValidator à Laravel Validation
3. **Filtrage** : Logique déplacée du FormFilter au Repository
4. **Pagination** : Utilisation du paginator Laravel natif
5. **Format de réponse** : JSON structuré au lieu de HTML/AJAX2

## Tests

Pour tester l'endpoint de liste des utilisateurs :

```bash
# Obtenir un token d'authentification
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{"username": "admin", "password": "password"}'

# Lister les utilisateurs
curl -X GET "http://localhost/api/admin/users?nbitemsbypage=10" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Tenant-ID: 1"

# Avec filtres
curl -X GET "http://localhost/api/admin/users" \
  -H "Authorization: Bearer {TOKEN}" \
  -H "X-Tenant-ID: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "search": {"query": "john"},
      "equal": {"is_active": "YES"},
      "order": {"id": "desc"}
    },
    "nbitemsbypage": 50
  }'
```

## TODO

- [ ] Migrer les autres actions (ajaxNew, ajaxSave, ajaxView, ajaxDelete)
- [ ] Ajouter les permissions et gestion des credentials
- [ ] Migrer les fonctionnalités UserUtils (connexions, équipes, etc.)
- [ ] Ajouter les tests unitaires et d'intégration
- [ ] Migrer les templates Smarty vers une solution frontend (Next.js)

## Notes

- La table `t_users` est partagée avec le module `UsersGuard` pour l'authentification
- Les mots de passe utilisent le hashing Laravel (bcrypt) au lieu de MD5
- Le module respecte l'architecture multi-tenant (base de données par tenant)
- Les routes sont automatiquement chargées avec les middlewares `auth:sanctum` et `tenant`
