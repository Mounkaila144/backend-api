<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeEnergyI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_energy_i18n';

    public $timestamps = false;

    protected $primaryKey = null;

    public $incrementing = false;
}
