<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string|null $commercial
 * @property string|null $postcode
 * @property string|null $city
 * @property string|null $country
 * @property string|null $email
 * @property string|null $phone
 * @property string $is_active
 * @property string $is_default
 * @property string $status
 */
class PartnerRecipientCompany extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_recipient_company';

    protected $fillable = [
        'name', 'ape', 'siret', 'tva', 'coordinates',
        'email', 'web', 'mobile', 'phone', 'fax',
        'address1', 'address2', 'logo', 'signature', 'footer',
        'commercial', 'postcode', 'city', 'country', 'state',
        'is_default', 'is_active', 'status',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
