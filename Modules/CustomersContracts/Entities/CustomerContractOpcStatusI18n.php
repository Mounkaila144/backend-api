<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractOpcStatusI18n Model (TENANT DATABASE)
 * Table: t_customers_contracts_opc_status_i18n
 *
 * @property int $id
 * @property int $status_id
 * @property string $lang
 * @property string $value
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractOpcStatusI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_opc_status_i18n';

    protected $fillable = [
        'status_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function status(): BelongsTo
    {
        return $this->belongsTo(CustomerContractOpcStatus::class, 'status_id');
    }
}
