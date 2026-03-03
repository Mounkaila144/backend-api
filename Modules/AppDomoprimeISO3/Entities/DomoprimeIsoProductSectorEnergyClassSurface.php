<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeIsoProductSectorEnergyClassSurface Model (TENANT DATABASE)
 * Table: t_domoprime_iso_product_sector_energy_class_surface
 *
 * Surface coefficients for product/sector/energy/class pricing.
 *
 * @property int $id
 * @property int $price_id
 * @property string $min
 * @property string $max
 * @property string $coef
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Modules\AppDomoprime\Entities\DomoprimeProductSectorEnergy $productSectorEnergyClass
 */
class DomoprimeIsoProductSectorEnergyClassSurface extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_product_sector_energy_class_surface';

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

    public function productSectorEnergyClass(): BelongsTo
    {
        return $this->belongsTo(\Modules\AppDomoprime\Entities\DomoprimeProductSectorEnergy::class, 'price_id');
    }
}
