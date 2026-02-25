<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string|null $signature
 * @property int|null $polluter_id
 * @property int $region_id
 * @property int $sector_id
 * @property int $zone_id
 * @property int|null $meeting_id
 * @property int|null $contract_id
 * @property int|null $customer_id
 * @property int $energy_id
 * @property int $class_id
 * @property int|null $work_id
 * @property string $revenue
 * @property int $number_of_people
 * @property int $number_of_parts
 * @property string $qmac_value
 * @property string $qmac
 * @property string $purchasing_price
 * @property int $number_of_quotations
 * @property string|null $prime
 * @property string|null $cee_prime
 * @property string|null $budget
 * @property string|null $ana_prime
 * @property string $is_economy_valid
 * @property string $is_ana_available
 * @property string|null $subvention
 * @property string|null $polluter_pricing
 * @property string|null $budget_to_add_ttc
 * @property string|null $budget_to_add_ht
 * @property string|null $bbc_subvention
 * @property string $beta_surface
 * @property string $economy
 * @property string $cumac_coefficient
 * @property string $min_cee
 * @property string $coef_sale_price
 * @property string $quotation_coefficient
 * @property string|null $is_quotations_valid
 * @property int|null $engine_id
 * @property int|null $pricing_id
 * @property string $cef_cef_project
 * @property string|null $causes
 * @property string $margin
 * @property int $user_id
 * @property int $accepted_by_id
 * @property string $isLast
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeRegion $region
 * @property-read DomoprimeSector $sector
 * @property-read DomoprimeZone $zone
 * @property-read DomoprimeEnergy $energy
 * @property-read DomoprimeClass $domoprimeClass
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeProductCalculation> $productCalculations
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeQuotation> $quotations
 */
class DomoprimeCalculation extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_calculation';

    protected $fillable = [
        'signature',
        'polluter_id',
        'region_id',
        'sector_id',
        'zone_id',
        'meeting_id',
        'contract_id',
        'customer_id',
        'energy_id',
        'class_id',
        'work_id',
        'revenue',
        'number_of_people',
        'number_of_parts',
        'qmac_value',
        'qmac',
        'purchasing_price',
        'number_of_quotations',
        'prime',
        'cee_prime',
        'budget',
        'ana_prime',
        'is_economy_valid',
        'is_ana_available',
        'subvention',
        'polluter_pricing',
        'budget_to_add_ttc',
        'budget_to_add_ht',
        'bbc_subvention',
        'beta_surface',
        'economy',
        'cumac_coefficient',
        'min_cee',
        'coef_sale_price',
        'quotation_coefficient',
        'is_quotations_valid',
        'engine_id',
        'pricing_id',
        'cef_cef_project',
        'causes',
        'margin',
        'user_id',
        'accepted_by_id',
        'isLast',
        'status',
    ];

    protected $casts = [
        'id' => 'integer',
        'signature' => 'string',
        'polluter_id' => 'integer',
        'region_id' => 'integer',
        'sector_id' => 'integer',
        'zone_id' => 'integer',
        'meeting_id' => 'integer',
        'contract_id' => 'integer',
        'customer_id' => 'integer',
        'energy_id' => 'integer',
        'class_id' => 'integer',
        'work_id' => 'integer',
        'revenue' => 'decimal:6',
        'number_of_people' => 'integer',
        'number_of_parts' => 'integer',
        'qmac_value' => 'decimal:6',
        'qmac' => 'decimal:6',
        'purchasing_price' => 'decimal:6',
        'number_of_quotations' => 'integer',
        'prime' => 'decimal:3',
        'cee_prime' => 'decimal:3',
        'budget' => 'decimal:3',
        'ana_prime' => 'decimal:3',
        'is_economy_valid' => 'string',
        'is_ana_available' => 'string',
        'subvention' => 'decimal:3',
        'polluter_pricing' => 'decimal:3',
        'budget_to_add_ttc' => 'decimal:3',
        'budget_to_add_ht' => 'decimal:3',
        'bbc_subvention' => 'decimal:3',
        'beta_surface' => 'decimal:6',
        'economy' => 'decimal:6',
        'cumac_coefficient' => 'decimal:6',
        'min_cee' => 'decimal:6',
        'coef_sale_price' => 'decimal:6',
        'quotation_coefficient' => 'decimal:6',
        'is_quotations_valid' => 'string',
        'engine_id' => 'integer',
        'pricing_id' => 'integer',
        'cef_cef_project' => 'decimal:6',
        'causes' => 'string',
        'margin' => 'decimal:6',
        'user_id' => 'integer',
        'accepted_by_id' => 'integer',
        'isLast' => 'string',
        'status' => 'string',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(DomoprimeRegion::class, 'region_id');
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(DomoprimeSector::class, 'sector_id');
    }

    public function zone(): BelongsTo
    {
        return $this->belongsTo(DomoprimeZone::class, 'zone_id');
    }

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }

    public function productCalculations(): HasMany
    {
        return $this->hasMany(DomoprimeProductCalculation::class, 'calculation_id');
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(DomoprimeQuotation::class, 'calculation_id');
    }
}
