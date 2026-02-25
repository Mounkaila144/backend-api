<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * DomoprimePolluterProperty Model (TENANT DATABASE)
 * Table: t_domoprime_polluter_property
 *
 * @property int $id
 * @property int $polluter_id
 * @property string $prime
 * @property string|null $ite_prime
 * @property string|null $ana_prime
 * @property string $pack_prime
 * @property string|null $home_prime
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read PartnerPolluterCompany $polluter
 */
class DomoprimePolluterProperty extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_polluter_property';

    protected $fillable = [
        'polluter_id',
        'prime',
        'ite_prime',
        'ana_prime',
        'pack_prime',
        'home_prime',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'prime' => 'decimal:6',
        'ite_prime' => 'decimal:2',
        'ana_prime' => 'decimal:2',
        'pack_prime' => 'decimal:6',
        'home_prime' => 'decimal:6',
    ];

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }
}
