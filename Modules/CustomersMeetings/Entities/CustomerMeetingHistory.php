<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerMeetingHistory Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $customer_id
 * @property int $user_id
 * @property int|null $old_status_id
 * @property int|null $new_status_id
 * @property string|null $comment
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerMeetingHistory extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_history';

    protected $fillable = [
        'customer_id',
        'user_id',
        'old_status_id',
        'new_status_id',
        'comment',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo('Modules\Customer\Entities\Customer', 'customer_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo('Modules\UsersGuard\Entities\User', 'user_id');
    }

    public function oldStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatus::class, 'old_status_id');
    }

    public function newStatus(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatus::class, 'new_status_id');
    }
}
