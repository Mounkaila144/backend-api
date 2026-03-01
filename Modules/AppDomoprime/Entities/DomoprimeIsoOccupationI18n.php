<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $occupation_id
 * @property string $lang
 * @property string $value
 */
class DomoprimeIsoOccupationI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_occupation_i18n';

    protected $fillable = ['occupation_id', 'lang', 'value'];

    public function occupation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoOccupation::class, 'occupation_id');
    }
}
