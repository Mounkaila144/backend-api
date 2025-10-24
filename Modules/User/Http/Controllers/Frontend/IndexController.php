<?php

namespace Modules\User\Http\Controllers\Frontend;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

/**
 * Frontend Controller (TENANT DATABASE)
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
            'message' => 'Frontend index - Tenant database',
            'module' => 'User',
            'data' => [],
        ]);
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
}