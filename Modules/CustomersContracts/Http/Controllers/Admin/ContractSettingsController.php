<?php

namespace Modules\CustomersContracts\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\CustomersContracts\Http\Requests\UpdateContractSettingsRequest;
use Modules\CustomersContracts\Services\ContractSettingsService;

class ContractSettingsController extends Controller
{
    public function __construct(protected ContractSettingsService $settings)
    {
    }

    /**
     * GET /api/admin/customerscontracts/settings
     */
    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->settings->all(),
        ]);
    }

    /**
     * PUT /api/admin/customerscontracts/settings
     */
    public function update(UpdateContractSettingsRequest $request): JsonResponse
    {
        $this->settings->save($request->validated());
        $this->settings->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully.',
            'data' => $this->settings->all(),
        ]);
    }

    /**
     * GET /api/admin/customerscontracts/settings/options
     * Returns select options for dropdowns (statuses, attributions, companies).
     */
    public function options(Request $request): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $formatStatus = fn ($collection) => $collection->map(fn ($s) => [
            'id' => $s->id,
            'name' => $s->translations->first()?->value ?? $s->name ?? ('Status #' . $s->id),
        ]);

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        return response()->json([
            'success' => true,
            'data' => [
                'contract_statuses' => $formatStatus(
                    \Modules\CustomersContracts\Entities\CustomerContractStatus::with(['translations' => $withTranslations])->get()
                ),
                'attributions' => \Modules\User\Entities\UserAttribution::with(['translations' => fn ($q) => $q->where('lang', $lang)])
                    ->get()
                    ->map(fn ($a) => [
                        'id' => $a->id,
                        'name' => $a->translations->first()?->value ?? $a->name ?? ('Attribution #' . $a->id),
                    ]),
                'companies' => \Modules\CustomersContracts\Entities\CustomerContractCompany::select('id', 'name')
                    ->where('is_active', 'YES')
                    ->orderBy('name')
                    ->get()
                    ->map(fn ($c) => ['id' => $c->id, 'name' => $c->name]),
            ],
        ]);
    }
}
