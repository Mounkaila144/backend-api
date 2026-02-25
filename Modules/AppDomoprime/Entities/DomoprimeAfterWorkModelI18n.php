<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeAfterWorkModelI18n Model (TENANT DATABASE)
 * Table: t_domoprime_after_work_model_i18n
 *
 * Unique constraint on (lang, model_id)
 *
 * @property int $id
 * @property int $model_id
 * @property string $lang
 * @property string $value
 * @property string|null $content
 * @property string|null $file
 * @property string|null $variables
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeAfterWorkModel $afterWorkModel
 */
class DomoprimeAfterWorkModelI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_after_work_model_i18n';

    public const UPDATED_AT = null;

    protected $fillable = [
        'model_id',
        'lang',
        'value',
        'content',
        'file',
        'variables',
    ];

    protected $casts = [
        'id' => 'integer',
        'model_id' => 'integer',
        'lang' => 'string',
        'value' => 'string',
        'content' => 'string',
        'file' => 'string',
        'variables' => 'string',
    ];

    public function afterWorkModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeAfterWorkModel::class, 'model_id');
    }
}
