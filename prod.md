
Fichiers créés (3 fichiers, ~200 lignes au total)

app/Search/
├── Searchable.php      # Trait à ajouter aux modèles (50 lignes)
├── SearchManager.php   # Gère toute la logique Meilisearch (130 lignes)
└── IndexJob.php        # Job asynchrone générique (55 lignes)

Fichiers supprimés du module User

❌ Modules/User/Observers/UserObserver.php
❌ Modules/User/Jobs/IndexUserJob.php
❌ Modules/User/Jobs/RemoveUserFromIndexJob.php

  ---
Comment ajouter Meilisearch à n'importe quel module

Étape unique : Ajouter 4 lignes au modèle

// Modules/Customer/Entities/Customer.php
  <?php

  namespace Modules\Customer\Entities;

  use App\Search\Searchable;  // ← Ajouter cet import
  use Illuminate\Database\Eloquent\Model;

  class Customer extends Model
  {
      use Searchable;  // ← Ajouter ce trait

      // Attributs pour la recherche full-text
      protected array $searchable = ['name', 'email', 'phone', 'company'];

      // Attributs filtrables (optionnel)
      protected array $searchableFilters = ['status', 'is_active', 'type'];

      // Attributs triables (optionnel)
      protected array $searchableSortable = ['id', 'name', 'created_at'];

      // ... reste du modèle
  }

  C'est tout ! L'indexation est automatique.

  ---
  Exemple pour tes autres modules

  Module Contract

  class Contract extends Model
  {
      use Searchable;
      protected array $searchable = ['reference', 'title', 'description'];
      protected array $searchableFilters = ['status', 'customer_id', 'type'];
  }

  Module Product

  class Product extends Model
  {
      use Searchable;
      protected array $searchable = ['name', 'sku', 'description'];
      protected array $searchableFilters = ['category_id', 'is_active', 'price'];
  }

  ---
  Recherche dans un Repository

  use App\Search\SearchManager;

  // Recherche simple
  $results = SearchManager::search(new Customer, 'John', [
      'limit' => 20,
      'offset' => 0,
      'filter' => ['status' => 'active'],
      'sort' => ['name:asc']
  ]);

  // $results = ['hits' => [...], 'totalHits' => 150, 'processingTimeMs' => 3]

  ---
  Réindexation (une seule fois par tenant)

  # Réindexer tous les utilisateurs
  php artisan tinker
  >>> \App\Search\SearchManager::reindexAll(\Modules\User\Entities\User::class)

  # Ou créer une commande artisan générique si besoin

  ---
  Résumé des gains
  ┌─────────────────────────────┬─────────────────────┐
  │            Avant            │        Après        │
  ├─────────────────────────────┼─────────────────────┤
  │ ~350 lignes par module      │ 4 lignes par modèle │
  ├─────────────────────────────┼─────────────────────┤
  │ Observer + 2 Jobs + Service │ 1 seul trait        │
  ├─────────────────────────────┼─────────────────────┤
  │ Configuration manuelle      │ Auto-configuration  │
  ├─────────────────────────────┼─────────────────────┤
  │ Code dupliqué × 100 modules │ 1 système partagé   │
  └─────────────────────────────┴─────────────────────┘




Prérequis en production

# Démarrer le queue worker (supervisor recommandé)
php artisan queue:work --queue=search,default

# OU avec Horizon (recommandé pour production)
php artisan horizon

Configuration Supervisor (/etc/supervisor/conf.d/laravel-worker.conf):
[program:laravel-search-worker]
command=php /path/to/artisan queue:work --queue=search --sleep=3 --tries=3
numprocs=2
autostart=true
autorestart=true

  ---
Réindexation initiale (une seule fois par tenant)

Pour les tenants existants qui ont déjà des utilisateurs :

# Réindexer tous les utilisateurs d'un tenant
php artisan users:reindex --tenant=1 --configure

Après ça, plus jamais besoin de réindexer manuellement.
