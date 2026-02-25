<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeAssetModelI18n Model (TENANT DATABASE)
 * Table: t_domoprime_asset_model_i18n
 *
 * Unique constraint on (lang, model_id)
 *
 * @property int $id
 * @property int $model_id
 * @property string $lang
 * @property string $value
 * @property string $body
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeAssetModel $assetModel
 */
class DomoprimeAssetModelI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_asset_model_i18n';

    protected $fillable = [
        'model_id',
        'lang',
        'value',
        'body',
    ];

    protected $casts = [
        'id' => 'integer',
        'model_id' => 'integer',
        'lang' => 'string',
        'value' => 'string',
        'body' => 'string',
    ];

    public function assetModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeAssetModel::class, 'model_id');
    }
}
