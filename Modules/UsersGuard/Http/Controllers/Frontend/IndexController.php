<?php

namespace Modules\UsersGuard\Http\Controllers\Frontend;

use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class IndexController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'UsersGuard Frontend Module',
            'tenant' => [
                'id' => tenancy()->tenant?->site_id,
                'host' => tenancy()->tenant?->site_host,
            ],
        ]);
    }
}
