<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 */
class DomoprimePreviousEnergy extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_previous_energy';

    public $timestamps = false;

    protected $fillable = ['name'];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimePreviousEnergyI18n::class, 'energy_id');
    }
}
