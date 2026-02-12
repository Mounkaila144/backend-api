<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeIsoCustomerRequest extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_customer_request';

    public $timestamps = false;
}
