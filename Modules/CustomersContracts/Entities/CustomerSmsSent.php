<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property int $model_id
 * @property int $customer_id
 * @property string $mobile
 * @property string $message
 * @property string $send_at
 * @property \Carbon\Carbon $created_at
 */
class CustomerSmsSent extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_sms_sent';

    public $timestamps = false;

    protected $casts = [
        'created_at' => 'datetime',
        'send_at' => 'datetime',
    ];
}
