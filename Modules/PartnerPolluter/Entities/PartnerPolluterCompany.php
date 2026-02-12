<?php

namespace Modules\PartnerPolluter\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * PartnerPolluterCompany Model (TENANT DATABASE)
 * Table: t_partner_polluter_company
 *
 * @property int $id
 * @property string $name
 * @property string|null $ape
 * @property string|null $siret
 * @property string|null $tva
 * @property string|null $logo
 * @property string|null $email
 * @property string|null $web
 * @property string|null $mobile
 * @property string|null $phone
 * @property string|null $fax
 * @property string|null $address1
 * @property string|null $address2
 * @property string|null $postcode
 * @property string|null $city
 * @property string|null $country
 * @property string $is_active
 * @property string $status
 * @property string $is_default
 * @property string|null $type
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class PartnerPolluterCompany extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_company';

    protected $fillable = [
        'name',
        'ape',
        'siret',
        'tva',
        'logo',
        'email',
        'web',
        'mobile',
        'phone',
        'fax',
        'address1',
        'address2',
        'postcode',
        'city',
        'country',
        'is_active',
        'status',
        'is_default',
        'type',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
