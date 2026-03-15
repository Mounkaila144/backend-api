<?php

namespace Modules\CustomersMeetings\Http\Resources;

use Illuminate\Http\Resources\Json\ResourceCollection;

class MeetingCollection extends ResourceCollection
{
    public $collects = MeetingResource::class;

    public function toArray($request): array
    {
        return [
            'meetings' => $this->collection,
        ];
    }
}
