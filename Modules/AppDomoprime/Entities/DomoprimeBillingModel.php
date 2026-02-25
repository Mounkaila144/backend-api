<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeBillingModelI18n> $translations
 */
class DomoprimeBillingModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_billing_model';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeBillingModelI18n::class, 'model_id');
    }
}
