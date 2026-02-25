<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerPolluterAfterWork Model (TENANT DATABASE)
 * Table: t_partner_polluter_after_work
 *
 * @property int $id
 * @property int|null $polluter_id
 * @property int|null $model_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeAfterWorkModel|null $afterWorkModel
 */
class PartnerPolluterAfterWork extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_after_work';

    public const UPDATED_AT = null;

    protected $fillable = [
        'polluter_id',
        'model_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'model_id' => 'integer',
    ];

    public function afterWorkModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimeAfterWorkModel::class, 'model_id');
    }
}
