<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Polluter model i18n (table: t_partner_polluter_model_i18n)
 *
 * @property int $id
 * @property int $model_id
 * @property string $lang
 * @property string $value
 * @property string|null $file
 * @property string|null $signature
 * @property string|null $comments
 * @property string|null $initiator_signature
 * @property string|null $variables
 * @property string|null $content
 * @property string|null $mapping
 */
class PartnerPolluterModelI18n extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_model_i18n';

    protected $fillable = [
        'model_id',
        'lang',
        'value',
        'file',
        'signature',
        'comments',
        'initiator_signature',
        'variables',
        'content',
        'mapping',
    ];

    protected $casts = [
        'model_id'   => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function model(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterModel::class, 'model_id');
    }
}
