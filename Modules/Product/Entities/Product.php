<?php

namespace Modules\Product\Entities;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $reference
 * @property string $meta_title
 * @property string $unit
 * @property float $price
 * @property float $purchasing_price
 * @property int $tva_id
 * @property string $status
 * @property int $is_active
 */
class Product extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_products';

    protected $casts = [
        'price' => 'float',
        'purchasing_price' => 'float',
        'is_active' => 'boolean',
        'is_billable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
