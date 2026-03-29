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

    /**
     * Get ISO customer request by meeting ID
     */
    public function getIsoRequestByMeeting(int $meetingId): JsonResponse
    {
        $isoRequest = DomoprimeIsoCustomerRequest::where('meeting_id', $meetingId)->first();

        if (!$isoRequest) {
            return response()->json([
                'success' => true,
                'data' => null,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $isoRequest,
        ]);
    }

    /**
     * List calculations for a meeting (Demandes tab).
     * Mirrors Symfony: ajaxListPartialRequestForMeetingAction
     */
    public function listCalculationsForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');
        $withTranslations = fn ($q) => $q->whereIn('lang', [$lang, '']);

        $calculations = \Modules\AppDomoprime\Entities\DomoprimeCalculation::where('meeting_id', $meetingId)
            ->with([
                'region',
                'zone',
                'sector',
                'energy.translations' => $withTranslations,
                'domoprimeClass.translations' => $withTranslations,
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($calc) {
                $energyTrans = $calc->energy?->translations->first();
                $classTrans = $calc->domoprimeClass?->translations->first();

                // Resolve user names via DB (no relation on model)
                $user = $calc->user_id ? \DB::connection('tenant')->table('t_users')
                    ->select('firstname', 'lastname')->find($calc->user_id) : null;
                $acceptedBy = $calc->accepted_by_id ? \DB::connection('tenant')->table('t_users')
                    ->select('firstname', 'lastname')->find($calc->accepted_by_id) : null;

                return [
                    'id' => $calc->id,
                    'region' => $calc->region?->name ?? '---',
                    'zone' => $calc->zone?->code ?? '---',
                    'sector' => $calc->sector?->name ?? '---',
                    'energy' => $energyTrans?->value ?? $calc->energy?->name ?? '---',
                    'class' => $classTrans?->value ?? $calc->domoprimeClass?->name ?? '---',
                    'revenue' => (float) ($calc->revenue ?? 0),
                    'number_of_people' => (float) ($calc->number_of_people ?? 0),
                    'qmac' => (float) ($calc->qmac ?? 0),
                    'qmac_value' => (float) ($calc->qmac_value ?? 0),
                    'user' => $user ? mb_strtoupper(trim($user->firstname . ' ' . $user->lastname)) : '---',
                    'accepted_by' => $acceptedBy ? mb_strtoupper(trim($acceptedBy->firstname . ' ' . $acceptedBy->lastname)) : null,
                    'created_at' => $calc->created_at?->format('Y-m-d H:i:s'),
                    'status' => $calc->status,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $calculations,
        ]);
    }
}
