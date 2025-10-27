<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerContractInstallStatus Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $name
 * @property string $color
 * @property string $icon
 */
class CustomerContractInstallStatus extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_install_status';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'color',
        'icon',
    ];

    /**
     * Get the translations for this status
     */
    public function translations(): HasMany
    {
        return $this->hasMany(CustomerContractInstallStatusI18n::class, 'status_id');
    }

    /**
     * Get translation for specific language
     */
    public function translation($lang = 'en')
    {
        return $this->translations()->where('lang', $lang)->first();
    }

    /**
     * Get translated value for specific language
     */
    public function getTranslatedValue($lang = 'en')
    {
        $translation = $this->translation($lang);

        return $translation ? $translation->value : $this->name;
    }

    /**
     * Get contracts with this install status
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(CustomerContract::class, 'install_state_id');
    }
}
