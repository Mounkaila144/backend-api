<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $model_id
 * @property int $customer_id
 * @property string $email
 * @property string $subject
 * @property string $body
 * @property string $is_sent (YES, NO)
 * @property string $sent_at
 * @property \Carbon\Carbon $created_at
 */
class CustomerEmailSent extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_email_sent';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function history(): HasOne
    {
        return $this->hasOne(CustomerEmailHistory::class, 'email_id');
    }
}
