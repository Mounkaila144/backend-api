<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeZone> $zones
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeClassRegionPrice> $classRegionPrices
 */
class DomoprimeRegion extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_region';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
    ];

    public function zones(): HasMany
    {
        return $this->hasMany(DomoprimeZone::class, 'region_id');
    }

    public function classRegionPrices(): HasMany
    {
        return $this->hasMany(DomoprimeClassRegionPrice::class, 'region_id');
    }
}
