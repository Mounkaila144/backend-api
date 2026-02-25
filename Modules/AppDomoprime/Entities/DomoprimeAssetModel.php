<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeAssetModelI18n> $translations
 */
class DomoprimeAssetModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_asset_model';

    public $timestamps = false;

    protected $fillable = [
        'name',
    ];

    protected $casts = [
        'id' => 'integer',
        'name' => 'string',
    ];

    public function translations(): HasMany
    {
        return $this->hasMany(DomoprimeAssetModelI18n::class, 'model_id');
    }
}
