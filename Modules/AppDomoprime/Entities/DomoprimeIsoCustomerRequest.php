<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Domoprime ISO Customer Request
 *
 * Stores domoprime calculation data for a contract: surfaces, pricing, energy, etc.
 */
class DomoprimeIsoCustomerRequest extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_customer_request';

    /**
     * Default values for NOT NULL columns without DB defaults.
     * Prevents "Field doesn't have a default value" errors.
     */
    protected $attributes = [
        'revenue' => 0,
        'number_of_people' => 0,
        'number_of_children' => 0,
        'number_of_fiscal' => 0,
        'number_of_parts' => 0,
        'surface_home' => 0,
        'surface_wall' => 0,
        'surface_top' => 0,
        'surface_floor' => 0,
        'surface_ite' => 0,
        'src_surface_wall' => 0,
        'src_surface_top' => 0,
        'src_surface_floor' => 0,
        'install_surface_wall' => 0,
        'install_surface_top' => 0,
        'install_surface_floor' => 0,
        'parcel_surface' => 0,
        'parcel_reference' => '',
        'boiler_quantity' => 0,
        'pack_quantity' => 0,
        'packboiler_quantity' => 0,
        'ana_prime' => 0,
        'declarants' => '',
        'more_2_years' => 'NO',
        'build_year' => '',
        'energy_class' => '',
        'previous_energy_class' => '',
        'has_bbc' => 'N',
        'has_strainer' => 'N',
        'tax_credit_used' => 0,
        'restincharge_price_with_tax_wall' => 0,
        'restincharge_price_without_tax_wall' => 0,
        'added_price_with_tax_wall' => 0,
        'added_price_without_tax_wall' => 0,
        'restincharge_price_with_tax_top' => 0,
        'restincharge_price_without_tax_top' => 0,
        'added_price_with_tax_top' => 0,
        'added_price_without_tax_top' => 0,
        'restincharge_price_with_tax_floor' => 0,
        'restincharge_price_without_tax_floor' => 0,
        'added_price_with_tax_floor' => 0,
        'added_price_without_tax_floor' => 0,
    ];

    protected $fillable = [
        'meeting_id', 'contract_id', 'customer_id',
        'energy_id', 'pricing_id', 'occupation_id', 'layer_type_id', 'previous_energy_id',
        'revenue', 'number_of_people', 'number_of_children', 'number_of_fiscal', 'number_of_parts',
        'surface_home', 'surface_wall', 'surface_top', 'surface_floor', 'surface_ite',
        'src_surface_wall', 'src_surface_top', 'src_surface_floor',
        'install_surface_wall', 'install_surface_top', 'install_surface_floor',
        'parcel_surface', 'parcel_reference',
        'boiler_quantity', 'pack_quantity', 'packboiler_quantity',
        'ana_prime', 'declarants', 'more_2_years', 'build_year',
        'energy_class', 'previous_energy_class',
        'has_bbc', 'has_strainer',
        'engine_id', 'counter_type_id', 'equipment_type_id', 'house_type_id',
        'roof_type1_id', 'roof_type2_id',
        'cef', 'cef_project', 'cep', 'cep_project', 'power_consumption', 'economy',
        'tax_credit_used',
        'restincharge_price_with_tax_wall', 'restincharge_price_without_tax_wall',
        'added_price_with_tax_wall', 'added_price_without_tax_wall',
        'restincharge_price_with_tax_top', 'restincharge_price_without_tax_top',
        'added_price_with_tax_top', 'added_price_without_tax_top',
        'restincharge_price_with_tax_floor', 'restincharge_price_without_tax_floor',
        'added_price_with_tax_floor', 'added_price_without_tax_floor',
    ];

    protected $casts = [
        'surface_home' => 'float',
        'surface_wall' => 'float',
        'surface_top' => 'float',
        'surface_floor' => 'float',
        'surface_ite' => 'float',
        'parcel_surface' => 'float',
        'revenue' => 'float',
        'number_of_people' => 'float',
        'number_of_children' => 'float',
        'number_of_fiscal' => 'float',
        'number_of_parts' => 'float',
        'ana_prime' => 'float',
        'boiler_quantity' => 'float',
        'pack_quantity' => 'float',
        'packboiler_quantity' => 'float',
    ];

    public function pricing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoCumacPrice::class, 'pricing_id');
    }

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }

    public function occupation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoOccupation::class, 'occupation_id');
    }

    public function layerType(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoTypeLayer::class, 'layer_type_id');
    }

    public function previousEnergy(): BelongsTo
    {
        return $this->belongsTo(DomoprimePreviousEnergy::class, 'previous_energy_id');
    }
}
