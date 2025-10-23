<?php

namespace Modules\UsersGuard\Http\Controllers\Superadmin;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class IndexController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'UsersGuard Superadmin Module',
            'database' => 'central',
        ]);
    }
}
