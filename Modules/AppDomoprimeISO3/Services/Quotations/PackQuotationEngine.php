<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\CustomersContracts\Entities\CustomerContract;

class PackQuotationEngine extends AbstractQuotationEngine
{
    public const TYPE = 'PACK';
    public const LEGACY_TYPE = 'PAC';

    protected const DEFAULT_TVA_RATE = 5.5;

    public function type(): string
    {
        return self::TYPE;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function computeCumac(CustomerContract $contract, array $items): float
    {
        return 0.0;
    }
}
