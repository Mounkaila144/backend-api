<?php

namespace Modules\AppDomoprimeISO3\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Collection;
use Modules\AppDomoprime\Entities\DomoprimeCalculation;
use Modules\AppDomoprime\Entities\DomoprimeClass;
use Modules\AppDomoprime\Entities\DomoprimeEnergy;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprime\Entities\DomoprimeProductCalculation;
use Modules\AppDomoprime\Entities\DomoprimeProductSectorEnergy;
use Modules\AppDomoprime\Entities\DomoprimeZone;
use Modules\AppDomoprimeISO3\Entities\DomoprimeIsoCumacClassRegionPrice;
use Modules\AppDomoprimeISO3\Entities\DomoprimePolluterClassSectorEnergy;
use Modules\CustomersContracts\Entities\CustomerContract;

class Iso3ResultsController extends Controller
{
    public function resultsForContract(Request $request, int $contractId): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasCredential([['app_domoprime_iso3_contract_view_cumac_results']])) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden',
            ], 403);
        }

        $lang = $request->query('lang', 'fr');

        $contract = CustomerContract::with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            'polluter',
            'products',
            'domoprimeIsoRequest',
        ])->find($contractId);

        if (!$contract) {
            return response()->json([
                'success' => false,
                'message' => 'Contract not found',
            ], 404);
        }

        if (!$contract->polluter_id) {
            return response()->json([
                'success' => true,
                'data' => [
                    'has_polluter' => false,
                    'info' => null,
                    'cumac' => null,
                ],
            ]);
        }

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        // Get the latest ISO request for this contract
        $isoRequest = $contract->domoprimeIsoRequest->last();
        $customer = $contract->customer;
        $address = $customer?->addresses->first();

        if (!$isoRequest || !$address) {
            return $this->returnCalculationError(
                $contract,
                'Missing ISO request or customer address',
                $user,
                $lang
            );
        }

        try {
            // Step 1: Resolve zone from customer postcode
            $zone = $this->resolveZone($address->postcode);
            if (!$zone) {
                return $this->returnCalculationError(
                    $contract,
                    'Zone not found for postcode: ' . $address->postcode,
                    $user,
                    $lang
                );
            }

            $zone->load(['region', 'sectorModel']);
            $region = $zone->region;

            // Step 2: Get energy from ISO request
            $energy = DomoprimeEnergy::with(['translations' => $withTranslations])
                ->find($isoRequest->energy_id);

            // Step 3: Resolve class via cumac class region price lookup
            $class = $this->resolveClass(
                $isoRequest->pricing_id,
                $zone->region_id,
                $isoRequest->revenue,
                $isoRequest->number_of_people,
                $withTranslations
            );

            // Step 4: Get polluter pricing
            $polluterPricing = null;
            if ($class && $energy) {
                $polluterPricing = DomoprimePolluterClassSectorEnergy::with('coefficients')
                    ->where([
                        'class_id' => $class->id,
                        'sector_id' => $zone->sector_id,
                        'energy_id' => $energy->id,
                        'polluter_id' => $contract->polluter_id,
                    ])->first();
            }

            // Step 5: Calculate QMAC per product using the correct pricing table
            // Symfony uses t_domoprime_iso_product_sector_energy_class (per class/cumac)
            // NOT t_domoprime_product_sector_energy (generic)
            $productCalculations = $this->calculateProductPrices(
                $contract,
                $isoRequest,
                $zone,
                $energy,
                $class,
                $polluterPricing
            );

            // Step 6: Check ANAH availability
            $isAnaAvailable = $this->checkAnahAvailability(
                $isoRequest->number_of_parts,
                $isoRequest->revenue
            );

            // Step 7: Save calculation to DB
            $this->saveCalculation(
                $contract,
                $isoRequest,
                $zone,
                $energy,
                $class,
                $productCalculations,
                $isAnaAvailable,
                $polluterPricing,
                $user
            );

            // Step 8: Get polluter details for ANAH section
            $polluterCompany = \DB::connection('tenant')
                ->table('t_partner_polluter_company')
                ->find($contract->polluter_id);

            $engineType = $polluterCompany?->type ?? null; // ITE, ISO, BOILER, PAC, TYPE1, TYPE2

            $levelLabel = $class?->translations->first()?->value
                ?? $class?->name
                ?? '----';
            $energyLabel = $energy?->translations->first()?->value
                ?? $energy?->name;

            // Step 9: Validate CUMAC engine per type (like Symfony per-type engines)
            // Symfony throws "No price list" when:
            // - No pricing found at all, OR
            // - Products with surface have no corresponding pricing
            //   (e.g., ITE product has surface_ite=2 but no pricing for cumac_id=5)
            $cumacErrors = [];
            if ($class && $energy) {
                $hasProductWithSurfaceAndPricing = $productCalculations
                    ->where('surface', '>', 0)
                    ->where('qmac_value', '>', 0)
                    ->isNotEmpty();

                if (!$hasProductWithSurfaceAndPricing) {
                    $cumacErrors[] = "Moteur CUMAC {$engineType}: Aucun tarif pour la classe [{$levelLabel}], "
                        . "énergie [{$energyLabel}] et le secteur [{$zone->sectorModel?->name}]";
                }
            }

            // Step 10: Return results (matching Symfony template structure)
            $info = [
                'zone' => $zone->sectorModel?->name,
                'region' => $region?->name,
                'energy' => $energyLabel,
                'revenue' => (float) $isoRequest->revenue,
                'level' => $levelLabel,
                'number_of_people' => (float) $isoRequest->number_of_people,
            ];

            $cumac = null;
            if ($productCalculations->isNotEmpty() && empty($cumacErrors)) {
                $cumac = [
                    'prices' => $productCalculations->map(fn (array $pc) => [
                        'qmac' => $pc['surface'] > 0 ? $pc['qmac_value'] : null,
                        'has_surface' => $pc['surface'] > 0,
                    ]),
                    'is_ana_available' => $isAnaAvailable,
                ];
            }

            // ANAH section (always shown for ITE/PAC/BOILER/TYPE1/TYPE2)
            $anah = null;
            if ($engineType && !in_array($engineType, ['ISO'])) {
                $anah = [
                    'engine' => $engineType . '2',
                    'polluter_name' => $polluterCompany?->name,
                    'number_of_parts' => (float) $isoRequest->number_of_parts,
                    'level' => $levelLabel,
                    'is_available' => $isAnaAvailable,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_polluter' => true,
                    'engine_type' => $engineType,
                    'info' => $info,
                    'cumac' => $cumac,
                    'cumac_errors' => $cumacErrors,
                    'anah' => $anah,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('ISO3 calculation failed for contract', ['contract_id' => $contractId, 'error' => $e->getMessage()]);
            $this->saveCalculationWithError($contract, $e->getMessage(), $user);

            return $this->returnCalculationError(
                $contract,
                $e->getMessage(),
                $user,
                $lang,
                false
            );
        }
    }

    /**
     * Resolve geographic zone from customer postcode.
     */
    private function resolveZone(string $postcode): ?DomoprimeZone
    {
        $dept = substr($postcode, 0, 2);

        // DOM-TOM: postcodes starting with 97 use 3-digit department codes
        if (str_starts_with($postcode, '97')) {
            $dept = substr($postcode, 0, 3);
        }

        return DomoprimeZone::where('code', $dept)->first();
    }

    /**
     * Resolve energy class via cumac pricing / region / revenue / household size lookup.
     */
    private function resolveClass(
        ?int $pricingId,
        ?int $regionId,
        float $revenue,
        float $numberOfPeople,
        \Closure $withTranslations
    ): ?DomoprimeClass {
        if (!$pricingId || !$regionId) {
            return null;
        }

        $classRegionPrice = DomoprimeIsoCumacClassRegionPrice::where('cumac_id', $pricingId)
            ->where('region_id', $regionId)
            ->where('price', '>=', $revenue)
            ->where('number_of_people', '>=', $numberOfPeople)
            ->orderBy('price')
            ->orderBy('number_of_people')
            ->first();

        if (!$classRegionPrice) {
            return null;
        }

        return DomoprimeClass::with(['translations' => $withTranslations])
            ->find($classRegionPrice->class_id);
    }

    /**
     * Calculate QMAC prices for each product on the contract.
     *
     * Uses t_domoprime_iso_product_sector_energy_class (like Symfony's per-type engines)
     * NOT t_domoprime_product_sector_energy (generic table).
     *
     * Symfony flow:
     * 1. Look up pricing from iso_product_sector_energy_class WHERE class_id, cumac_id, energy_id, sector_id
     *    AND product_id is in the contract products
     * 2. If no pricing found → throw "No price list" error
     * 3. Get the product's surface from the ISO request
     * 4. Get the surface coefficient from the polluter's coefficient table
     * 5. QMAC = base_price * surface * coefficient
     */
    private function calculateProductPrices(
        CustomerContract $contract,
        DomoprimeIsoCustomerRequest $isoRequest,
        DomoprimeZone $zone,
        ?DomoprimeEnergy $energy,
        ?DomoprimeClass $class,
        ?DomoprimePolluterClassSectorEnergy $polluterPricing
    ): Collection {
        if (!$energy || !$class) {
            return collect();
        }

        $productIds = $contract->products->pluck('product_id')->toArray();
        if (empty($productIds)) {
            return collect();
        }

        // Use the correct Symfony table: t_domoprime_iso_product_sector_energy_class
        // This table has: energy_id, cumac_id, product_id, sector_id, class_id, price
        $basePrices = \DB::connection('tenant')
            ->table('t_domoprime_iso_product_sector_energy_class')
            ->where('energy_id', $energy->id)
            ->where('sector_id', $zone->sector_id)
            ->where('class_id', $class->id)
            ->where('cumac_id', $isoRequest->pricing_id)
            ->whereIn('product_id', $productIds)
            ->get()
            ->keyBy('product_id');

        // No pricing found = Symfony throws "No price list" error
        if ($basePrices->isEmpty()) {
            return collect(); // Will be caught by cumac_errors check
        }

        // Pre-load surface coefficients for the polluter pricing
        $surfaceCoefficients = $polluterPricing?->coefficients ?? collect();

        // Build product-to-surface mapping
        $surfaceMap = $this->buildSurfaceMap($productIds, $isoRequest);

        $results = collect();

        foreach ($basePrices as $productId => $basePrice) {
            $surface = $surfaceMap[$productId] ?? 0.0;

            // Look up surface coefficient from polluter's coefficient table
            $coef = 1.0;
            if ($surface > 0 && $surfaceCoefficients->isNotEmpty()) {
                $matchingCoef = $surfaceCoefficients
                    ->where('min', '<=', $surface)
                    ->where('max', '>=', $surface)
                    ->first();

                if ($matchingCoef) {
                    $coef = (float) $matchingCoef->coef;
                }
            }

            $price = (float) $basePrice->price;
            $qmacValue = $price * $surface * $coef;

            $results->push([
                'product_id' => $productId,
                'qmac' => $qmacValue,
                'qmac_value' => $qmacValue,
                'surface' => $surface,
                'purchasing_price' => 0,
                'margin' => 0,
            ]);
        }

        return $results;
    }

    /**
     * Build a mapping of product_id => surface value.
     *
     * Assigns non-zero surfaces from the ISO request (wall, top, floor, ite)
     * to products in order. Single-product contracts get the total surface.
     */
    private function buildSurfaceMap(
        array $productIds,
        DomoprimeIsoCustomerRequest $isoRequest
    ): array {
        $surfaces = array_filter([
            (float) $isoRequest->surface_wall,
            (float) $isoRequest->surface_top,
            (float) $isoRequest->surface_floor,
            (float) $isoRequest->surface_ite,
        ], fn ($v) => $v > 0);

        // Single product: use the total of all surfaces
        if (count($productIds) === 1) {
            return [$productIds[0] => array_sum($surfaces) ?: (float) $isoRequest->surface_home];
        }

        // Multiple products: assign available surfaces in order
        $surfaceValues = array_values($surfaces);
        $surfaceMap = [];
        foreach ($productIds as $index => $productId) {
            $surfaceMap[$productId] = $surfaceValues[$index] ?? 0.0;
        }

        return $surfaceMap;
    }

    /**
     * Check ANAH (Agence Nationale de l'Habitat) availability.
     *
     * Based on household income thresholds per number of fiscal parts.
     * Uses the standard ANAH income thresholds for metropolitan France.
     */
    private function checkAnahAvailability(float $numberOfParts, float $revenue): bool
    {
        if ($numberOfParts <= 0 || $revenue <= 0) {
            return false;
        }

        // Standard ANAH income thresholds (plafonds de ressources)
        // These are the "modeste" thresholds for Île-de-France
        $thresholds = [
            1 => 25714,
            2 => 37739,
            3 => 45326,
            4 => 52925,
            5 => 60546,
        ];

        // For more than 5 parts, add ~7600 per additional part
        $parts = (int) ceil($numberOfParts);
        if ($parts > 5) {
            $threshold = $thresholds[5] + ($parts - 5) * 7613;
        } else {
            $threshold = $thresholds[$parts] ?? $thresholds[1];
        }

        return $revenue <= $threshold;
    }

    /**
     * Save the calculation results to the database.
     *
     * Marks previous calculations as non-latest, then inserts the new one
     * along with per-product breakdown.
     */
    private function saveCalculation(
        CustomerContract $contract,
        DomoprimeIsoCustomerRequest $isoRequest,
        DomoprimeZone $zone,
        ?DomoprimeEnergy $energy,
        ?DomoprimeClass $class,
        Collection $productCalculations,
        bool $isAnaAvailable,
        ?DomoprimePolluterClassSectorEnergy $polluterPricing,
        $user
    ): void {
        // Mark previous calculations as non-latest
        DomoprimeCalculation::where('contract_id', $contract->id)
            ->where('isLast', 'YES')
            ->update(['isLast' => 'NO']);

        $totalQmac = $productCalculations->sum('qmac');
        $totalQmacValue = $productCalculations->sum('qmac_value');

        $calculation = DomoprimeCalculation::create([
            'contract_id' => $contract->id,
            'customer_id' => $contract->customer_id,
            'meeting_id' => $contract->meeting_id,
            'polluter_id' => $contract->polluter_id,
            'sector_id' => $zone->sector_id,
            'zone_id' => $zone->id,
            'region_id' => $zone->region_id,
            'class_id' => $class?->id ?? 0,
            'energy_id' => $energy?->id ?? 0,
            'work_id' => null,
            'revenue' => $isoRequest->revenue ?? 0,
            'number_of_people' => $isoRequest->number_of_people ?? 0,
            'number_of_parts' => $isoRequest->number_of_parts ?? 0,
            'qmac' => $totalQmac,
            'qmac_value' => $totalQmacValue,
            'purchasing_price' => 0,
            'number_of_quotations' => 0,
            'prime' => null,
            'cee_prime' => null,
            'budget' => null,
            'ana_prime' => null,
            'is_economy_valid' => 'N',
            'is_ana_available' => $isAnaAvailable ? 'Y' : 'N',
            'subvention' => null,
            'polluter_pricing' => $polluterPricing ? (float) $polluterPricing->price : null,
            'budget_to_add_ttc' => null,
            'budget_to_add_ht' => null,
            'bbc_subvention' => null,
            'beta_surface' => 0,
            'economy' => 0,
            'cumac_coefficient' => 0,
            'min_cee' => 0,
            'coef_sale_price' => 0,
            'quotation_coefficient' => 0,
            'is_quotations_valid' => null,
            'engine_id' => null,
            'pricing_id' => $isoRequest->pricing_id,
            'cef_cef_project' => 0,
            'causes' => null,
            'margin_price' => 0,
            'user_id' => $user->id,
            'accepted_by_id' => 0,
            'isLast' => 'YES',
            'status' => 'ACCEPTED',
        ]);

        // Insert per-product calculations
        foreach ($productCalculations as $pc) {
            DomoprimeProductCalculation::create([
                'calculation_id' => $calculation->id,
                'product_id' => $pc['product_id'],
                'qmac' => $pc['qmac'],
                'qmac_value' => $pc['qmac_value'],
                'surface' => $pc['surface'],
                'purchasing_price' => $pc['purchasing_price'],
                'margin' => $pc['margin'],
            ]);
        }
    }

    /**
     * Save a calculation record with error causes.
     */
    private function saveCalculationWithError(
        CustomerContract $contract,
        string $errorMessage,
        $user
    ): void {
        DomoprimeCalculation::where('contract_id', $contract->id)
            ->where('isLast', 'YES')
            ->update(['isLast' => 'NO']);

        DomoprimeCalculation::create([
            'contract_id' => $contract->id,
            'customer_id' => $contract->customer_id,
            'meeting_id' => $contract->meeting_id,
            'polluter_id' => $contract->polluter_id,
            'sector_id' => 0,
            'zone_id' => 0,
            'region_id' => 0,
            'class_id' => 0,
            'energy_id' => 0,
            'work_id' => null,
            'revenue' => 0,
            'number_of_people' => 0,
            'number_of_parts' => 0,
            'qmac' => 0,
            'qmac_value' => 0,
            'purchasing_price' => 0,
            'number_of_quotations' => 0,
            'is_economy_valid' => 'N',
            'is_ana_available' => 'N',
            'beta_surface' => 0,
            'economy' => 0,
            'cumac_coefficient' => 0,
            'min_cee' => 0,
            'coef_sale_price' => 0,
            'quotation_coefficient' => 0,
            'cef_cef_project' => 0,
            'causes' => $errorMessage,
            'margin_price' => 0,
            'user_id' => $user->id,
            'accepted_by_id' => 0,
            'isLast' => 'YES',
            'status' => 'REFUSED',
        ]);
    }

    /**
     * ANAH-only results for a contract.
     *
     * Reproduces Symfony: ajaxResultsAnaForContractAction + app_domoprime_iso3_ajaxResultsAnaForContract.tpl
     * Only runs the ANAH engine (DomoprimeResultAnaEngine), not the CUMAC engine.
     *
     * Template shows (for ITE/PAC/BOILER/TYPE1/TYPE2):
     *   Engine, Polluter, Zone, Region, Energy, Revenue, Number of people,
     *   Number of parts, Level, Anah availability
     * For ISO: nothing (empty)
     */
    public function resultsAnaForContract(Request $request, int $contractId): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        $contract = CustomerContract::with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
            'polluter',
            'domoprimeIsoRequest',
        ])->find($contractId);

        if (!$contract) {
            return response()->json(['success' => false, 'message' => 'Contract not found'], 404);
        }

        if (!$contract->polluter_id) {
            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => false, 'anah' => null, 'errors' => []],
            ]);
        }

        $withTranslations = fn ($q) => $q->where('lang', $lang);

        $isoRequest = $contract->domoprimeIsoRequest->last();
        $customer = $contract->customer;
        $address = $customer?->addresses->first();

        if (!$isoRequest || !$address) {
            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => true, 'anah' => null, 'errors' => ['Missing ISO request or customer address']],
            ]);
        }

        try {
            // Resolve zone, region, energy, class (same logic as resultsForContract)
            $zone = $this->resolveZone($address->postcode);
            if (!$zone) {
                return response()->json([
                    'success' => true,
                    'data' => ['has_polluter' => true, 'anah' => null, 'errors' => ['Zone not found']],
                ]);
            }

            $zone->load(['region', 'sectorModel']);
            $region = $zone->region;

            $energy = DomoprimeEnergy::with(['translations' => $withTranslations])
                ->find($isoRequest->energy_id);

            $class = $this->resolveClass(
                $isoRequest->pricing_id,
                $zone->region_id,
                $isoRequest->revenue,
                $isoRequest->number_of_people,
                $withTranslations
            );

            // Get polluter details
            $polluterCompany = \DB::connection('tenant')
                ->table('t_partner_polluter_company')
                ->find($contract->polluter_id);

            $engineType = $polluterCompany?->type ?? null;
            $levelLabel = $class?->translations->first()?->value ?? $class?->name ?? '----';
            $energyLabel = $energy?->translations->first()?->value ?? $energy?->name;

            // ANAH availability
            $isAnaAvailable = $this->checkAnahAvailability(
                $isoRequest->number_of_parts,
                $isoRequest->revenue
            );

            // ISO type: empty (like Symfony template)
            if ($engineType === 'ISO') {
                return response()->json([
                    'success' => true,
                    'data' => ['has_polluter' => true, 'anah' => null, 'errors' => []],
                ]);
            }

            // For ITE/PAC/BOILER/TYPE1/TYPE2: show full ANAH details
            $anah = [
                'engine' => ($engineType ?? '') . '2',
                'polluter_name' => $polluterCompany?->name,
                'zone' => $zone->sectorModel?->name,
                'region' => $region?->name,
                'energy' => $energyLabel,
                'revenue' => (float) $isoRequest->revenue,
                'number_of_people' => (float) $isoRequest->number_of_people,
                'number_of_parts' => (float) $isoRequest->number_of_parts,
                'level' => $levelLabel,
                'is_available' => $isAnaAvailable,
            ];

            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => true, 'anah' => $anah, 'errors' => []],
            ]);

        } catch (\Exception $e) {
            \Log::error('ISO3 ANAH calculation failed for contract', ['contract_id' => $contractId, 'error' => $e->getMessage()]);
            return response()->json([
                'success' => true,
                'data' => [
                    'has_polluter' => true,
                    'anah' => null,
                    'errors' => ['Calculation failed due to an internal error'],
                ],
            ]);
        }
    }

    /**
     * Results for a meeting - finds the associated contract and delegates.
     */
    public function resultsForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $meeting = \Modules\CustomersMeetings\Entities\CustomerMeeting::find($meetingId);

        if (!$meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        // Find the contract linked to this meeting
        $contract = CustomerContract::where('meeting_id', $meetingId)->first();

        if (!$contract) {
            // No contract yet - return meeting's own data (polluter, customer, address)
            return $this->resultsForMeetingDirect($request, $meeting);
        }

        return $this->resultsForContract($request, $contract->id);
    }

    /**
     * ANAH results for a meeting.
     */
    public function resultsAnaForMeeting(Request $request, int $meetingId): JsonResponse
    {
        $meeting = \Modules\CustomersMeetings\Entities\CustomerMeeting::with([
            'customer.addresses' => fn ($q) => $q->where('status', 'ACTIVE'),
        ])->find($meetingId);

        if (!$meeting) {
            return response()->json(['success' => false, 'message' => 'Meeting not found'], 404);
        }

        // If a contract exists, delegate to contract method
        $contract = CustomerContract::where('meeting_id', $meetingId)->first();

        if ($contract) {
            return $this->resultsAnaForContract($request, $contract->id);
        }

        // No contract - compute ANAH directly from meeting data
        if (!$meeting->polluter_id) {
            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => false, 'anah' => null, 'errors' => []],
            ]);
        }

        $lang = $request->query('lang', 'fr');
        $withTranslations = fn ($q) => $q->where('lang', $lang);

        $polluterCompany = \DB::connection('tenant')
            ->table('t_partner_polluter_company')
            ->find($meeting->polluter_id);

        $engineType = $polluterCompany?->type ?? null;

        // ISO type: ANAH not available
        if ($engineType === 'ISO') {
            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => true, 'anah' => null, 'errors' => []],
            ]);
        }

        $isoRequest = \Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest::where('meeting_id', $meeting->id)
            ->latest()
            ->first();

        $customer = $meeting->customer;
        $address = $customer?->addresses->first();

        $errors = [];
        $anah = null;

        if (!$isoRequest || !$address) {
            $errors[] = 'Missing ISO request or customer address';
        } else {
            try {
                $zone = $this->resolveZone($address->postcode);

                if (!$zone) {
                    $errors[] = 'Zone not found for postcode: ' . $address->postcode;
                } else {
                    $zone->load(['region', 'sectorModel']);

                    $energy = $isoRequest->energy_id
                        ? DomoprimeEnergy::with(['translations' => $withTranslations])->find($isoRequest->energy_id)
                        : null;

                    $class = ($isoRequest->pricing_id && $zone->region_id)
                        ? $this->resolveClass($isoRequest->pricing_id, $zone->region_id, $isoRequest->revenue, $isoRequest->number_of_people, $withTranslations)
                        : null;

                    $isAnaAvailable = $this->checkAnahAvailability(
                        (float) ($isoRequest->number_of_parts ?? 0),
                        (float) ($isoRequest->revenue ?? 0)
                    );

                    $levelLabel = $class?->translations->first()?->value ?? $class?->name ?? '----';
                    $energyLabel = $energy?->translations->first()?->value ?? $energy?->name;

                    if (!$class) {
                        $regionName = $zone->region?->name ?? '?';
                        $errors[] = "Cumac price for pricing and region {$regionName} and revenue " . number_format($isoRequest->revenue, 6) . " doesn't exist";
                    }

                    $anah = [
                        'engine' => ($engineType ?? '') . '2',
                        'polluter_name' => $polluterCompany?->name,
                        'zone' => $zone->sectorModel?->name,
                        'region' => $zone->region?->name,
                        'energy' => $energyLabel,
                        'revenue' => (float) ($isoRequest->revenue ?? 0),
                        'number_of_people' => (float) ($isoRequest->number_of_people ?? 0),
                        'number_of_parts' => (float) ($isoRequest->number_of_parts ?? 0),
                        'level' => $levelLabel,
                        'is_available' => $isAnaAvailable,
                    ];
                }
            } catch (\Exception $e) {
                \Log::error('ISO3 ANAH calculation failed for meeting', ['meeting_id' => $meetingId, 'error' => $e->getMessage()]);
                $errors[] = 'Calculation failed due to an internal error';
            }
        }

        return response()->json([
            'success' => true,
            'data' => ['has_polluter' => true, 'anah' => $anah, 'errors' => $errors],
        ]);
    }

    /**
     * Direct results for meeting without contract (basic info only).
     */
    private function resultsForMeetingDirect(Request $request, $meeting): JsonResponse
    {
        $lang = $request->query('lang', 'fr');

        if (!$meeting->polluter_id) {
            return response()->json([
                'success' => true,
                'data' => ['has_polluter' => false, 'info' => null, 'cumac' => null],
            ]);
        }

        $customer = $meeting->customer;
        $address = $customer?->addresses?->where('status', 'ACTIVE')->first();

        $polluterCompany = \DB::connection('tenant')
            ->table('t_partner_polluter_company')
            ->find($meeting->polluter_id);

        $isoRequest = \Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest::where('meeting_id', $meeting->id)
            ->latest()
            ->first();

        $info = null;

        if ($address && $isoRequest) {
            $zone = $this->resolveZone($address->postcode);
            $zone?->load(['region', 'sectorModel']);
            $withTranslations = fn ($q) => $q->where('lang', $lang);

            $energy = $isoRequest->energy_id
                ? DomoprimeEnergy::with(['translations' => $withTranslations])->find($isoRequest->energy_id)
                : null;

            $class = ($isoRequest->pricing_id && $zone)
                ? $this->resolveClass($isoRequest->pricing_id, $zone->region_id, $isoRequest->revenue, $isoRequest->number_of_people, $withTranslations)
                : null;

            $info = [
                'zone' => $zone?->sectorModel?->name,
                'region' => $zone?->region?->name,
                'energy' => $energy?->translations->first()?->value ?? $energy?->name,
                'revenue' => (float) ($isoRequest->revenue ?? 0),
                'level' => $class?->translations->first()?->value ?? '----',
                'number_of_people' => (float) ($isoRequest->number_of_people ?? 0),
            ];
        }

        // Build CUMAC errors (like Symfony's engine error messages)
        $engineType = $polluterCompany?->type ?? null;
        $cumacErrors = [];

        if ($info && $isoRequest) {
            $zone = $this->resolveZone($address->postcode);
            $withTranslations = fn ($q) => $q->where('lang', $lang);
            $class = ($isoRequest->pricing_id && $zone)
                ? $this->resolveClass($isoRequest->pricing_id, $zone->region_id, $isoRequest->revenue, $isoRequest->number_of_people, $withTranslations)
                : null;

            if (!$class) {
                $regionName = $zone?->region?->name ?? '?';
                $cumacErrors[] = "Cumac price for pricing and region {$regionName} and revenue " . number_format($isoRequest->revenue, 6) . " doesn't exist";
            }
        }

        // Build ANAH section (like Symfony - for ITE/PAC/BOILER/TYPE1/TYPE2, not ISO)
        $anah = null;

        if ($engineType && $engineType !== 'ISO') {
            $isAnaAvailable = false;

            if ($isoRequest) {
                $isAnaAvailable = $this->checkAnahAvailability(
                    (float) ($isoRequest->number_of_parts ?? 0),
                    (float) ($isoRequest->revenue ?? 0)
                );
            }

            $levelLabel = '----';
            if ($info) {
                $levelLabel = $info['level'] ?? '----';
            }

            $anah = [
                'engine' => $engineType . '2',
                'polluter_name' => $polluterCompany?->name,
                'number_of_parts' => (float) ($isoRequest?->number_of_parts ?? 0),
                'level' => $levelLabel,
                'is_available' => $isAnaAvailable,
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_polluter' => true,
                'engine_type' => $engineType,
                'info' => $info,
                'cumac' => null,
                'cumac_errors' => $cumacErrors,
                'anah' => $anah,
            ],
        ]);
    }

    /**
     * Return a graceful error response with partial info when available.
     */
    private function returnCalculationError(
        CustomerContract $contract,
        string $error,
        $user,
        string $lang,
        bool $saveError = true
    ): JsonResponse {
        if ($saveError) {
            $this->saveCalculationWithError($contract, $error, $user);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'has_polluter' => true,
                'info' => null,
                'cumac' => null,
            ],
        ]);
    }
}
