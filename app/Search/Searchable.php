<?php

namespace App\Search;

use Illuminate\Database\Eloquent\Model;

/**
 * Trait Searchable - Ajoute la recherche Meilisearch à n'importe quel modèle
 *
 * UTILISATION:
 * 1. Ajouter le trait au modèle: use \App\Search\Searchable;
 * 2. Définir les attributs à indexer: protected array $searchable = ['name', 'email'];
 * 3. (Optionnel) Définir les filtres: protected array $searchableFilters = ['status', 'is_active'];
 * 4. C'est tout ! L'indexation est automatique.
 */
trait Searchable
{
    public static function bootSearchable(): void
    {
        static::created(fn(Model $model) => SearchManager::dispatch($model, 'index'));
        static::updated(fn(Model $model) => SearchManager::dispatch($model, 'index'));
        static::deleted(fn(Model $model) => SearchManager::dispatch($model, 'delete'));
    }

    /** Attributs à indexer (à définir dans le modèle) */
    public function getSearchableAttributes(): array
    {
        return $this->searchable ?? ['id'];
    }

    /** Attributs filtrables (à définir dans le modèle) */
    public function getFilterableAttributes(): array
    {
        return $this->searchableFilters ?? [];
    }

    /** Attributs triables (à définir dans le modèle) */
    public function getSortableAttributes(): array
    {
        return $this->searchableSortable ?? ['id'];
    }

    /** Nom de l'index Meilisearch */
    public function getSearchIndexName(): string
    {
        $prefix = config('services.meilisearch.index_prefix', 'saas_');
        $tenantId = tenancy()->tenant?->site_id ?? 'default';
        $table = $this->getTable();
        return "{$prefix}tenant_{$tenantId}_{$table}";
    }

    /** Convertit le modèle en document Meilisearch */
    public function toSearchDocument(): array
    {
        $doc = ['id' => $this->getKey()];
        foreach ($this->getSearchableAttributes() as $attr) {
            $doc[$attr] = $this->$attr;
        }
        foreach ($this->getFilterableAttributes() as $attr) {
            $doc[$attr] = $this->$attr;
        }
        return $doc;
    }
}
