<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * @property int $id
 * @property int $company_id
 * @property string|null $sex
 * @property string|null $firstname
 * @property string|null $lastname
 * @property string $email
 * @property string $phone
 * @property string $mobile
 * @property string $fax
 * @property string|null $function
 * @property string $status
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class PartnerPolluterContact extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_contact';

    protected $fillable = [
        'company_id',
        'sex',
        'firstname',
        'lastname',
        'email',
        'phone',
        'mobile',
        'fax',
        'function',
        'status',
    ];

    protected $casts = [
        'company_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'company_id');
    }
}
