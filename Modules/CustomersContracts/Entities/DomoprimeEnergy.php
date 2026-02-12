<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DomoprimeEnergy extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_energy';

    public $timestamps = false;

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeEnergyI18n::class, 'energy_id');
    }
}
