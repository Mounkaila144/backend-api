<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class DomoprimeSector extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_sector';
}
