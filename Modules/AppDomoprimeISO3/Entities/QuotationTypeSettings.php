<?php

namespace Modules\AppDomoprimeISO3\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $polluter_type   Uppercase, one of ITE/BOILER/PACK/TYPE1/TYPE2
 * @property array $product_ids      JSON array of t_products.id eligible for the type
 */
class QuotationTypeSettings extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_quotation_type_settings';

    protected $fillable = ['polluter_type', 'product_ids'];

    protected $casts = [
        'product_ids' => 'array',
    ];
}
