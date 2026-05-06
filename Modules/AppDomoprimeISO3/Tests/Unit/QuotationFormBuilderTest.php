<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Illuminate\Database\Eloquent\Collection;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationFormBuilder;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class QuotationFormBuilderTest extends TestCase
{
    public function test_it_builds_a_form_skeleton_when_polluter_has_no_products(): void
    {
        $contract = new CustomerContract();
        $contract->setRawAttributes([
            'id' => 250,
            'reference' => 'CT-250',
            'quoted_at' => '2026-05-02',
        ]);

        $polluter = new PartnerPolluterCompany([
            'name' => 'Polluter ITE',
            'commercial' => 'Polluter ITE Commercial',
            'type' => 'ITE',
        ]);
        $polluter->id = 0;

        $contract->setRelation('polluter', $polluter);
        $contract->setRelation('products', new Collection());

        $form = (new QuotationFormBuilder())->build($contract, 'advanced');

        $this->assertSame(250, $form['contract']['id']);
        $this->assertSame('CT-250', $form['contract']['reference']);
        $this->assertSame('ITE', $form['polluter']['type']);
        $this->assertSame('surface_m2', $form['quantity_kind']);
        $this->assertSame('advanced', $form['mode']);
        $this->assertSame('2026-05-02', $form['defaults']['dated_at']);
        $this->assertSame([], $form['product_categories']);
        $this->assertSame([], $form['product_selector_options']);
    }

    #[DataProvider('quantityKinds')]
    public function test_it_maps_polluter_type_to_quantity_kind(string $type, string $expectedKind): void
    {
        $contract = new CustomerContract();
        $polluter = new PartnerPolluterCompany(['type' => $type]);
        $polluter->id = 0;
        $contract->setRelation('polluter', $polluter);
        $contract->setRelation('products', new Collection());

        $form = (new QuotationFormBuilder())->build($contract);

        $this->assertSame($expectedKind, $form['quantity_kind']);
    }

    public static function quantityKinds(): array
    {
        return [
            'ite' => ['ITE', 'surface_m2'],
            'type1' => ['TYPE1', 'surface_m2'],
            'type2' => ['TYPE2', 'surface_m2'],
            'boiler' => ['BOILER', 'quantity'],
            'pack' => ['PACK', 'quantity'],
            'pac' => ['PAC', 'quantity'],
        ];
    }
}
