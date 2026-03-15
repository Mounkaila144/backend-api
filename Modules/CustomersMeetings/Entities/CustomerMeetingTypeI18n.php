<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $type_id
 * @property string $lang
 * @property string $value
 */
class CustomerMeetingTypeI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_type_i18n';

    protected $fillable = ['type_id', 'lang', 'value'];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function type(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingType::class, 'type_id');
    }
}
