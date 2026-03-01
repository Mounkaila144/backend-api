<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $type_id
 * @property string $lang
 * @property string $value
 */
class DomoprimeIsoTypeLayerI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_type_layer_i18n';

    protected $fillable = ['type_id', 'lang', 'value'];

    public function typeLayer(): BelongsTo
    {
        return $this->belongsTo(DomoprimeIsoTypeLayer::class, 'type_id');
    }
}
