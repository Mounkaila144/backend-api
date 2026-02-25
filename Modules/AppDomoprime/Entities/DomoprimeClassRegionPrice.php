<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeClassRegionPrice Model (TENANT DATABASE)
 * Table: t_domoprime_class_region_price
 *
 * @property int $id
 * @property int $region_id
 * @property int $class_id
 * @property int $number_of_people
 * @property string $price
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeRegion $region
 * @property-read DomoprimeClass $domoprimeClass
 */
class DomoprimeClassRegionPrice extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_class_region_price';

    protected $fillable = [
        'region_id',
        'class_id',
        'number_of_people',
        'price',
    ];

    protected $casts = [
        'id' => 'integer',
        'region_id' => 'integer',
        'class_id' => 'integer',
        'number_of_people' => 'integer',
        'price' => 'decimal:6',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(DomoprimeRegion::class, 'region_id');
    }

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }
}
