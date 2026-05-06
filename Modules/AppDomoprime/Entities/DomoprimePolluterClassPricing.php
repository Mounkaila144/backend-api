<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * Polluter pricing per class (table: t_domoprime_polluter_class)
 *
 * Stores the CUMAC redemption tariff and various premiums per (polluter, class) pair.
 *
 * @property int $id
 * @property int $polluter_id
 * @property int|null $class_id
 * @property string $coef
 * @property string|null $multiple
 * @property string|null $multiple_floor
 * @property string|null $multiple_top
 * @property string|null $multiple_wall
 * @property string $prime
 * @property string|null $pack_prime
 * @property string|null $pack_coef
 * @property string|null $boiler_coef
 * @property string|null $ana_limit
 * @property string|null $ana_prime
 * @property string|null $ite_prime
 * @property string|null $ite_coef
 * @property string|null $max_limit
 * @property string|null $bbc_prime
 * @property string|null $strainer_prime
 * @property string|null $bbc_article_prime
 * @property string|null $strainer_article_prime
 */
class DomoprimePolluterClassPricing extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_polluter_class';

    protected $fillable = [
        'polluter_id', 'class_id',
        'coef', 'multiple', 'multiple_floor', 'multiple_top', 'multiple_wall',
        'prime', 'pack_prime', 'pack_coef', 'boiler_coef',
        'ana_limit', 'ana_prime',
        'ite_prime', 'ite_coef',
        'max_limit',
        'bbc_prime', 'strainer_prime', 'bbc_article_prime', 'strainer_article_prime',
    ];

    protected $casts = [
        'polluter_id' => 'integer',
        'class_id'    => 'integer',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }
}
