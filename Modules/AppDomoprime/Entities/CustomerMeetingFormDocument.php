<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int $model_id
 * @property string $name
 * @property int $type
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 *
 * @property-read DomoprimeFormDocumentClass|null $documentClass
 */
class CustomerMeetingFormDocument extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_customers_meetings_forms_documents';

    protected $fillable = [
        'model_id',
        'name',
        'type',
    ];

    protected $casts = [
        'id'       => 'integer',
        'model_id' => 'integer',
        'type'     => 'integer',
    ];

    public function documentClass(): HasOne
    {
        return $this->hasOne(DomoprimeFormDocumentClass::class, 'form_document_id');
    }
}
