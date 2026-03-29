<?php

namespace Modules\CustomersMeetings\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class MeetingListCollection extends ResourceCollection
{
    public $collects = MeetingListResource::class;

    public function toArray($request): array
    {
        return [
            'meetings' => $this->collection,
        ];
    }

    public function with($request): array
    {
        return [
            'meta' => [
                'current_page' => $this->currentPage(),
                'last_page' => $this->lastPage(),
                'per_page' => $this->perPage(),
                'total' => $this->total(),
                'from' => $this->firstItem(),
                'to' => $this->lastItem(),
            ],
        ];
    }
}
