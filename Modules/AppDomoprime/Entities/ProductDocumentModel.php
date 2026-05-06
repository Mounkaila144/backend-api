<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $name
 * @property string $extension
 */
class ProductDocumentModel extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_products_documents_model';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'extension',
    ];
}
