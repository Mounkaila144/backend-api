<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class CustomerContractZone extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_zone';

    public $timestamps = false;
}
