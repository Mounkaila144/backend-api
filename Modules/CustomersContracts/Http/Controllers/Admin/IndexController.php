<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Admin Controller (TENANT DATABASE)
 */
class IndexController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Admin index - Tenant database',
            'module' => 'CustomersContracts',
            'data' => [],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource created successfully',
            'data' => [],
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => ['id' => $id],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource updated successfully',
            'data' => ['id' => $id],
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Resource deleted successfully',
        ]);
    }
}