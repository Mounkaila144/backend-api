<?php

namespace Modules\User\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\User\Http\Resources\UserResource;
use Modules\User\Services\UserCacheService;
use Modules\User\Services\UserSearchService;

/**
 * UserSearchController
 * Gère la recherche full-text des utilisateurs avec Meilisearch
 */
class UserSearchController extends Controller
{
    public function __construct(
        protected UserSearchService $searchService,
        protected UserCacheService $cacheService
    ) {
    }

    /**
     * Recherche full-text des utilisateurs
     * GET /api/admin/users/search
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => 'required|string|min:1|max:255',
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
            'filter' => 'nullable|array',
            'sort' => 'nullable|array',
        ]);

        $query = $validated['q'];
        $options = [
            'limit' => $validated['limit'] ?? 20,
            'offset' => $validated['offset'] ?? 0,
        ];

        // Ajouter les filtres si présents
        if (!empty($validated['filter'])) {
            $options['filter'] = $validated['filter'];
        }

        // Ajouter le tri si présent
        if (!empty($validated['sort'])) {
            $options['sort'] = $validated['sort'];
        }

        // Vérifier si Meilisearch est disponible
        if (!$this->searchService->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Search service not available. Using fallback search.',
                'fallback' => true,
            ], 503);
        }

        // Effectuer la recherche
        $result = $this->searchService->search($query, $options);

        // Si des résultats, charger les modèles complets
        $users = [];
        if (!empty($result['hits'])) {
            $users = $this->searchService->searchUsers($query, $options);
        }

        return response()->json([
            'success' => true,
            'data' => UserResource::collection($users),
            'meta' => [
                'query' => $query,
                'total_hits' => $result['totalHits'],
                'processing_time_ms' => $result['processingTimeMs'],
                'limit' => $options['limit'],
                'offset' => $options['offset'],
                'fallback' => $result['fallback'] ?? false,
            ],
        ]);
    }

    /**
     * Réindexe tous les utilisateurs
     * POST /api/admin/users/search/reindex
     *
     * @return JsonResponse
     */
    public function reindex(): JsonResponse
    {
        if (!$this->searchService->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Search service not available',
            ], 503);
        }

        $result = $this->searchService->reindexAll();

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'data' => [
                'total_indexed' => $result['total_indexed'] ?? 0,
            ],
        ], $result['success'] ? 200 : 500);
    }

    /**
     * Retourne les statistiques de l'index
     * GET /api/admin/users/search/stats
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        $indexStats = $this->searchService->getIndexStats();
        $cacheDiagnostics = $this->cacheService->getDiagnostics();

        return response()->json([
            'success' => true,
            'data' => [
                'search' => [
                    'provider' => 'meilisearch',
                    'available' => $this->searchService->isAvailable(),
                    'stats' => $indexStats,
                ],
                'cache' => $cacheDiagnostics,
            ],
        ]);
    }

    /**
     * Configure l'index Meilisearch
     * POST /api/admin/users/search/configure
     *
     * @return JsonResponse
     */
    public function configure(): JsonResponse
    {
        if (!$this->searchService->isAvailable()) {
            return response()->json([
                'success' => false,
                'message' => 'Search service not available',
            ], 503);
        }

        $success = $this->searchService->configureIndex();

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Index configured successfully' : 'Failed to configure index',
        ]);
    }
}
