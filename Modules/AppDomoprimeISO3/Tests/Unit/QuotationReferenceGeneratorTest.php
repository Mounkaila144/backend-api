<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use Modules\AppDomoprimeISO3\Services\Quotations\QuotationReferenceGenerator;
use PHPUnit\Framework\TestCase;

class QuotationReferenceGeneratorTest extends TestCase
{
    public function test_it_reproduces_legacy_reference_tokens(): void
    {
        $reference = (new QuotationReferenceGenerator())->format(
            'DEV-{id}-{id_company}-{id_work}-{sav_at}-{opc_at}',
            [
                'id' => 123,
                'id_company' => 7,
                'id_work' => 45,
                'sav_at' => '02-05-2026',
                'opc_at' => '03-05-2026',
            ]
        );

        $this->assertSame('DEV-123-7-45-02-05-2026-03-05-2026', $reference);
    }

    public function test_it_falls_back_to_legacy_dev_id_when_format_is_empty(): void
    {
        $reference = (new QuotationReferenceGenerator())->format('', ['id' => 123]);

        $this->assertSame('DEV-123', $reference);
    }
}
