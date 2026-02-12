<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeQuotation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_quotation';

    public $timestamps = false;
}
