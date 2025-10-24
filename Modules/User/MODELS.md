# User Module - Models Documentation

Ce document décrit tous les modèles Eloquent du module User et leurs relations.

## Vue d'ensemble

Le module User contient **11 modèles** qui gèrent les utilisateurs, leurs équipes, fonctions, attributions et propriétés.

### Diagramme des Relations

```
User (t_users)
├── groups (Many-to-Many) → Group (t_groups)
├── functions (Many-to-Many) → UserFunction (t_users_function)
│   └── translations → UserFunctionI18n (t_users_function_i18n)
├── attributions (Many-to-Many) → UserAttribution (t_users_attribution)
│   └── translations → UserAttributionI18n (t_users_attribution_i18n)
├── teams (Many-to-Many) → UserTeam (t_users_team)
│   ├── manager → User
│   └── secondaryManager → User
├── managedTeams (One-to-Many) → UserTeam
├── managedTeamsSecondary (One-to-Many) → UserTeam
├── managers (Many-to-Many) → User (via t_users_team_manager)
├── managedUsers (Many-to-Many) → User (via t_users_team_manager)
├── creator → User
├── createdUsers (One-to-Many) → User
├── unlocker → User
├── unlockedUsers (One-to-Many) → User
└── properties (One-to-Many) → UserProperty (t_user_property)
```

---

## 1. User

**Table:** `t_users`
**Fichier:** `Modules/User/Entities/User.php`

### Description
Modèle principal représentant un utilisateur du système.

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| id | int | Clé primaire |
| username | varchar(32) | Nom d'utilisateur (unique par application) |
| password | varchar(32) | Mot de passe hashé |
| sex | enum | Civilité (Mr, Ms, Mrs) |
| firstname | varchar(16) | Prénom |
| lastname | varchar(32) | Nom |
| email | varchar(255) | Email (unique par application) |
| picture | varchar(255) | Photo de profil |
| phone | varchar(20) | Téléphone |
| mobile | varchar(20) | Mobile |
| birthday | date | Date de naissance |
| team_id | int | ID de l'équipe principale |
| is_active | enum | Actif (YES/NO) |
| is_guess | enum | Utilisateur invité (YES/NO) |
| is_locked | enum | Verrouillé (YES/NO) |
| is_secure_by_code | enum | Sécurisé par code (YES/NO) |
| status | enum | Statut (ACTIVE/DELETE) |
| email_tosend | enum | Email à envoyer (YES/NO) |
| application | enum | Type d'application (admin, frontend, superadmin) |
| creator_id | int | ID du créateur |
| unlocked_by | int | ID du déverrouilleur |
| company_id | int | ID de l'entreprise |
| callcenter_id | int | ID du call center |
| number_of_try | int | Nombre de tentatives de connexion |
| created_at | timestamp | Date de création |
| updated_at | timestamp | Date de modification |
| lastlogin | timestamp | Dernière connexion |
| last_password_gen | timestamp | Dernière génération de mot de passe |

### Relations

#### Many-to-Many
- **groups** → `Group` via `t_users_group`
- **functions** → `UserFunction` via `t_users_functions`
- **attributions** → `UserAttribution` via `t_users_attributions`
- **teams** → `UserTeam` via `t_users_team_users`
- **managers** → `User` via `t_users_team_manager`
- **managedUsers** → `User` via `t_users_team_manager`

#### One-to-Many
- **managedTeams** → `UserTeam` (where manager_id = user.id)
- **managedTeamsSecondary** → `UserTeam` (where manager2_id = user.id)
- **createdUsers** → `User` (where creator_id = user.id)
- **unlockedUsers** → `User` (where unlocked_by = user.id)
- **properties** → `UserProperty`

#### Belongs-To
- **creator** → `User`
- **unlocker** → `User`

### Méthodes Utiles

```php
// Vérifications
$user->isActive(); // bool
$user->isLocked(); // bool
$user->isTeamManager(); // bool
$user->hasFunction($functionId); // bool
$user->hasAttribution($attributionId); // bool
$user->isInTeam($teamId); // bool

// Récupération de données
$user->getTeamIds(); // array
$user->getFunctionNames('fr'); // array
$user->getAttributionNames('fr'); // array
$user->property('preference_name'); // UserProperty|null

// Scopes
User::application('admin')->get();
User::active()->get();
User::noSuperadmin()->get();
User::status('ACTIVE')->get();
User::search('john')->get();
```

---

## 2. UserFunction

**Table:** `t_users_function`
**Fichier:** `Modules/User/Entities/UserFunction.php`

### Description
Représente une fonction/rôle pouvant être attribué aux utilisateurs.

### Champs
- `id` - Clé primaire
- `name` - Nom de la fonction

### Relations
- **translations** → `UserFunctionI18n` (One-to-Many)
- **users** → `User` (Many-to-Many via t_users_functions)

### Utilisation

