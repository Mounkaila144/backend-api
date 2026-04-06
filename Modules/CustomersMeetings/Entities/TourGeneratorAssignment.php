<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourGeneratorAssignment extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_meetings_tour_generator_assignment';

    protected $fillable = ['tour_id', 'meeting_id', 'group_id', 'order_in_group'];

    protected $casts = [
        'order_in_group' => 'integer',
    ];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(TourGenerator::class, 'tour_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TourGeneratorGroup::class, 'group_id');
    }

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(CustomerMeeting::class, 'meeting_id');
    }
}
