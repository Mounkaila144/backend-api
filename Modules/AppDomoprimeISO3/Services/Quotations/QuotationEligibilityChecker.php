<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprime\Entities\DomoprimeZone;
use Modules\AppDomoprimeISO3\Entities\DomoprimeIsoCumacClassRegionPrice;
use Modules\AppDomoprimeISO3\Entities\DomoprimePolluterClassSectorEnergy;
use Modules\CustomersContracts\Entities\CustomerContract;

class QuotationEligibilityChecker
{
    private const SUPPORTED_TYPES = ['ITE', 'BOILER', 'PAC', 'PACK', 'TYPE1', 'TYPE2'];

    /**
     * @param  bool  $validatePricing  Disabled by default: the engine itself
     *   gracefully falls back to CUMAC=0 when no pricing matches (matches the
     *   Symfony PATCH MIGRATION). Pass `true` only if you want to surface those
     *   warnings up-front (e.g. an admin diagnostics screen).
     */
    public function check(CustomerContract $contract, bool $validatePricing = false): EligibilityResult
    {
        $errors = [];

        if (! $contract->polluter_id) {
            return new EligibilityResult(false, ["Le contrat n'a pas de polluter"]);
        }

        $polluter = $contract->getRelationValue('polluter');
        $type = strtoupper((string) ($polluter?->type ?? ''));

        if (! $polluter) {
            $errors[] = "Le contrat n'a pas de polluter";
        } else {
            if ($polluter->is_active !== 'YES') {
                $errors[] = "Le polluter n'est pas actif";
            }

            if (! in_array($type, self::SUPPORTED_TYPES, true)) {
                $errors[] = "Type de polluter inconnu : {$type}";
            }
        }

        if ($contract->is_hold === 'YES') {
            $errors[] = 'Le contrat est bloque';
        }

        if ($contract->is_hold_quote === 'YES') {
            $errors[] = 'Le devis est bloque';
        }

        $customerRequest = $this->customerRequest($contract);

        if (! $customerRequest) {
            return new EligibilityResult(false, [
                ...$errors,
                'Aucune demande client (customer_request) pour ce contrat',
            ]);
        }

        $this->validateCustomerRequest($customerRequest, $errors);
        $this->validateTypeSpecificData($type, $customerRequest, $errors);

        if ($validatePricing && empty($errors) && $polluter) {
            $this->validatePricing($contract, $customerRequest, (int) $polluter->id, $errors);
        }

        return new EligibilityResult(empty($errors), $errors);
    }

    private function customerRequest(CustomerContract $contract): ?DomoprimeIsoCustomerRequest
    {
        if ($contract->relationLoaded('domoprimeIsoRequest')) {
            return $contract->getRelation('domoprimeIsoRequest')->last();
        }

        return DomoprimeIsoCustomerRequest::where('contract_id', $contract->id)
            ->orderByDesc('id')
            ->first();
    }

    private function validateCustomerRequest(DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        if ((float) $request->surface_home <= 0) {
            $errors[] = "La surface d'habitation est de 0 m2";
        }

        if ((float) $request->revenue <= 0) {
            $errors[] = 'Le revenu du client est nul';
        }

        if ((float) $request->number_of_people < 1) {
            $errors[] = 'Le nombre de personnes est nul';
        }

        if (! $request->energy_id) {
            $errors[] = "L'energie principale n'est pas renseignee";
        }
    }

    private function validateTypeSpecificData(string $type, DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        match ($type) {
            'ITE' => $this->validateIte($request, $errors),
            'PAC', 'PACK' => $this->validatePac($request, $errors),
            'BOILER' => $this->validateBoiler($request, $errors),
            'TYPE1', 'TYPE2' => $this->validateTypeSurface($request, $errors),
            default => null,
        };
    }

    private function validateIte(DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        $totalSurface = (float) $request->surface_wall
            + (float) $request->surface_top
            + (float) $request->surface_floor;

        if ($totalSurface <= 0) {
            $errors[] = 'Aucune surface a isoler renseignee (mur, toit, plancher)';
        }
    }

    private function validatePac(DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        if ((float) $request->pack_quantity <= 0) {
            $errors[] = 'Quantite PAC a 0';
        }
    }

    private function validateBoiler(DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        if ((float) $request->boiler_quantity <= 0) {
            $errors[] = 'Quantite chaudiere a 0';
        }
    }

    private function validateTypeSurface(DomoprimeIsoCustomerRequest $request, array &$errors): void
    {
        if ((float) $request->surface_ite <= 0) {
            $errors[] = 'Surface TYPE1/TYPE2 a 0';
        }
    }

    private function validatePricing(
        CustomerContract $contract,
        DomoprimeIsoCustomerRequest $request,
        int $polluterId,
        array &$errors
    ): void {
        $zone = $this->resolveZone($contract);

        if (! $zone) {
            $errors[] = 'Zone climatique introuvable';
            return;
        }

        if (! $request->pricing_id) {
            $errors[] = 'Configuration CUMAC absente';
            return;
        }

        $classId = DomoprimeIsoCumacClassRegionPrice::where('cumac_id', $request->pricing_id)
            ->where('region_id', $zone->region_id)
            ->where('number_of_people', (int) $request->number_of_people)
            ->where('price', '>=', (float) $request->revenue)
            ->orderBy('price')
            ->value('class_id');

        if (! $classId) {
            $errors[] = 'Classe de revenu introuvable pour ce client';
            return;
        }

        $hasPricing = DomoprimePolluterClassSectorEnergy::where('polluter_id', $polluterId)
            ->where('class_id', $classId)
            ->where('sector_id', $zone->sector_id)
            ->where('energy_id', $request->energy_id)
            ->exists();

        if (! $hasPricing) {
            $errors[] = 'Aucun tarif configure pour ce polluter avec la classe/secteur/energie du client';
        }
    }

    private function resolveZone(CustomerContract $contract): ?DomoprimeZone
    {
        $customer = $contract->getRelationValue('customer');
        $addresses = $customer?->relationLoaded('addresses') ? $customer->getRelation('addresses') : collect();
        $address = $addresses->where('status', 'ACTIVE')->first() ?? $addresses->first();
        $postcode = (string) ($address?->postcode ?? '');

        if ($postcode === '') {
            return null;
        }

        $dept = str_starts_with($postcode, '97') ? substr($postcode, 0, 3) : substr($postcode, 0, 2);

        return DomoprimeZone::where('code', $dept)->first();
    }
}
