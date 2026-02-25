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
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeRegion $region
 */
class DomoprimeZone extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_zone';

    protected $fillable = [
        'code',
        'dept',
        'region_id',
        'sector',
    ];

    protected $casts = [
        'id' => 'integer',
        'code' => 'string',
        'dept' => 'string',
        'region_id' => 'integer',
        'sector' => 'string',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(DomoprimeRegion::class, 'region_id');
    }
}
