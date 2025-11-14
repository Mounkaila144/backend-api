<?php

/**
 * EXEMPLE DE CONTRÔLEUR AVEC TRADUCTIONS
 *
 * Ce fichier montre comment utiliser le système de traduction
 * dans un contrôleur Laravel avec texte anglais par défaut et
 * traductions JSON pour les autres langues.
 */

namespace Modules\Products\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Modules\Products\Entities\Product;

class ProductController extends Controller
{
    /**
     * EXEMPLE 1 : Liste des produits
     */
    public function index(): JsonResponse
    {
        $products = Product::paginate(10);

        return response()->json([
            'message' => __('Products retrieved successfully'),
            'data' => $products,
            'meta' => [
                'pagination' => __('Showing :from to :to of :total results', [
                    'from' => $products->firstItem(),
                    'to' => $products->lastItem(),
                    'total' => $products->total()
                ])
            ]
        ]);

        /**
         * TRADUCTIONS (Modules/Products/Resources/lang/fr.json) :
         * {
         *     "Products retrieved successfully": "Produits récupérés avec succès",
         *     "Showing :from to :to of :total results": "Affichage de :from à :to sur :total résultats"
         * }
         */
    }

    /**
     * EXEMPLE 2 : Créer un produit
     */
    public function store(Request $request): JsonResponse
    {
        // Validation
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        // Créer le produit
        $product = Product::create($validated);

        return response()->json([
            'message' => __('Product created successfully'),
            'data' => $product
        ], 201);

        /**
         * TRADUCTION (fr.json) :
         * {
         *     "Product created successfully": "Produit créé avec succès"
         * }
         */
    }

