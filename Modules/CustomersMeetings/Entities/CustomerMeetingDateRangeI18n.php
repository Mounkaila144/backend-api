<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $range_id
 * @property string $lang
 * @property string $value
 */
class CustomerMeetingDateRangeI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meetings_date_range_i18n';

    protected $fillable = ['range_id', 'lang', 'value'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function range(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingDateRange::class, 'range_id');
    }
}
