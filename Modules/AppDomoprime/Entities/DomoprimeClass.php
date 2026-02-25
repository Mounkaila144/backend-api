<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * DomoprimeClass Model (TENANT DATABASE)
 * Table: t_domoprime_class
 *
 * @property int $id
 * @property string $coef
 * @property string $name
 * @property string|null $color
 * @property string|null $multiple
 * @property string|null $multiple_floor
 * @property string|null $multiple_top
 * @property string|null $multiple_wall
 * @property string|null $subvention
 * @property string|null $bbc_subvention
 * @property string|null $coef_prime
 * @property string|null $prime
 * @property string|null $pack_prime
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeClassI18n> $translations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeClassRegionPrice> $classRegionPrices
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimePolluterClass> $polluterClasses
 */
class DomoprimeClass extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_class';

    public $timestamps = false;

    protected $fillable = [
        'coef',
        'name',
        'color',
        'multiple',
        'multiple_floor',
        'multiple_top',
        'multiple_wall',
        'subvention',
        'bbc_subvention',
        'coef_prime',
        'prime',
        'pack_prime',
    ];

    protected $casts = [
        'id' => 'integer',
        'coef' => 'decimal:6',
        'name' => 'string',
        'color' => 'string',
        'multiple' => 'decimal:9',
        'multiple_floor' => 'decimal:9',
        'multiple_top' => 'decimal:9',
        'multiple_wall' => 'decimal:9',
        'subvention' => 'decimal:3',
        'bbc_subvention' => 'decimal:3',
        'coef_prime' => 'decimal:5',
        'prime' => 'decimal:9',
        'pack_prime' => 'decimal:9',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeClassI18n::class, 'class_id');
    }

    public function classRegionPrices(): HasMany
    {
        return $this->hasMany(DomoprimeClassRegionPrice::class, 'class_id');
    }

    public function polluterClasses(): HasMany
    {
        return $this->hasMany(DomoprimePolluterClass::class, 'class_id');
    }
}
