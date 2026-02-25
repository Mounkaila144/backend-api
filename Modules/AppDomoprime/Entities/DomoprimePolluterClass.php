<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * DomoprimePolluterClass Model (TENANT DATABASE)
 * Table: t_domoprime_polluter_class
 *
 * @property int $id
 * @property int $polluter_id
 * @property int|null $class_id
 * @property string $coef
 * @property string|null $multiple
 * @property string|null $multiple_floor
 * @property string|null $multiple_top
 * @property string|null $multiple_wall
 * @property string|null $prime
 * @property string|null $pack_prime
 * @property string|null $ite_prime
 * @property string|null $ana_prime
 * @property string|null $ite_coef
 * @property string|null $pack_coef
 * @property string|null $boiler_coef
 * @property string|null $max_limit
 * @property string|null $bbc_prime
 * @property string|null $strainer_prime
 * @property string|null $bbc_article_prime
 * @property string|null $strainer_article_prime
 * @property string|null $ana_limit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeClass|null $domoprimeClass
 * @property-read PartnerPolluterCompany $polluter
 */
class DomoprimePolluterClass extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_polluter_class';

    protected $fillable = [
        'polluter_id',
        'class_id',
        'coef',
        'multiple',
        'multiple_floor',
        'multiple_top',
        'multiple_wall',
        'prime',
        'pack_prime',
        'ite_prime',
        'ana_prime',
        'ite_coef',
        'pack_coef',
        'boiler_coef',
        'max_limit',
        'bbc_prime',
        'strainer_prime',
        'bbc_article_prime',
        'strainer_article_prime',
        'ana_limit',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'class_id' => 'integer',
        'coef' => 'decimal:6',
        'multiple' => 'decimal:9',
        'multiple_floor' => 'decimal:9',
        'multiple_top' => 'decimal:9',
        'multiple_wall' => 'decimal:9',
        'prime' => 'decimal:9',
        'pack_prime' => 'decimal:9',
        'ite_prime' => 'decimal:2',
        'ana_prime' => 'decimal:2',
        'ite_coef' => 'decimal:9',
        'pack_coef' => 'decimal:9',
        'boiler_coef' => 'decimal:9',
        'max_limit' => 'decimal:6',
        'bbc_prime' => 'decimal:6',
        'strainer_prime' => 'decimal:6',
        'bbc_article_prime' => 'decimal:6',
        'strainer_article_prime' => 'decimal:6',
        'ana_limit' => 'decimal:9',
    ];

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }
}
