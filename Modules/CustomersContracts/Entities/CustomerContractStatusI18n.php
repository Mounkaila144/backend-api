<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractStatusI18n Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $status_id
 * @property string $lang
 * @property string $value
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractStatusI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_status_i18n';

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
        return $this->belongsTo(CustomerContractStatus::class, 'status_id');
    }
}
