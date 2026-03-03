<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\AppDomoprime\Entities\DomoprimeClass;
use Modules\AppDomoprime\Entities\DomoprimeRegion;

/**
 * @property int $id
 * @property int $cumac_id
 * @property int $region_id
 * @property int $class_id
 * @property string $price
 * @property int $number_of_people
 *
 * @property-read DomoprimeClass $domoprimeClass
 * @property-read DomoprimeRegion $region
 */
class DomoprimeIsoCumacClassRegionPrice extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_cumac_class_region_price';

    protected $fillable = [
        'cumac_id',
        'region_id',
        'class_id',
        'price',
        'number_of_people',
    ];

    protected $casts = [
        'id' => 'integer',
        'cumac_id' => 'integer',
        'region_id' => 'integer',
        'class_id' => 'integer',
        'price' => 'decimal:2',
        'number_of_people' => 'integer',
    ];

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(DomoprimeRegion::class, 'region_id');
    }
}
