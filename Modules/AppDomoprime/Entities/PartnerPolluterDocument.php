<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Modules\PartnerPolluter\Entities\PartnerPolluterCompany;

/**
 * Polluter document binding (table: t_partner_polluter_document)
 *
 * Links a polluter to a document (form) and the model template used.
 *
 * @property int $id
 * @property int $polluter_id
 * @property int|null $model_id
 * @property int|null $document_id
 */
class PartnerPolluterDocument extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_partner_polluter_document';

    protected $fillable = [
        'polluter_id',
        'model_id',
        'document_id',
    ];

    protected $casts = [
        'polluter_id' => 'integer',
        'model_id'    => 'integer',
        'document_id' => 'integer',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    public function polluter(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterCompany::class, 'polluter_id');
    }

    public function model(): BelongsTo
    {
        return $this->belongsTo(PartnerPolluterModel::class, 'model_id');
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingFormDocument::class, 'document_id');
    }
}
