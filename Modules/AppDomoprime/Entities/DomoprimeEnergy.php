<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $type
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeEnergyI18n> $translations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeProductSectorEnergy> $productSectorEnergies
 */
class DomoprimeEnergy extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_energy';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'type',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
        'type' => 'string',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeEnergyI18n::class, 'energy_id');
    }

    public function productSectorEnergies(): HasMany
    {
        return $this->hasMany(DomoprimeProductSectorEnergy::class, 'energy_id');
    }
}
