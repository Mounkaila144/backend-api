<?php

namespace Modules\AppDomoprime\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\AppDomoprime\Entities\DomoprimeEnergy;
use Modules\AppDomoprime\Entities\DomoprimeIsoOccupation;
use Modules\AppDomoprime\Entities\DomoprimeIsoTypeLayer;
use Modules\AppDomoprime\Entities\DomoprimeIsoCumacPrice;
use Modules\AppDomoprime\Entities\DomoprimePreviousEnergy;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;

class AppDomoprimeController extends Controller
{
    public function filterOptions(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        $formatWithTranslations = fn ($collection) => $collection->map(fn ($item) => [
            'id' => $item->id,
            'name' => $item->translations->first()?->value ?? $item->name,
        ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'energies' => $formatWithTranslations(
                    DomoprimeEnergy::with(['translations' => $withTranslations])->get()
                ),
                'occupations' => $formatWithTranslations(
                    DomoprimeIsoOccupation::with(['translations' => $withTranslations])->get()
                ),
                'layer_types' => $formatWithTranslations(
                    DomoprimeIsoTypeLayer::with(['translations' => $withTranslations])->get()
                ),
                'pricings' => DomoprimeIsoCumacPrice::where('status', 'ACTIVE')
                    ->where('is_active', 'YES')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name])
                    ->values(),
                'previous_energies' => $formatWithTranslations(
                    DomoprimePreviousEnergy::with(['translations' => $withTranslations])->get()
                ),
            ],
        ]);
    }

    /**
     * Get ISO customer request by contract ID
     */
    public function getIsoRequestByContract(int $contractId): JsonResponse
    {
        $isoRequest = DomoprimeIsoCustomerRequest::where('contract_id', $contractId)->first();

        if (!$isoRequest) {
            return response()->json([
                'success' => false,
                'message' => 'ISO request not found for this contract',
                'data' => null,
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $isoRequest,
        ]);
    }
}
