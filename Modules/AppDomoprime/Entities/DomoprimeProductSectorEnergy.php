<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $energy_id
 * @property int $product_id
 * @property int $sector_id
 * @property string $price
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeEnergy $energy
 * @property-read DomoprimeSector $sector
 */
class DomoprimeProductSectorEnergy extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_product_sector_energy';

    protected $fillable = [
        'energy_id',
        'product_id',
        'sector_id',
        'price',
    ];

    protected $casts = [
        'id' => 'integer',
        'energy_id' => 'integer',
        'product_id' => 'integer',
        'sector_id' => 'integer',
        'price' => 'decimal:6',
    ];

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(DomoprimeSector::class, 'sector_id');
    }
}
