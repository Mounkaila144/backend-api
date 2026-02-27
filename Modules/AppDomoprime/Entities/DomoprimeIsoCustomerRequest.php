<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Domoprime ISO Customer Request
 *
 * Stores domoprime calculation data for a contract: surfaces, pricing, energy, etc.
 *
 * @property int $id
 * @property int|null $contract_id
 * @property int|null $customer_id
 * @property int|null $energy_id
 * @property int|null $pricing_id
 * @property float $surface_home
 * @property float $surface_wall
 * @property float $surface_top
 * @property float $surface_floor
 * @property float $parcel_surface
 * @property string|null $energy_class
 */
class DomoprimeIsoCustomerRequest extends Model
{
    protected $table = 't_domoprime_iso_customer_request';

    protected $fillable = [
        'contract_id', 'customer_id', 'energy_id', 'pricing_id',
        'surface_home', 'surface_wall', 'surface_top', 'surface_floor',
        'parcel_surface', 'energy_class',
    ];

    protected $casts = [
        'surface_home' => 'float',
        'surface_wall' => 'float',
        'surface_top' => 'float',
        'surface_floor' => 'float',
        'parcel_surface' => 'float',
    ];

    public function pricing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoCumacPrice::class, 'pricing_id');
    }

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }
}
