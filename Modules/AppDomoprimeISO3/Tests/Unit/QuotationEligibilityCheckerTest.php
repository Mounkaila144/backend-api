<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEligibilityChecker;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use PHPUnit\Framework\TestCase;

class QuotationEligibilityCheckerTest extends TestCase
{
    public function test_it_rejects_contract_without_polluter(): void
    {
        $contract = new CustomerContract();
        $contract->setRawAttributes(['id' => 250, 'polluter_id' => null]);

        $result = (new QuotationEligibilityChecker())->check($contract, false);

        $this->assertFalse($result->eligible);
        $this->assertContains("Le contrat n'a pas de polluter", $result->errors);
    }

    public function test_it_rejects_hold_contracts(): void
    {
        $contract = $this->contract('ITE');
        $contract->setRawAttributes(array_merge($contract->getAttributes(), [
            'is_hold' => 'YES',
            'is_hold_quote' => 'YES',
        ]));
        $contract->setRelation('domoprimeIsoRequest', new Collection([$this->customerRequest()]));

        $result = (new QuotationEligibilityChecker())->check($contract, false);

        $this->assertFalse($result->eligible);
        $this->assertContains('Le contrat est bloque', $result->errors);
        $this->assertContains('Le devis est bloque', $result->errors);
    }

    public function test_it_rejects_missing_customer_request(): void
    {
        $contract = $this->contract('ITE');
        $contract->setRelation('domoprimeIsoRequest', new Collection());

        $result = (new QuotationEligibilityChecker())->check($contract, false);

        $this->assertFalse($result->eligible);
        $this->assertContains('Aucune demande client (customer_request) pour ce contrat', $result->errors);
    }

    public function test_it_rejects_ite_without_surface_to_insulate(): void
    {
        $contract = $this->contract('ITE');
        $contract->setRelation('domoprimeIsoRequest', new Collection([
            $this->customerRequest([
                'surface_wall' => 0,
                'surface_top' => 0,
                'surface_floor' => 0,
            ]),
        ]));

        $result = (new QuotationEligibilityChecker())->check($contract, false);

        $this->assertFalse($result->eligible);
        $this->assertContains('Aucune surface a isoler renseignee (mur, toit, plancher)', $result->errors);
    }

    public function test_it_accepts_minimal_valid_ite_data_before_pricing_check(): void
    {
        $contract = $this->contract('ITE');
        $contract->setRelation('domoprimeIsoRequest', new Collection([$this->customerRequest()]));

        $result = (new QuotationEligibilityChecker())->check($contract, false);

        $this->assertTrue($result->eligible);
        $this->assertSame([], $result->errors);
    }

    private function contract(string $polluterType): CustomerContract
    {
        $contract = new CustomerContract();
        $contract->setRawAttributes([
            'id' => 250,
            'polluter_id' => 12,
            'is_hold' => 'NO',
            'is_hold_quote' => 'NO',
        ]);

        $polluter = new PartnerPolluterCompany();
        $polluter->setRawAttributes([
            'id' => 12,
            'type' => $polluterType,
            'is_active' => 'YES',
        ]);

        $contract->setRelation('polluter', $polluter);

        return $contract;
    }

    private function customerRequest(array $overrides = []): DomoprimeIsoCustomerRequest
    {
        $request = new DomoprimeIsoCustomerRequest();
        $request->setRawAttributes(array_merge([
            'surface_home' => 100,
            'revenue' => 25000,
            'number_of_people' => 2,
            'energy_id' => 3,
            'surface_wall' => 50,
            'surface_top' => 0,
            'surface_floor' => 0,
            'boiler_quantity' => 1,
            'pack_quantity' => 1,
        ], $overrides));

        return $request;
    }
}
