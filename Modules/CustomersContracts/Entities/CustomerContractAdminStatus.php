<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CustomerContractAdminStatus Model (TENANT DATABASE)
 *
 * @property int $id
 * @property string $name
 * @property string $color
 * @property string $icon
 */
class CustomerContractAdminStatus extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_admin_status';

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
        return $this->hasMany(CustomerContractAdminStatusI18n::class, 'status_id');
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
     * Get contracts with this admin status
     */
    public function contracts(): HasMany
    {
        return $this->hasMany(CustomerContract::class, 'admin_status_id');
    }
}
