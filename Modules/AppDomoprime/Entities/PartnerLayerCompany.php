<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $commercial
 * @property string|null $rge
 * @property string|null $postcode
 * @property string|null $city
 * @property string $is_active
 * @property string $is_default
 * @property string $status
 */
class PartnerLayerCompany extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_layer_company';

    protected $fillable = [
        'name', 'ape', 'siret', 'rge', 'tva',
        'email', 'web', 'mobile', 'phone', 'fax',
        'address1', 'address2', 'postcode', 'city', 'country',
        'state', 'comments', 'is_default', 'is_active', 'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
