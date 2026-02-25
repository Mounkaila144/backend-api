<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * DomoprimePolluterRecipient Model (TENANT DATABASE)
 * Table: t_domoprime_polluter_recipient
 *
 * @property int $id
 * @property int $polluter_id
 * @property int|null $recipient_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read PartnerPolluterCompany $polluter
 */
class DomoprimePolluterRecipient extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_polluter_recipient';

    protected $fillable = [
        'polluter_id',
        'recipient_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'polluter_id' => 'integer',
        'recipient_id' => 'integer',
    ];

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }
}
