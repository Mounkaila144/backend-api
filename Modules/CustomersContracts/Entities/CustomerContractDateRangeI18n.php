<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CustomerContractDateRangeI18n Model (TENANT DATABASE)
 * Table: t_customers_contracts_date_range_i18n
 *
 * @property int $id
 * @property int $range_id
 * @property string $lang
 * @property string $value
 */
class CustomerContractDateRangeI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_date_range_i18n';

    public $timestamps = false;

    protected $fillable = [
        'range_id',
        'lang',
        'value',
    ];

    public function range(): BelongsTo
    {
        return $this->belongsTo(CustomerContractDateRange::class, 'range_id');
    }
}
