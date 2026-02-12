<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerContractTimeStatus Model (TENANT DATABASE)
 * Table: t_customers_contracts_time_status
 *
 * @property int $id
 * @property string $name
 * @property string|null $icon
 * @property string|null $color
 */
class CustomerContractTimeStatus extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_time_status';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'icon',
        'color',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(CustomerContractTimeStatusI18n::class, 'status_id');
    }

    public function translation($lang = 'fr')
    {
        return $this->translations()->where('lang', $lang)->first();
    }

    public function getTranslatedValue($lang = 'fr')
    {
        $translation = $this->translation($lang);

        return $translation ? $translation->value : $this->name;
    }
}
