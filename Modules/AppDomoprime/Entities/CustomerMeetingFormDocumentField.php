<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Document field condition (table: t_customers_meetings_forms_documents_formfield)
 *
 * Holds the dynamic field-based conditions that govern when a form document applies
 * (e.g. show document X when formfield Y has operation '=' and value 'Z').
 *
 * @property int $id
 * @property int $document_id
 * @property int $form_id
 * @property int $formfield_id
 * @property int $formfield_i18n_id
 * @property int $type
 * @property string $operation
 * @property string $value
 */
class CustomerMeetingFormDocumentField extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meetings_forms_documents_formfield';

    protected $fillable = [
        'document_id',
        'form_id',
        'formfield_id',
        'formfield_i18n_id',
        'type',
        'operation',
        'value',
    ];

    protected $casts = [
        'document_id'       => 'integer',
        'form_id'           => 'integer',
        'formfield_id'      => 'integer',
        'formfield_i18n_id' => 'integer',
        'type'              => 'integer',
        'created_at'        => 'datetime',
        'updated_at'        => 'datetime',
    ];

    public function document(): BelongsTo
    {
        return $this->belongsTo(CustomerMeetingFormDocument::class, 'document_id');
    }
}
