<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $meeting_id
 * @property string $comment
 * @property string $type (LOG, SYSTEM, USER, '')
 * @property string $status (ACTIVE, DELETE)
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerMeetingComment extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meetings_comments';

    protected $fillable = [
        'meeting_id',
        'comment',
        'type',
        'status',
    ];

    protected $attributes = [
        'type' => '',
        'status' => 'ACTIVE',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(CustomerMeeting::class, 'meeting_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
