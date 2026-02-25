<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * PartnerPolluterPreMeeting Model (TENANT DATABASE)
 * Table: t_partner_polluter_pre_meeting
 *
 * @property int $id
 * @property int|null $polluter_id
 * @property int|null $model_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimePreMeetingModel|null $preMeetingModel
 */
class PartnerPolluterPreMeeting extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_pre_meeting';

    protected $fillable = [
        'polluter_id',
        'model_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'model_id' => 'integer',
    ];

    public function preMeetingModel(): BelongsTo
    {
        return $this->belongsTo(DomoprimePreMeetingModel::class, 'model_id');
    }
}
