<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $energy_id
 * @property string $lang
 * @property string $value
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeEnergy $energy
 */
class DomoprimeEnergyI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_energy_i18n';

    protected $fillable = [
        'energy_id',
        'lang',
        'value',
    ];

    protected $casts = [
        'id' => 'integer',
        'energy_id' => 'integer',
        'lang' => 'string',
        'value' => 'string',
    ];

    public function energy(): BelongsTo
    {
        return $this->belongsTo(DomoprimeEnergy::class, 'energy_id');
    }
}
