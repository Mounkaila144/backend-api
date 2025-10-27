<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractAdminStatusI18n Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $status_id
 * @property string $lang
 * @property string $value
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractAdminStatusI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_admin_status_i18n';

    protected $fillable = [
        'status_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the parent status
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(CustomerContractAdminStatus::class, 'status_id');
    }
}
