# Story 1.1: Création du Module Superadmin

**Status:** review

---

## Story

As a **développeur**,
I want **créer la structure du module Superadmin avec nwidart/laravel-modules**,
so that **j'ai une base organisée pour implémenter toutes les fonctionnalités SuperAdmin**.

---

## Acceptance Criteria

1. **Given** le projet Laravel existant avec nwidart/laravel-modules installé
   **When** je crée le module Superadmin
   **Then** la structure `Modules/Superadmin/` est créée avec tous les dossiers requis (Config, Entities, Http, Services, Events, Exceptions, Jobs, Listeners, Providers, Routes, Tests)

2. **Given** le module Superadmin créé
   **When** je vérifie le fichier `module.json`
   **Then** il est configuré correctement avec le nom "Superadmin", le provider principal, et les métadonnées appropriées

3. **Given** le module Superadmin créé
   **When** je vérifie le `SuperadminServiceProvider`
   **Then** il est enregistré et charge correctement les routes, configurations et migrations

4. **Given** le module Superadmin créé
   **When** je vérifie les routes `superadmin.php`
   **Then** elles sont configurées avec le middleware `auth:sanctum` sans tenant middleware

5. **Given** le module Superadmin créé
   **When** j'exécute `php artisan module:list`
   **Then** le module Superadmin apparaît dans la liste comme "Enabled"

---

## Tasks / Subtasks

