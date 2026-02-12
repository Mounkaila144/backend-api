<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerContractDateRange Model (TENANT DATABASE)
 * Table: t_customers_contracts_date_range
 *
 * Used for opc_range_id and sav_at_range_id filters.
 *
 * @property int $id
 * @property string $name
 * @property string|null $from
 * @property string|null $to
 * @property string|null $color
 */
class CustomerContractDateRange extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_date_range';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'from',
        'to',
        'color',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerContractDateRangeI18n::class, 'range_id');
    }

    public function getTranslatedValue($lang = 'fr')
    {
        $translation = $this->translations()->where('lang', $lang)->first();

        return $translation ? $translation->value : $this->name;
    }
}
