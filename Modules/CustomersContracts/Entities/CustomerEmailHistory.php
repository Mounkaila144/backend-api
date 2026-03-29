<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\User\Entities\User;

/**
 * @property int $id
 * @property int $email_id
 * @property int $user_id
 * @property string $user_application
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerEmailHistory extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_customers_email_history';

    public function email(): BelongsTo
    {
        return $this->belongsTo(CustomerEmailSent::class, 'email_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
