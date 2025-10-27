<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractInstallStatusI18n Model (TENANT DATABASE)
 *
 * @property int $id
 * @property int $status_id
 * @property string $lang
 * @property string $value
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractInstallStatusI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_install_status_i18n';

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
        return $this->belongsTo(CustomerContractInstallStatus::class, 'status_id');
    }
}
