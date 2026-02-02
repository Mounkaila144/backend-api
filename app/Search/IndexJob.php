<?php

namespace App\Search;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job générique pour indexer n'importe quel modèle dans Meilisearch
 */
class IndexJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [10, 30, 60];

    public function __construct(
        protected string $modelClass,
        protected int|string $modelId,
        protected int $tenantId,
        protected string $action = 'index' // 'index' ou 'delete'
    ) {}

    public function handle(): void
    {
        try {
            // Initialiser le tenant
            $tenant = \App\Models\Tenant::find($this->tenantId);
            if (!$tenant) return;

            tenancy()->initialize($tenant);

            // Récupérer le modèle
            $model = $this->modelClass::find($this->modelId);

            if ($this->action === 'delete' || !$model) {
                // Pour delete, on crée une instance temporaire juste pour avoir l'index name
                $temp = new $this->modelClass;
                $temp->{$temp->getKeyName()} = $this->modelId;
                SearchManager::delete($temp);
            } else {
                SearchManager::index($model);
            }

        } catch (\Exception $e) {
            Log::error("IndexJob failed", [
                'model' => $this->modelClass,
                'id' => $this->modelId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    public function tags(): array
    {
        return ['search', 'tenant:' . $this->tenantId, class_basename($this->modelClass)];
    }
}