```php
// Créer une fonction
$function = UserFunction::create(['name' => 'developer']);

// Ajouter des traductions
$function->translations()->create([
    'lang' => 'fr',
    'value' => 'Développeur'
]);

// Récupérer avec traduction
$functions = UserFunction::withTranslation('fr')->get();

// Obtenir la valeur traduite
$translatedValue = $function->translated_value; // Utilise app()->getLocale()
```

---

## 3. UserFunctionI18n

**Table:** `t_users_function_i18n`
**Fichier:** `Modules/User/Entities/UserFunctionI18n.php`

### Description
Traductions des fonctions utilisateur.

### Champs
- `id` - Clé primaire
- `function_id` - Clé étrangère vers UserFunction
- `lang` - Code langue (2 caractères)
- `value` - Valeur traduite
- `created_at` - Date de création
- `updated_at` - Date de modification

### Relations
- **function** → `UserFunction` (Belongs-To)

---

## 4. UserFunctions (Pivot)

**Table:** `t_users_functions`
**Fichier:** `Modules/User/Entities/UserFunctions.php`

### Description
Table pivot reliant les utilisateurs à leurs fonctions.

### Champs
- `id` - Clé primaire
- `user_id` - Clé étrangère vers User
- `function_id` - Clé étrangère vers UserFunction

---

## 5. UserTeam

**Table:** `t_users_team`
**Fichier:** `Modules/User/Entities/UserTeam.php`

### Description
Représente une équipe d'utilisateurs.

### Champs
- `id` - Clé primaire
- `name` - Nom de l'équipe
- `manager_id` - ID du manager principal
- `manager2_id` - ID du manager secondaire
- `created_at` - Date de création
- `updated_at` - Date de modification

### Relations
- **manager** → `User` (Belongs-To via manager_id)
- **secondaryManager** → `User` (Belongs-To via manager2_id)
- **users** → `User` (Many-to-Many via t_users_team_users)
- **teamUsers** → `UserTeamUsers` (One-to-Many)

### Utilisation

```php
// Créer une équipe
$team = UserTeam::create([
    'name' => 'Development Team',
    'manager_id' => 1,
    'manager2_id' => 2
]);

// Ajouter des utilisateurs
$team->users()->attach([3, 4, 5]);

// Récupérer avec manager
$teams = UserTeam::withManager()->get();

// Équipes d'un manager
$teams = UserTeam::forManager($managerId)->get();
```

---

## 6. UserTeamUsers (Pivot)

**Table:** `t_users_team_users`
**Fichier:** `Modules/User/Entities/UserTeamUsers.php`

### Description
Table pivot reliant les utilisateurs à leurs équipes.

### Champs
- `id` - Clé primaire
- `team_id` - Clé étrangère vers UserTeam
- `user_id` - Clé étrangère vers User

### Relations
- **team** → `UserTeam` (Belongs-To)
- **user** → `User` (Belongs-To)

---

## 7. UserAttribution

**Table:** `t_users_attribution`
**Fichier:** `Modules/User/Entities/UserAttribution.php`

### Description
Représente une attribution/affectation pouvant être donnée aux utilisateurs.

### Champs
- `id` - Clé primaire
- `name` - Nom de l'attribution

### Relations
- **translations** → `UserAttributionI18n` (One-to-Many)
- **users** → `User` (Many-to-Many via t_users_attributions)

### Utilisation

```php
// Créer une attribution
$attribution = UserAttribution::create(['name' => 'regional_manager']);

// Ajouter une traduction
$attribution->translations()->create([
    'lang' => 'fr',
    'value' => 'Responsable Régional'
]);

// Attribuer à un utilisateur
$user->attributions()->attach($attribution->id);

// Vérifier
$user->hasAttribution($attribution->id); // true
```

---

## 8. UserAttributionI18n

**Table:** `t_users_attribution_i18n`
**Fichier:** `Modules/User/Entities/UserAttributionI18n.php`

### Description
Traductions des attributions utilisateur.

### Champs
- `id` - Clé primaire
- `attribution_id` - Clé étrangère vers UserAttribution
- `lang` - Code langue (2 caractères)
- `value` - Valeur traduite
- `created_at` - Date de création
- `updated_at` - Date de modification

### Relations
- **attribution** → `UserAttribution` (Belongs-To)

---

## 9. UserAttributions (Pivot)

**Table:** `t_users_attributions`
**Fichier:** `Modules/User/Entities/UserAttributions.php`

### Description
Table pivot reliant les utilisateurs à leurs attributions.

### Champs
- `id` - Clé primaire
- `user_id` - Clé étrangère vers User
- `attribution_id` - Clé étrangère vers UserAttribution

---

## 10. UserTeamManager (Pivot)

**Table:** `t_users_team_manager`
**Fichier:** `Modules/User/Entities/UserTeamManager.php`

