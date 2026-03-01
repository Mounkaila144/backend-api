# Story 1.4: Modèle SiteModule avec Encryption

**Status:** review

---

## Story

As a **développeur**,
I want **un modèle Eloquent pour la table t_site_modules**,
so that **je peux interagir avec les données de modules activés de manière type-safe**.

---

## Acceptance Criteria

1. **Given** la table t_site_modules existe
   **When** j'utilise le modèle SiteModule
   **Then** je peux créer, lire, modifier et supprimer des enregistrements

2. **Given** le modèle SiteModule
   **When** je vérifie la configuration
   **Then** le modèle utilise la connexion `mysql` (central)

3. **Given** le modèle SiteModule
   **When** j'accède à la colonne `config`
   **Then** le cast JSON est appliqué automatiquement

4. **Given** le modèle SiteModule
   **When** j'accède aux relations
   **Then** la relation vers Site est définie et fonctionnelle

5. **Given** le modèle SiteModule
   **When** j'utilise les scopes
   **Then** les scopes `active()` et `forTenant($siteId)` sont disponibles

---

## Tasks / Subtasks

- [x] **Task 1: Créer le modèle SiteModule** (AC: #1, #2)
  - [x] Créer `Modules/Superadmin/Entities/SiteModule.php`
  - [x] Configurer `$connection = 'mysql'` (central)
  - [x] Configurer `$table = 't_site_modules'`
  - [x] Désactiver les timestamps Laravel (`$timestamps = false`)

- [x] **Task 2: Configurer les casts** (AC: #3)
  - [x] Ajouter le cast `'config' => 'array'`
  - [x] Configurer les dates pour `installed_at` et `uninstalled_at`

- [x] **Task 3: Définir les relations** (AC: #4)
  - [x] Créer la relation `site()` vers le modèle Tenant/Site
  - [x] Vérifier la compatibilité avec le modèle Site existant

- [x] **Task 4: Créer les scopes** (AC: #5)
  - [x] Créer le scope `scopeActive($query)`
  - [x] Créer le scope `scopeForTenant($query, $siteId)`
  - [x] Créer le scope `scopeInactive($query)`

- [x] **Task 5: Configurer fillable/guarded** (AC: #1)
  - [x] Définir `$fillable` avec les colonnes modifiables
  - [x] Exclure `id` du fillable

---

## Dev Notes

### Emplacement

`Modules/Superadmin/Entities/SiteModule.php`

### Code de Référence

```php
<?php

namespace Modules\Superadmin\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Tenant;

class SiteModule extends Model
{
    /**
     * Connexion à la base centrale
     */
    protected $connection = 'mysql';

    /**
     * Table avec préfixe t_
     */
    protected $table = 't_site_modules';

    /**
     * Pas de timestamps Laravel (utilise installed_at/uninstalled_at)
     */
    public $timestamps = false;

    /**
     * Colonnes modifiables
     */
    protected $fillable = [
        'site_id',
        'module_name',
        'is_active',
        'installed_at',
        'uninstalled_at',
        'config',
    ];

    /**
     * Casts automatiques
     */
    protected $casts = [
        'config' => 'array',
        'installed_at' => 'datetime',
        'uninstalled_at' => 'datetime',
    ];

    /**
     * Relation vers le site (tenant)
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'site_id', 'site_id');
    }

    /**
     * Scope: modules actifs uniquement
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 'YES');
    }

    /**
     * Scope: modules inactifs uniquement
     */
    public function scopeInactive($query)
    {
        return $query->where('is_active', 'NO');
    }

    /**
     * Scope: modules d'un tenant spécifique
     */
    public function scopeForTenant($query, int $siteId)
    {
        return $query->where('site_id', $siteId);
    }

    /**
     * Helper: Vérifier si le module est actif
     */
    public function isActive(): bool
    {
        return $this->is_active === 'YES';
    }
}
```

### Convention ENUM

Le projet utilise `ENUM('YES', 'NO')` pour les booléens. Le modèle stocke 'YES' ou 'NO', pas true/false.

### Relation avec Tenant

Le modèle `App\Models\Tenant` existe déjà et mappe vers `t_sites`. La FK utilise `site_id` comme clé primaire.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.4]
- [Source: CLAUDE.md#Tenant-Model]

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- ✅ Modèle SiteModule créé dans `Modules/Superadmin/Entities/`
- ✅ Connexion `mysql` (centrale) configurée
- ✅ Table `t_site_modules` configurée
- ✅ Timestamps Laravel désactivés
- ✅ Casts JSON pour config, datetime pour dates
- ✅ Relation `site()` vers Tenant définie
- ✅ Scopes: `active()`, `inactive()`, `forTenant($siteId)`
- ✅ Helper `isActive()` ajouté
- ✅ $fillable configuré
- ✅ Modèle testé avec succès (query count fonctionne)

### File List

**Nouveaux fichiers créés:**
- Modules/Superadmin/Entities/SiteModule.php

### Change Log

- 2026-01-28: Story 1.4 implémentée - Modèle SiteModule créé

