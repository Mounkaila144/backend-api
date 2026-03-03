<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Modules\AppDomoprime\Entities\DomoprimeClass;
use Modules\AppDomoprime\Entities\DomoprimeEnergy;
use Modules\AppDomoprime\Entities\DomoprimeSector;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * DomoprimePolluterClassSectorEnergy Model (TENANT DATABASE)
 * Table: t_domoprime_polluter_class_sector_energy
 *
 * Stores polluter pricing per class/sector/energy combination.
 *
 * @property int $id
 * @property int $energy_id
 * @property int $polluter_id
 * @property int $class_id
 * @property int $sector_id
 * @property string $price
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeEnergy $energy
 * @property-read PartnerPolluterCompany $polluter
 * @property-read DomoprimeClass $domoprimeClass
 * @property-read DomoprimeSector $sector
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeIsoCumacClassRegionPriceSurface> $coefficients
 */
class DomoprimePolluterClassSectorEnergy extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_polluter_class_sector_energy';

    protected $fillable = [
        'energy_id',
        'polluter_id',
        'class_id',
        'sector_id',
        'price',
    ];

    protected $casts = [
        'id' => 'integer',
        'energy_id' => 'integer',
        'polluter_id' => 'integer',
        'class_id' => 'integer',
        'sector_id' => 'integer',
        'price' => 'decimal:6',
    ];

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(DomoprimeSector::class, 'sector_id');
    }

    public function coefficients(): HasMany
    {
        return $this->hasMany(DomoprimeIsoCumacClassRegionPriceSurface::class, 'price_id');
    }
}