    /**
     * EXEMPLE 3 : Afficher un produit
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json([
            'message' => __('Product retrieved successfully'),
            'data' => $product
        ]);

        /**
         * TRADUCTION (fr.json) :
         * {
         *     "Product retrieved successfully": "Produit récupéré avec succès"
         * }
         */
    }

    /**
     * EXEMPLE 4 : Mettre à jour un produit
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'stock' => 'sometimes|integer|min:0',
        ]);

        $product->update($validated);

        return response()->json([
            'message' => __('Product updated successfully'),
            'data' => $product
        ]);

        /**
         * TRADUCTION (fr.json) :
         * {
         *     "Product updated successfully": "Produit mis à jour avec succès"
         * }
         */
    }

    /**
     * EXEMPLE 5 : Supprimer un produit
     */
    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'message' => __('Product deleted successfully')
        ]);

        /**
         * TRADUCTION (fr.json) :
         * {
         *     "Product deleted successfully": "Produit supprimé avec succès"
         * }
         */
    }

    /**
     * EXEMPLE 6 : Gestion d'erreur personnalisée
     */
    public function checkStock(Product $product): JsonResponse
    {
        if ($product->stock <= 0) {
            return response()->json([
                'error' => __('Product is out of stock'),
                'data' => [
                    'product_id' => $product->id,
                    'stock' => $product->stock
                ]
            ], 400);
        }

        if ($product->stock < 10) {
            return response()->json([
                'warning' => __('Low stock warning'),
                'message' => __('Only :count items remaining', ['count' => $product->stock]),
                'data' => $product
            ]);
        }

        return response()->json([
            'message' => __('Stock is available'),
            'data' => $product
        ]);

        /**
         * TRADUCTIONS (fr.json) :
         * {
         *     "Product is out of stock": "Produit en rupture de stock",
         *     "Low stock warning": "Avertissement de stock faible",
         *     "Only :count items remaining": "Seulement :count articles restants",
         *     "Stock is available": "Stock disponible"
         * }
         */
    }

    /**
     * EXEMPLE 7 : Validation personnalisée avec messages traduits
     */
    public function storeWithCustomValidation(Request $request): JsonResponse
    {
        $validator = \Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => __('Validation error'),
                'message' => __('Please check your input'),
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::create($validator->validated());

        return response()->json([
            'message' => __('Product created successfully'),
            'data' => $product
        ], 201);

        /**
         * TRADUCTIONS (fr.json) :
         * {
         *     "Validation error": "Erreur de validation",
         *     "Please check your input": "Veuillez vérifier votre saisie"
         * }
         */
    }

    /**
     * EXEMPLE 8 : Recherche de produits
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->input('q');

        if (empty($query)) {
            return response()->json([
                'error' => __('Search query is required'),
            ], 400);
        }

        $products = Product::where('name', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->paginate(10);

        if ($products->isEmpty()) {
            return response()->json([
                'message' => __('No products found'),
                'data' => []
            ]);
        }

        return response()->json([
            'message' => __(':count products found', ['count' => $products->total()]),
            'data' => $products
        ]);

        /**
         * TRADUCTIONS (fr.json) :
         * {
         *     "Search query is required": "La requête de recherche est requise",
         *     "No products found": "Aucun produit trouvé",
         *     ":count products found": ":count produits trouvés"
         * }
         */
    }

    /**
     * EXEMPLE 9 : Actions multiples (bulk)
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $ids = $request->input('ids', []);

        if (empty($ids)) {
            return response()->json([
                'error' => __('No products selected')
            ], 400);
        }

        $count = Product::whereIn('id', $ids)->delete();

        return response()->json([
            'message' => __(':count products deleted successfully', ['count' => $count])
        ]);

        /**
         * TRADUCTIONS (fr.json) :
         * {
         *     "No products selected": "Aucun produit sélectionné",
         *     ":count products deleted successfully": ":count produits supprimés avec succès"
         * }
         */
    }

    /**
     * EXEMPLE 10 : Export de données
     */
    public function export(Request $request): JsonResponse
    {
        $format = $request->input('format', 'csv');

        if (!in_array($format, ['csv', 'excel', 'pdf'])) {
            return response()->json([
                'error' => __('Invalid export format'),
                'message' => __('Supported formats are: :formats', [
                    'formats' => 'CSV, Excel, PDF'
                ])
            ], 400);
        }

        // Logique d'export...

        return response()->json([
            'message' => __('Products exported successfully'),
            'format' => $format,
            'url' => url("/exports/products.{$format}")
        ]);

        /**
         * TRADUCTIONS (fr.json) :
         * {
         *     "Invalid export format": "Format d'export invalide",
         *     "Supported formats are: :formats": "Formats supportés : :formats",
         *     "Products exported successfully": "Produits exportés avec succès"
         * }
         */
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════
 * FICHIER DE TRADUCTION COMPLET POUR CE CONTRÔLEUR
 * ═══════════════════════════════════════════════════════════════════
 *
 * Modules/Products/Resources/lang/fr.json
 * {
 *     "Products retrieved successfully": "Produits récupérés avec succès",
 *     "Product retrieved successfully": "Produit récupéré avec succès",
 *     "Product created successfully": "Produit créé avec succès",
 *     "Product updated successfully": "Produit mis à jour avec succès",
 *     "Product deleted successfully": "Produit supprimé avec succès",
 *     "Product is out of stock": "Produit en rupture de stock",
 *     "Low stock warning": "Avertissement de stock faible",
 *     "Only :count items remaining": "Seulement :count articles restants",
 *     "Stock is available": "Stock disponible",
 *     "Validation error": "Erreur de validation",
 *     "Please check your input": "Veuillez vérifier votre saisie",
 *     "Search query is required": "La requête de recherche est requise",
 *     "No products found": "Aucun produit trouvé",
 *     ":count products found": ":count produits trouvés",
 *     "No products selected": "Aucun produit sélectionné",
 *     ":count products deleted successfully": ":count produits supprimés avec succès",
 *     "Invalid export format": "Format d'export invalide",
 *     "Supported formats are: :formats": "Formats supportés : :formats",
 *     "Products exported successfully": "Produits exportés avec succès",
 *     "Showing :from to :to of :total results": "Affichage de :from à :to sur :total résultats"
 * }
 *
 * ═══════════════════════════════════════════════════════════════════
 * UTILISATION DANS UNE REQUÊTE API
 * ═══════════════════════════════════════════════════════════════════
 *
 * # Requête en anglais (par défaut)
 * curl https://api.example.com/products
 * {
 *     "message": "Products retrieved successfully",
 *     "data": [...]
 * }
 *
 * # Requête en français (avec header)
 * curl -H "Accept-Language: fr" https://api.example.com/products
 * {
 *     "message": "Produits récupérés avec succès",
 *     "data": [...]
 * }
 *
 * ═══════════════════════════════════════════════════════════════════
 */
