<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TourGeneratorDistanceMatrix extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_meetings_tour_generator_distance_matrix';

    protected $fillable = ['tour_id', 'meeting_id_from', 'meeting_id_to', 'distance', 'duration'];

    protected $casts = [
        'distance' => 'decimal:2',
        'duration' => 'integer',
    ];

    public function tour(): BelongsTo
    {
        return $this->belongsTo(TourGenerator::class, 'tour_id');
    }

    public function meetingFrom(): BelongsTo
    {
        return $this->belongsTo(CustomerMeeting::class, 'meeting_id_from');
    }

    public function meetingTo(): BelongsTo
    {
        return $this->belongsTo(CustomerMeeting::class, 'meeting_id_to');
    }
}
