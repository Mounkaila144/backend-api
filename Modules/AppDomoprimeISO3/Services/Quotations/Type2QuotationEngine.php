<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations;

use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;

class Type2QuotationEngine extends AbstractQuotationEngine
{
    public const TYPE = 'TYPE2';

    protected const DEFAULT_TVA_RATE = 5.5;

    public function type(): string
    {
        return self::TYPE;
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    protected function computeCumac(CustomerContract|CustomerMeeting $parent, array $items): float
    {
        return 0.0;
    }
}
