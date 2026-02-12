<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * CustomerContractCompany Model (TENANT DATABASE)
 * Table: t_customers_contracts_company
 *
 * @property int $id
 * @property string $name
 * @property string|null $commercial
 * @property string|null $siret
 * @property string|null $tva
 * @property string|null $email
 * @property string|null $web
 * @property string|null $phone
 * @property string|null $mobile
 * @property string|null $fax
 * @property string|null $address1
 * @property string|null $address2
 * @property string|null $postcode
 * @property string|null $city
 * @property string|null $country
 * @property string|null $type
 * @property string $is_active
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class CustomerContractCompany extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_contracts_company';

    protected $fillable = [
        'name',
        'commercial',
        'siret',
        'tva',
        'email',
        'web',
        'phone',
        'mobile',
        'fax',
        'address1',
        'address2',
        'postcode',
        'city',
        'country',
        'type',
        'is_active',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
