<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $status_id
 * @property string $lang
 * @property string $value
 */
class CustomerMeetingStatusLeadI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_status_lead_i18n';

    protected $fillable = ['status_id', 'lang', 'value'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function status(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingStatusLead::class, 'status_id');
    }
}
