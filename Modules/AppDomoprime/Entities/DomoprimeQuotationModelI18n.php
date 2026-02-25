<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $model_id
 * @property string $lang
 * @property string $value
 * @property string $body
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeQuotationModel $model
 */
class DomoprimeQuotationModelI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_quotation_model_i18n';

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

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function model(): BelongsTo
    {
        return $this->belongsTo(DomoprimeQuotationModel::class, 'model_id');
    }
}
