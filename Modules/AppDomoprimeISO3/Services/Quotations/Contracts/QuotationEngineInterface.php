<?php

namespace Modules\AppDomoprimeISO3\Services\Quotations\Contracts;

use Modules\AppDomoprime\Entities\DomoprimeQuotation;
use Modules\CustomersContracts\Entities\CustomerContract;

interface QuotationEngineInterface
{
    public function type(): string;

    /**
     * Compute totals/CUMAC/prime without persisting anything.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function simulate(CustomerContract $contract, array $payload): array;

    /**
     * Persist a new quotation for the given contract and return it.
     *
     * @param  array<string, mixed>  $payload
     */
    public function create(CustomerContract $contract, array $payload, int $userId): DomoprimeQuotation;
}
