<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeIsoCumacClassRegionPriceSurface Model (TENANT DATABASE)
 * Table: t_domoprime_iso_cumac_class_region_price_surface
 *
 * Surface coefficients for cumac pricing (min/max surface ranges with coef multiplier).
 *
 * @property int $id
 * @property int $price_id
 * @property string $min
 * @property string $max
 * @property string $coef
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimePolluterClassSectorEnergy $polluterClassSectorEnergy
 */
class DomoprimeIsoCumacClassRegionPriceSurface extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_cumac_class_region_price_surface';

    protected $fillable = [
        'price_id',
        'min',
        'max',
        'coef',
    ];

    protected $casts = [
        'id' => 'integer',
        'price_id' => 'integer',
        'min' => 'decimal:2',
        'max' => 'decimal:2',
        'coef' => 'decimal:4',
    ];

    public function polluterClassSectorEnergy(): BelongsTo
    {
        return $this->belongsTo(DomoprimePolluterClassSectorEnergy::class, 'price_id');
    }
}
