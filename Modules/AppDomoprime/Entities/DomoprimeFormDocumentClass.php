<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * DomoprimeFormDocumentClass Model (TENANT DATABASE)
 * Table: t_domoprime_customers_meetings_forms_documents_class
 *
 * @property int $id
 * @property int|null $class_id
 * @property int $form_document_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeClass|null $domoprimeClass
 */
class DomoprimeFormDocumentClass extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_customers_meetings_forms_documents_class';

    protected $fillable = [
        'class_id',
        'form_document_id',
    ];

    protected $casts = [
        'id' => 'integer',
        'class_id' => 'integer',
        'form_document_id' => 'integer',
    ];

    public function domoprimeClass(): BelongsTo
    {
        return $this->belongsTo(DomoprimeClass::class, 'class_id');
    }
}