- [x] **Task 1: Créer le module Superadmin** (AC: #1, #5)
  - [x] Exécuter `php artisan module:make Superadmin`
  - [x] Vérifier la création de la structure de base dans `Modules/Superadmin/`
  - [x] Confirmer que le module apparaît dans `php artisan module:list`

- [x] **Task 2: Configurer module.json** (AC: #2)
  - [x] Éditer `Modules/Superadmin/module.json` avec les métadonnées correctes
  - [x] Définir le nom, alias, description, et priority
  - [x] S'assurer que le provider `SuperadminServiceProvider` est référencé

- [x] **Task 3: Configurer le SuperadminServiceProvider** (AC: #3)
  - [x] Adapter le ServiceProvider pour charger les routes admin/superadmin/frontend
  - [x] Copier le pattern de `Modules/Site/Providers/SiteServiceProvider.php`
  - [x] Enregistrer le chargement des migrations depuis `Database/migrations`
  - [x] Configurer le chargement de la config depuis `Config/config.php`

- [x] **Task 4: Créer les routes superadmin.php** (AC: #4)
  - [x] Créer le fichier `Modules/Superadmin/Routes/superadmin.php`
  - [x] Configurer le préfixe `/api/superadmin` avec middleware `auth:sanctum`
  - [x] NE PAS inclure le middleware tenant (base centrale uniquement)
  - [x] Ajouter une route placeholder pour vérification

- [x] **Task 5: Créer la structure de dossiers complète** (AC: #1)
  - [x] Créer `Modules/Superadmin/Services/` (vide pour l'instant)
  - [x] Créer `Modules/Superadmin/Events/` (vide pour l'instant)
  - [x] Créer `Modules/Superadmin/Exceptions/` (vide pour l'instant)
  - [x] Créer `Modules/Superadmin/Jobs/` (vide pour l'instant)
  - [x] Créer `Modules/Superadmin/Listeners/` (vide pour l'instant)
  - [x] Créer `Modules/Superadmin/Tests/Feature/` et `Tests/Unit/`

- [x] **Task 6: Créer le fichier de configuration** (AC: #3)
  - [x] Créer `Modules/Superadmin/Config/config.php`
  - [x] Définir les configurations de base (timeouts, rate limits, etc.)

- [x] **Task 7: Vérification finale** (AC: #1-5)
  - [x] Exécuter `php artisan route:list --path=superadmin` pour confirmer les routes
  - [x] Vérifier que le module se charge sans erreurs
  - [x] Vérifier que `php artisan config:cache` fonctionne

---

## Dev Notes

### Architecture Requirements

**Module Location:** `Modules/Superadmin/` - Tout le code DOIT être dans ce dossier.

**Pattern à suivre:** Le module Site (`Modules/Site/`) est le modèle de référence pour:
- Structure du ServiceProvider
- Configuration des routes
- Organisation des fichiers

### Structure Cible

```
Modules/Superadmin/
├── Config/
│   └── config.php
├── Database/
│   ├── Migrations/     # Vide pour l'instant (Story 1.2)
│   └── Seeders/
├── Entities/           # Models Eloquent (Story 1.4, 1.5)
├── Events/             # Events du module (Story 1.9)
├── Exceptions/         # Exceptions custom
├── Http/
│   ├── Controllers/
│   │   └── Superadmin/  # Controllers API SuperAdmin
│   ├── Requests/        # Form Requests
│   └── Resources/       # API Resources
├── Jobs/               # Jobs async
├── Listeners/          # Event listeners
├── Providers/
│   ├── SuperadminServiceProvider.php
│   └── EventServiceProvider.php  # Optionnel pour l'instant
├── Routes/
│   └── superadmin.php  # Routes API (Central DB)
├── Services/           # Business logic
└── Tests/
    ├── Feature/
    └── Unit/
```

### Contraintes Techniques Critiques

| Contrainte | Valeur | Raison |
|------------|--------|--------|
| Middleware routes | `auth:sanctum` uniquement | SuperAdmin = base centrale, PAS de tenant |
| Préfixe API | `/api/superadmin` | Cohérence avec module Site existant |
| Connexion BDD | `mysql` (centrale) | Pas de tenant middleware |
| PHP Version | 8.2+ | Requis par Laravel 11/12 |

### Naming Conventions (OBLIGATOIRES)

**Fichiers:**
- Classes: `PascalCase.php` (ex: `ModuleInstaller.php`)
- Config keys: `dot.notation.snake_case` (ex: `superadmin.module.timeout`)

**Code:**
- Classes: `PascalCase`
- Méthodes: `camelCase`
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`

### Code de Référence - ServiceProvider

Copier ce pattern depuis `Modules/Site/Providers/SiteServiceProvider.php`:

```php
protected function registerRoutes(): void
{
    $modulePath = module_path($this->moduleName);

    // Superadmin routes (Central DB) - PAS de tenant middleware
    if (file_exists($modulePath . '/Routes/superadmin.php')) {
        $this->loadRoutesFrom($modulePath . '/Routes/superadmin.php');
    }
}
```

### Code de Référence - Routes Superadmin

Pattern depuis `Modules/Site/Routes/superadmin.php`:

```php
<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Superadmin Routes (CENTRAL DATABASE)
|--------------------------------------------------------------------------
| Ces routes utilisent la base de données centrale
*/

Route::prefix('api/superadmin')->middleware(['auth:sanctum'])->group(function () {
    // Routes du module Superadmin à définir ici
});
```

### Anti-Patterns à Éviter

```php
// ❌ MAUVAIS: Ne jamais utiliser le middleware tenant
Route::middleware(['auth:sanctum', 'tenant'])->group(function () { ... });

// ❌ MAUVAIS: Ne pas mettre de code hors du module
// app/Services/ModuleInstaller.php

// ❌ MAUVAIS: Ne pas utiliser la connexion tenant pour SuperAdmin
protected $connection = 'tenant';
```

### Project Structure Notes

- **Alignement:** Ce module suit exactement la structure des modules existants (Site, User, Customer)
- **Isolation:** Aucune dépendance sur d'autres modules pour cette story
- **Tests:** Créer les dossiers de tests même s'ils sont vides pour faciliter les stories suivantes

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]
- [Source: Modules/Site/Providers/SiteServiceProvider.php - Pattern de référence]
- [Source: Modules/Site/Routes/superadmin.php - Pattern de référence routes]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Commande `php artisan module:make Superadmin` a partiellement échoué (placeholders non résolus), fichiers corrigés manuellement
- Fichiers api.php et web.php avec placeholders supprimés car non nécessaires

### Completion Notes List

- ✅ Module Superadmin créé et activé avec succès
- ✅ Structure conforme au pattern du module Site existant
- ✅ ServiceProvider configuré pour charger routes, config et migrations
- ✅ Routes superadmin.php avec middleware `auth:sanctum` uniquement (pas de tenant)
- ✅ Route health check placeholder ajoutée: GET /api/superadmin/modules/health
- ✅ Configuration avec timeouts, rate_limits et cache settings
- ✅ Tous les dossiers requis créés avec .gitkeep
- ✅ Module visible dans `php artisan module:list` comme "Enabled"
- ✅ Routes listées dans `php artisan route:list --path=superadmin`
- ✅ `php artisan config:cache` fonctionne sans erreur

### File List

**Nouveaux fichiers créés:**
- Modules/Superadmin/module.json
- Modules/Superadmin/composer.json
- Modules/Superadmin/Config/config.php
- Modules/Superadmin/Providers/SuperadminServiceProvider.php
- Modules/Superadmin/Providers/RouteServiceProvider.php
- Modules/Superadmin/Routes/superadmin.php
- Modules/Superadmin/Resources/views/index.blade.php
- Modules/Superadmin/Resources/views/layouts/master.blade.php
- Modules/Superadmin/Services/.gitkeep
- Modules/Superadmin/Events/.gitkeep
- Modules/Superadmin/Exceptions/.gitkeep
- Modules/Superadmin/Jobs/.gitkeep
- Modules/Superadmin/Listeners/.gitkeep
- Modules/Superadmin/Database/migrations/.gitkeep
- Modules/Superadmin/Database/Seeders/.gitkeep
- Modules/Superadmin/Http/Controllers/Superadmin/.gitkeep
- Modules/Superadmin/Tests/Feature/.gitkeep
- Modules/Superadmin/Tests/Unit/.gitkeep

### Change Log

- 2026-01-28: Story 1.1 implémentée - Module Superadmin créé avec structure complète

