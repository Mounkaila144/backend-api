<?php

namespace Modules\Superadmin\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Modules\Superadmin\Http\Resources\AuditLogResource;
use Spatie\Activitylog\Models\Activity;

class AuditController extends Controller
{
    /**
     * Liste les entrées d'audit avec filtrage
     * GET /api/superadmin/audit
     *
     * Query params:
     * - tenant_id: Filtrer par tenant
     * - module: Filtrer par nom de module
     * - action: Filtrer par action (module.activated, module.deactivated, etc.)
     * - from: Date de début (format ISO 8601)
     * - to: Date de fin (format ISO 8601)
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Activity::where('log_name', 'superadmin');

        // Filtre par tenant
        if ($tenantId = $request->query('tenant_id')) {
            $query->where('properties->tenant_id', $tenantId);
        }

        // Filtre par module
        if ($module = $request->query('module')) {
            $query->where('properties->module', $module);
        }

        // Filtre par action
        if ($action = $request->query('action')) {
            $query->where('properties->action', $action);
        }

        // Filtre par date
        if ($from = $request->query('from')) {
            $query->where('created_at', '>=', $from);
        }
        if ($to = $request->query('to')) {
            $query->where('created_at', '<=', $to);
        }

        $activities = $query->orderByDesc('created_at')->paginate(50);

        return AuditLogResource::collection($activities);
    }
}
