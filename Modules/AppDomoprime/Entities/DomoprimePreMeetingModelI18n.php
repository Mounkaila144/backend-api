<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimePreMeetingModelI18n Model (TENANT DATABASE)
 * Table: t_domoprime_pre_meeting_model_i18n
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
 * @property-read DomoprimePreMeetingModel $preMeetingModel
 */
class DomoprimePreMeetingModelI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_pre_meeting_model_i18n';

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

    public function preMeetingModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimePreMeetingModel::class, 'model_id');
    }
}
