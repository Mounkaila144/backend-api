<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

class CustomerContractZone extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_zone';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'postcodes',
        'max_contracts',
        'is_active',
    ];

    protected $casts = [
        'max_contracts' => 'integer',
    ];
}
