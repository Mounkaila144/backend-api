<?php

namespace Modules\AppDomoprimeISO3\Tests\Unit;

use InvalidArgumentException;
use Modules\AppDomoprimeISO3\Services\Quotations\BoilerQuotationEngine;
use Modules\AppDomoprimeISO3\Services\Quotations\IteQuotationEngine;
use Modules\AppDomoprimeISO3\Services\Quotations\PackQuotationEngine;
use Modules\AppDomoprimeISO3\Services\Quotations\QuotationEngineFactory;
use Modules\AppDomoprimeISO3\Services\Quotations\Type1QuotationEngine;
use Modules\AppDomoprimeISO3\Services\Quotations\Type2QuotationEngine;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class QuotationEngineFactoryTest extends TestCase
{
    #[DataProvider('polluterTypes')]
    public function test_it_resolves_the_legacy_polluter_type_to_the_expected_engine(
        string $polluterType,
        string $expectedEngine
    ): void {
        $factory = new QuotationEngineFactory();

        $this->assertInstanceOf($expectedEngine, $factory->forPolluterType($polluterType));
    }

    public function test_it_rejects_unknown_polluter_types(): void
    {
        $factory = new QuotationEngineFactory();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Unsupported ISO3 quotation type [UNKNOWN]');

        $factory->forPolluterType('UNKNOWN');
    }

    public static function polluterTypes(): array
    {
        return [
            'ite' => ['ITE', IteQuotationEngine::class],
            'boiler' => ['BOILER', BoilerQuotationEngine::class],
            'pac legacy alias' => ['PAC', PackQuotationEngine::class],
            'pack' => ['PACK', PackQuotationEngine::class],
            'type1' => ['TYPE1', Type1QuotationEngine::class],
            'type2' => ['TYPE2', Type2QuotationEngine::class],
        ];
    }
}
