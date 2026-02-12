<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeCalculation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_calculation';

    public $timestamps = false;
}
