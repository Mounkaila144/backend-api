<?php

namespace Modules\Partner\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * Partner Model (TENANT DATABASE)
 * Table: t_partners_company
 *
 * @property int $id
 * @property string $name
 * @property string|null $siret
 * @property string|null $tva
 * @property string|null $email
 * @property string|null $web
 * @property string|null $fax
 * @property string|null $phone
 * @property string|null $coordinates
 * @property string|null $address1
 * @property string|null $address2
 * @property string|null $postcode
 * @property string|null $city
 * @property string|null $country
 * @property string|null $logo
 * @property string $is_active
 * @property string $status
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class Partner extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partners_company';

    protected $fillable = [
        'name',
        'siret',
        'tva',
        'email',
        'web',
        'fax',
        'phone',
        'coordinates',
        'address1',
        'address2',
        'postcode',
        'city',
        'country',
        'logo',
        'is_active',
        'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
