<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Modules\AppDomoprimeISO3\Http\Requests\CreateQuotationRequest;
use PHPUnit\Framework\TestCase;

class CreateQuotationRequestTest extends TestCase
{
    public function test_it_allows_authenticated_admin_routes_to_delegate_authorization_to_middleware(): void
    {
        $request = new CreateQuotationRequest();

        $this->assertTrue($request->authorize());
    }

    public function test_it_defines_the_legacy_new_quotation_payload_shape(): void
    {
        $rules = (new CreateQuotationRequest())->rules();

        $this->assertSame('nullable|date', $rules['dated_at']);
        $this->assertSame('nullable|numeric|min:0', $rules['discount_amount']);
        $this->assertSame('nullable|integer', $rules['subvention_type_id']);
        $this->assertSame('required|array|min:1', $rules['items']);
        $this->assertSame('required|integer', $rules['items.*.product_id']);
        $this->assertSame('required|numeric|min:0', $rules['items.*.quantity']);
        $this->assertSame('nullable|numeric|min:0', $rules['items.*.sale_price_without_tax']);
    }
}
