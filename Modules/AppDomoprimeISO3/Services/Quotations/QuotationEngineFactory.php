<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use InvalidArgumentException;
use Modules\AppDomoprimeISO3\Services\Quotations\Contracts\QuotationEngineInterface;

class QuotationEngineFactory
{
    public function forPolluterType(string $polluterType): QuotationEngineInterface
    {
        $type = strtoupper(trim($polluterType));

        return match ($type) {
            IteQuotationEngine::TYPE => new IteQuotationEngine(),
            BoilerQuotationEngine::TYPE => new BoilerQuotationEngine(),
            PackQuotationEngine::TYPE, PackQuotationEngine::LEGACY_TYPE => new PackQuotationEngine(),
            Type1QuotationEngine::TYPE => new Type1QuotationEngine(),
            Type2QuotationEngine::TYPE => new Type2QuotationEngine(),
            default => throw new InvalidArgumentException("Unsupported ISO3 quotation type [{$type}]"),
        };
    }
}
