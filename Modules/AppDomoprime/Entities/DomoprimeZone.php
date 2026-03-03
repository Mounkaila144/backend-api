<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $code
 * @property string $dept
 * @property int $region_id
 * @property string $sector
 * @property int $sector_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeRegion $region
 * @property-read DomoprimeSector $sectorModel
 */
class DomoprimeZone extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_zone';

    protected $fillable = [
        'code',
        'dept',
        'sector',
        'region_id',
        'sector_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'code' => 'string',
        'dept' => 'string',
        'sector' => 'string',
        'region_id' => 'integer',
        'sector_id' => 'integer',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(DomoprimeRegion::class, 'region_id');
    }

    public function sectorModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeSector::class, 'sector_id');
    }
}
