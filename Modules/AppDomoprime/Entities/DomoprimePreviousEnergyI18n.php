<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $energy_id
 * @property string $lang
 * @property string $value
 */
class DomoprimePreviousEnergyI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_previous_energy_i18n';

    protected $fillable = ['energy_id', 'lang', 'value'];

    public function previousEnergy(): BelongsTo
    {
        return $this->belongsTo(DomoprimePreviousEnergy::class, 'energy_id');
    }
}
