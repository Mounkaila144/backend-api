<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprime\Entities\DomoprimeZone;
use Modules\AppDomoprimeISO3\Entities\DomoprimeIsoCumacClassRegionPrice;
use Modules\AppDomoprimeISO3\Entities\DomoprimeIsoCumacClassRegionPriceSurface;
use Modules\AppDomoprimeISO3\Entities\DomoprimePolluterClassSectorEnergy;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;

class IteCumacResolver
{
    /**
     * Resolve the CUMAC unitary coefficient (kWhcumac/m2) and the polluter
     * EUR/kWhcumac price for the given parent (Contract or Meeting). Returns
     * null when any of the required pieces (customer request, zone, class,
     * polluter pricing, surface bracket coefficient) is missing — the engine
     * then falls back to CUMAC=0 / Prime=0 just like the patched Symfony engine.
     */
    public function resolve(CustomerContract|CustomerMeeting $parent, float $surface): ?IteCumacContext
    {
        $polluterId = (int) ($parent->polluter_id ?? 0);
        if ($polluterId <= 0 || $surface <= 0) {
            return null;
        }

        $request = $this->customerRequest($parent);
        if (! $request || ! $request->energy_id || ! $request->pricing_id) {
            return null;
        }

        $zone = $this->resolveZone($parent);
        if (! $zone) {
            return null;
        }

        $classId = DomoprimeIsoCumacClassRegionPrice::query()
            ->where('cumac_id', $request->pricing_id)
            ->where('region_id', $zone->region_id)
            ->where('number_of_people', (int) $request->number_of_people)
            ->where('price', '>=', (float) $request->revenue)
            ->orderBy('price')
            ->value('class_id');

        // Symfony fallback: when no revenue threshold matches (often the
        // t_domoprime_iso_cumac_class_region_price table is empty for this
        // combination), DomoprimeResultEngine falls back to the first known
        // class (1 = "Très modeste"). Without this, contracts in regions that
        // are not configured (e.g. 76 / cumac_id=3) silently miss the price
        // override.
        if (! $classId) {
            $classId = 1;
        }

        $polluterPricing = DomoprimePolluterClassSectorEnergy::query()
            ->where('polluter_id', $polluterId)
            ->where('class_id', $classId)
            ->where('sector_id', $zone->sector_id)
            ->where('energy_id', $request->energy_id)
            ->first();

        if (! $polluterPricing) {
            return null;
        }

        $surfaceCoef = DomoprimeIsoCumacClassRegionPriceSurface::query()
            ->where('price_id', $polluterPricing->id)
            ->where('min', '<=', $surface)
            ->where('max', '>=', $surface)
            ->value('coef');

        if ($surfaceCoef === null) {
            return null;
        }

        return new IteCumacContext(
            classId: (int) $classId,
            sectorId: (int) $zone->sector_id,
            regionId: (int) $zone->region_id,
            energyId: (int) $request->energy_id,
            polluterPriceId: (int) $polluterPricing->id,
            polluterEurPerKwhCumac: (float) $polluterPricing->price,
            surfaceCoef: (float) $surfaceCoef,
            surface: $surface,
        );
    }

    /**
     * Compute the HT sale price overriden on every master item of the ITE
     * quotation form, exactly like Symfony does in
     * DomoprimeQuotationPricingContractEngine::process():
     *   sale_price = surface_coef / (more_2_years === 'YES' ? 1.055 : 1.2)
     */
    public function resolveMasterPriceHt(CustomerContract|CustomerMeeting $parent): ?float
    {
        $request = $this->customerRequest($parent);
        if (! $request) {
            return null;
        }

        $homeSurface = (float) ($request->surface_home ?? 0);
        $context = $this->resolve($parent, $homeSurface);
        if (! $context) {
            return null;
        }

        $tvaFactor = ($request->more_2_years ?? null) === 'YES' ? 1.055 : 1.2;

        // 3 decimals to match Symfony's format_number(price, "#.000") rendering.
        return round($context->surfaceCoef / $tvaFactor, 3);
    }

    public function customerRequest(CustomerContract|CustomerMeeting $parent): ?DomoprimeIsoCustomerRequest
    {
        // Contract uses `domoprimeIsoRequest` (HasMany); Meeting uses
        // `domoprimeRequest` (HasOne). When eager-loaded, unwrap accordingly.
        $relationName = $parent instanceof CustomerContract ? 'domoprimeIsoRequest' : 'domoprimeRequest';
        if ($parent->relationLoaded($relationName)) {
            $relation = $parent->getRelation($relationName);
            if ($relation instanceof DomoprimeIsoCustomerRequest) {
                return $relation;
            }
            return $relation?->last();
        }

        $foreignKey = $parent instanceof CustomerContract ? 'contract_id' : 'meeting_id';

        return DomoprimeIsoCustomerRequest::query()
            ->where($foreignKey, $parent->id)
            ->orderByDesc('id')
            ->first();
    }

    private function resolveZone(CustomerContract|CustomerMeeting $parent): ?DomoprimeZone
    {
        $customer = $parent->getRelationValue('customer');
        if (! $customer) {
            return null;
        }

        $addresses = $customer->relationLoaded('addresses')
            ? $customer->getRelation('addresses')
            : $customer->addresses ?? collect();

        $address = $addresses->first(fn ($addr) => ($addr->status ?? null) === 'ACTIVE') ?? $addresses->first();
        $postcode = (string) ($address?->postcode ?? '');
        if ($postcode === '') {
            return null;
        }

        $dept = str_starts_with($postcode, '97') ? substr($postcode, 0, 3) : substr($postcode, 0, 2);

        return DomoprimeZone::query()->where('code', $dept)->first();
    }
}
