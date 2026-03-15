<?php

namespace Modules\CustomersMeetings\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerMeetingProduct Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $meeting_id
 * @property int $product_id
 * @property string $details
 * @property string $status (ACTIVE/DELETE)
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerMeetingProduct extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meeting_product';

    protected $fillable = [
        'meeting_id',
        'product_id',
        'details',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function meeting(): BelongsTo
    {
        return $this->belongsTo(CustomerMeeting::class, 'meeting_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo('Modules\Products\Entities\Product', 'product_id');
    }
}
