<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Modules\AppDomoprime\Entities\DomoprimeCalculation;
use Modules\AppDomoprime\Entities\DomoprimeIsoCustomerRequest;
use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProduct;
use Modules\AppDomoprime\Entities\DomoprimeQuotationProductItem;
use Modules\AppDomoprime\Entities\DomoprimeSubventionType;
use Modules\AppDomoprime\Services\Pdf\SmartyTemplateRenderer;
use Modules\AppDomoprimeISO3\Services\Documents\QuotationDataBuilder;
use Modules\Customer\Entities\Customer;
use Modules\Customer\Entities\CustomerAddress;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersContracts\Entities\CustomerContractCompany;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use Tests\TestCase;

class QuotationDataBuilderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Config::set('database.connections.tenant', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
            'foreign_key_constraints' => false,
        ]);
    }

    public function test_build_returns_top_level_keys(): void
    {
        $vars = (new QuotationDataBuilder())->build($this->makeQuotationWithEverything());

        $expected = ['lang', 'today', 'company', 'polluter', 'customer', 'contract', 'quotation', 'products', 'items', 'subvention_type', 'calculation'];
        foreach ($expected as $key) {
            $this->assertArrayHasKey($key, $vars, "Missing key: $key");
        }
        $this->assertSame('fr', $vars['lang']);
    }

    public function test_build_company_maps_name_address_siret(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('GES Prime', $vars['company']['name']);
        $this->assertSame('12 rue Test', $vars['company']['address1']);
        $this->assertSame('12345678901234', $vars['company']['siret']);
        $this->assertArrayHasKey('picture', $vars['company']);
    }

    public function test_build_customer_maps_firstname_and_address(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('jean', $vars['customer']['firstname']);
        $this->assertSame('dupont', $vars['customer']['lastname']);
        $this->assertSame('5 rue Foo', $vars['customer']['address']['address1']);
        $this->assertSame('75001', $vars['customer']['address']['postcode']);
    }

    public function test_build_customer_handles_null_customer(): void
    {
        $quotation = $this->makeQuotation();
        $quotation->setRelation('contract', null);

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame(0, $vars['customer']['id']);
        $this->assertSame('', $vars['customer']['firstname']);
        $this->assertSame('', $vars['customer']['address']['address1']);
    }

    public function test_contract_dates_are_bundled_with_ddmmyyyy(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('24/09/2024', $vars['contract']['quoted_at']['ddmmyyyy']);
        $this->assertSame('2024-09-24', $vars['contract']['quoted_at']['iso']);
        $this->assertSame('23/12/2024', $vars['contract']['quoted_at_90']['ddmmyyyy']);
    }

    public function test_quotation_formatted_currency_uses_french_format(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('580,01 €', $vars['quotation']['FormattedTotalSaleWithTax']);
        $this->assertSame('549,77 €', $vars['quotation']['FormattedTotalSaleWithoutTax']);
        $this->assertSame('1,00 €', $vars['quotation']['FormattedCeePrime']);
        $this->assertSame('580,01 €', $vars['quotation']['FormattedRestInCharge']);
    }

    public function test_quotation_raw_amount_columns_are_overwritten_with_formatted_currency(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('580,01 €', $vars['quotation']['total_sale_with_tax']);
        $this->assertSame('549,77 €', $vars['quotation']['total_sale_without_tax']);
        $this->assertSame('30,24 €', $vars['quotation']['total_tax']);
    }

    public function test_quotation_dates_from_attributes_are_replaced_with_bundles(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertIsArray($vars['quotation']['created_at']);
        $this->assertArrayHasKey('ddmmyyyy', $vars['quotation']['created_at']);
        $this->assertSame('24/09/2024', $vars['quotation']['dated_at']['ddmmyyyy']);
    }

    public function test_quotation_taxes_are_aggregated_by_rate(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertArrayHasKey('5.5', $vars['quotation']['taxes']);
        $this->assertArrayHasKey('10', $vars['quotation']['taxes']);
        $this->assertArrayHasKey('20', $vars['quotation']['taxes']);
        $this->assertSame('5.5', $vars['quotation']['taxes']['5.5']['rate']);
        $this->assertStringEndsWith('€', $vars['quotation']['taxes']['5.5']['amount']);
        $this->assertStringEndsWith('€', $vars['quotation']['taxes']['5.5']['base']);
    }

    public function test_products_are_mapped_with_items(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertCount(1, $vars['products']);
        $this->assertSame('BAR-EN-103', $vars['products'][0]['title']);
        $this->assertCount(2, $vars['products'][0]['items']);
        $this->assertSame('1,00', $vars['products'][0]['items'][0]['quantity']);
        $this->assertSame('492,89 €', $vars['products'][0]['items'][0]['FormattedSalePriceWithoutTax']);
    }

    public function test_flatten_items_concatenates_all_items_across_products(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertCount(2, $vars['items']);
    }

    public function test_subvention_type_and_calculation_are_built_from_relations(): void
    {
        $quotation = $this->makeQuotationWithEverything();

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame('DEVIS CEE', $vars['subvention_type']['name']);
        $this->assertSame('calcule_prime_cee', $vars['subvention_type']['commercial']);
        $this->assertSame(1, $vars['calculation']['class_id']);
        $this->assertSame(12, $vars['calculation']['region_id']);
    }

    public function test_renders_with_smarty_engine_without_throwing(): void
    {
        $quotation = $this->makeQuotationWithEverything();
        $vars = (new QuotationDataBuilder())->build($quotation);

        $body = "{\$company.name|upper} - {\$customer.firstname|upper} {\$customer.lastname|upper}\n"
            ."Devis {\$contract.quoted_at.ddmmyyyy} : {\$quotation.FormattedTotalSaleWithTax}\n"
            ."{foreach \$products as \$p}{\$p.title} ({\$p.items|count} items){/foreach}";

        $html = (new SmartyTemplateRenderer())->render($body, $vars);

        $this->assertStringContainsString('GES PRIME - JEAN DUPONT', $html);
        $this->assertStringContainsString('Devis 24/09/2024 : 580,01 €', $html);
        $this->assertStringContainsString('BAR-EN-103 (2 items)', $html);
    }

    public function test_request_block_falls_back_to_empty_when_missing(): void
    {
        $quotation = $this->makeQuotation();
        $contract = $this->makeContract();
        $contract->setRelation('domoprimeIsoRequest', new Collection([]));
        $contract->setRelation('customer', null);
        $contract->setRelation('company', null);
        $contract->setRelation('polluter', null);
        $quotation->setRelation('contract', $contract);

        $vars = (new QuotationDataBuilder())->build($quotation);

        $this->assertSame([], $vars['contract']['request']);
    }

    private function makeQuotation(): DomoprimeQuotation
    {
        $q = new DomoprimeQuotation();
        $q->id = 1789;
        $q->reference = 'DEV-1789';
        $q->dated_at = Carbon::parse('2024-09-24');
        $q->total_sale_with_tax = 580.01;
        $q->total_sale_without_tax = 549.77;
        $q->total_tax = 30.24;
        $q->prime = 1.00;
        $q->cee_prime = 1.00;
        $q->ana_prime = 0.00;
        $q->discount_amount = 0.00;
        $q->rest_in_charge = 580.01;
        $q->number_of_people = 5;
        $q->number_of_children = 0;
        $q->number_of_parts = 2;
        $q->setRelation('products', new Collection([]));
        $q->setRelation('subventionType', null);
        $q->setRelation('calculation', null);

        return $q;
    }

    private function makeContract(): CustomerContract
    {
        $c = new CustomerContract();
        $c->id = 246;
        $c->reference = 'CT-246';
        $c->opened_at = '2024-09-24';
        $c->quoted_at = '2024-09-24';
        $c->billing_at = '2024-12-01';
        $c->is_hold = 'NO';
        $c->is_hold_quote = 'NO';
        $c->is_signed = 'NO';

        return $c;
    }

    private function makeQuotationWithEverything(): DomoprimeQuotation
    {
        $company = new CustomerContractCompany();
        $company->id = 1;
        $company->name = 'GES Prime';
        $company->commercial = 'GES Prime';
        $company->address1 = '12 rue Test';
        $company->postcode = '75001';
        $company->city = 'Paris';
        $company->country = 'France';
        $company->siret = '12345678901234';
        $company->tva = 'FR12345678901';

        $polluter = new PartnerPolluterCompany();
        $polluter->id = 9;
        $polluter->name = 'Auchan Énergies';
        $polluter->commercial = 'Auchan';
        $polluter->siret = '987654321';

        $address = new CustomerAddress();
        $address->id = 50;
        $address->address1 = '5 rue Foo';
        $address->postcode = '75001';
        $address->city = 'Paris';
        $address->country = 'France';
        $address->status = 'ACTIVE';

        $customer = new Customer();
        $customer->id = 246;
        $customer->firstname = 'jean';
        $customer->lastname = 'dupont';
        $customer->gender = 'M.';
        $customer->phone = '0123456789';
        $customer->email = 'jean@example.com';
        $customer->setRelation('addresses', new Collection([$address]));

        $request = new DomoprimeIsoCustomerRequest();
        $request->id = 70;
        $request->surface_home = 95;
        $request->surface_ite = 1;
        $request->revenue = 25000;
        $request->number_of_people = 5;
        $request->declarants = 'M. Dupont';
        $request->pricing_id = 5;
        $request->more_2_years = 'YES';

        $contract = $this->makeContract();
        $contract->setRelation('customer', $customer);
        $contract->setRelation('polluter', $polluter);
        $contract->setRelation('company', $company);
        $contract->setRelation('domoprimeIsoRequest', new Collection([$request]));

        $item1 = new DomoprimeQuotationProductItem();
        $item1->id = 9001;
        $item1->item_id = 0;
        $item1->quantity = 1;
        $item1->unit = 'm²';
        $item1->coefficient = 5.5;
        $item1->sale_price_without_tax = 492.89;
        $item1->sale_price_with_tax = 519.95;
        $item1->total_sale_price_without_tax = 492.89;
        $item1->total_sale_price_with_tax = 519.95;
        $item1->description = 'TERRADALL PORTEE IGNI ...';
        $item1->is_master = 'YES';

        $item2 = new DomoprimeQuotationProductItem();
        $item2->id = 9002;
        $item2->item_id = 0;
        $item2->quantity = 2;
        $item2->unit = 'u';
        $item2->coefficient = 5.5;
        $item2->sale_price_without_tax = 25.00;
        $item2->sale_price_with_tax = 26.38;
        $item2->total_sale_price_without_tax = 50.00;
        $item2->total_sale_price_with_tax = 52.76;
        $item2->description = 'Cheville';
        $item2->is_master = 'NO';

        $product = new DomoprimeQuotationProduct();
        $product->id = 5001;
        $product->product_id = 28;
        $product->title = 'BAR-EN-103';
        $product->entitled = 'Vide sanitaire et passage ouvert';
        $product->quantity = 1;
        $product->total_sale_price_with_tax = 519.95;
        $product->total_sale_price_without_tax = 492.89;
        $product->prime = 1.00;
        $product->setRelation('items', new Collection([$item1, $item2]));

        $subventionType = new DomoprimeSubventionType();
        $subventionType->id = 3;
        $subventionType->name = 'DEVIS CEE';
        $subventionType->commercial = 'calcule_prime_cee';

        $calculation = new DomoprimeCalculation();
        $calculation->id = 70;
        $calculation->class_id = 1;
        $calculation->sector_id = 1;
        $calculation->region_id = 12;
        $calculation->energy_id = 1;
        $calculation->cee_prime = '0.001282';

        $quotation = $this->makeQuotation();
        $quotation->setRelation('products', new Collection([$product]));
        $quotation->setRelation('contract', $contract);
        $quotation->setRelation('subventionType', $subventionType);
        $quotation->setRelation('calculation', $calculation);

        return $quotation;
    }
}
