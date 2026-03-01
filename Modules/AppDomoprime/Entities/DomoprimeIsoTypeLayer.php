<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 */
class DomoprimeIsoTypeLayer extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_iso_type_layer';

    public $timestamps = false;

    protected $fillable = ['name'];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeIsoTypeLayerI18n::class, 'type_id');
    }
}
