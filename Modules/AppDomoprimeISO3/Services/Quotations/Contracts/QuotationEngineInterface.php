<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations\Contracts;

use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\CustomersContracts\Entities\CustomerContract;
use Modules\CustomersMeetings\Entities\CustomerMeeting;

interface QuotationEngineInterface
{
    public function type(): string;

    /**
     * Compute totals/CUMAC/prime without persisting anything.
     *
     * @param  CustomerContract|CustomerMeeting  $parent
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function simulate(CustomerContract|CustomerMeeting $parent, array $payload): array;

    /**
     * Persist a new quotation for the given parent (contract or meeting) and return it.
     *
     * @param  CustomerContract|CustomerMeeting  $parent
     * @param  array<string, mixed>  $payload
     */
    public function create(CustomerContract|CustomerMeeting $parent, array $payload, int $userId): DomoprimeQuotation;
}
