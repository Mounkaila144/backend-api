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
}
