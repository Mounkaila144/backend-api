<?php

namespace Modules\CustomersContracts\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * Contract Collection Resource
 */
class ContractCollection extends ResourceCollection
{
    /**
     * The resource that this resource collects.
     *
     * @var string
     */
    public $collects = ContractResource::class;

    /**
     * Transform the resource collection into an array.
     *
     * @param \Illuminate\Http\Request $request
     * @return array
     */
    public function toArray($request): array
    {
        return [
            'contracts' => $this->collection,
        ];
    }
}