### Description
Table pivot reliant les managers à leurs utilisateurs gérés.

### Champs
- `id` - Clé primaire
- `manager_id` - Clé étrangère vers User (manager)
- `user_id` - Clé étrangère vers User (géré)

### Relations
- **manager** → `User` (Belongs-To)
- **user** → `User` (Belongs-To)

### Utilisation

```php
// Assigner un manager à un utilisateur
$user->managers()->attach($managerId);

// Récupérer tous les managers d'un utilisateur
$managers = $user->managers;

// Récupérer tous les utilisateurs gérés par un manager
$managedUsers = $manager->managedUsers;
```

---

## 11. UserProperty

**Table:** `t_user_property`
**Fichier:** `Modules/User/Entities/UserProperty.php`

### Description
Stocke des propriétés/paramètres personnalisés pour les utilisateurs.

### Champs
- `id` - Clé primaire
- `name` - Nom de la propriété
- `parameters` - Paramètres JSON (TEXT)
- `user_id` - Clé étrangère vers User
- `created_at` - Date de création
- `updated_at` - Date de modification

### Relations
- **user** → `User` (Belongs-To)

### Utilisation

```php
// Créer une propriété
$property = UserProperty::create([
    'name' => 'dashboard_preferences',
    'user_id' => $userId,
    'parameters' => [
        'theme' => 'dark',
        'language' => 'fr',
        'notifications' => true
    ]
]);

// Obtenir une valeur de paramètre
$theme = $property->getParameter('theme'); // 'dark'
$layout = $property->getParameter('layout', 'default'); // 'default' si non défini

// Définir une valeur de paramètre
$property->setParameter('theme', 'light');
$property->save();

// Récupérer une propriété d'un utilisateur
$pref = $user->property('dashboard_preferences');

// Scopes
UserProperty::byName('dashboard_preferences')->get();
UserProperty::forUser($userId)->get();
```

---

## Exemples d'Utilisation Avancée

### Charger un utilisateur avec toutes ses relations

```php
$user = User::with([
    'groups',
    'functions.translations',
    'attributions.translations',
    'teams.manager',
    'managedTeams.users',
    'creator',
    'properties'
])->find($userId);
```

### Créer un utilisateur complet

```php
$user = User::create([
    'username' => 'john.doe',
    'email' => 'john@example.com',
    'password' => Hash::make('password'),
    'firstname' => 'John',
    'lastname' => 'Doe',
    'application' => 'admin',
    'is_active' => 'YES',
    'creator_id' => auth()->id()
]);

// Ajouter des fonctions
$user->functions()->attach([1, 2, 3]);

// Ajouter à une équipe
$user->teams()->attach(5);

// Créer une propriété
$user->properties()->create([
    'name' => 'preferences',
    'parameters' => ['lang' => 'fr']
]);
```

### Recherche avancée

```php
$users = User::query()
    ->application('admin')
    ->active()
    ->whereHas('teams', function ($q) {
        $q->where('name', 'like', '%Development%');
    })
    ->whereHas('functions', function ($q) {
        $q->where('name', 'developer');
    })
    ->with(['teams', 'functions.translations'])
    ->get();
```

### Gestion des équipes

```php
// Créer une équipe avec manager
$team = UserTeam::create([
    'name' => 'Sales Team',
    'manager_id' => $managerId
]);

// Ajouter des membres
$team->users()->attach([1, 2, 3, 4]);

// Vérifier si un utilisateur est dans l'équipe
if ($user->isInTeam($team->id)) {
    // ...
}

// Récupérer toutes les équipes d'un utilisateur
$teams = $user->teams;

// Récupérer les équipes gérées par un utilisateur
$managedTeams = $user->managedTeams;
```

---

## Notes Importantes

1. **Multi-tenancy**: Tous ces modèles utilisent la base de données du tenant
2. **Timestamps**: La plupart des modèles utilisent `created_at` et `updated_at`
3. **Clés étrangères**: Toutes les relations sont protégées par des contraintes ON DELETE CASCADE
4. **Traductions**: Les modèles Function et Attribution supportent l'i18n
5. **Pivots personnalisés**: Utilisez `->using()` pour les pivots avec logique métier
6. **Soft deletes**: Le modèle User utilise un champ `status` (DELETE) au lieu de soft deletes

---

## Migration depuis Symfony 1

| Symfony 1 | Laravel Eloquent |
|-----------|------------------|
| `User::retrieveByPk($id)` | `User::find($id)` |
| `$user->save()` | `$user->save()` |
| `$user->add()` | `User::create([...])` |
| `$user->delete()` | `$user->update(['status' => 'DELETE'])` |
| `$user->toArray()` | `$user->toArray()` |
| `UserCollection` | `User::all()` ou `User::get()` |
| `$user->getTeams()` | `$user->teams` |
| `$user->isLoaded('teams')` | `$user->relationLoaded('teams')` |
