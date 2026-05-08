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

    protected $fillable = [
        'position', 'engine', 'tva_id', 'reference', 'price', 'max_limit',
        'item_description', 'item_content', 'item_details', 'item_thickness',
        'item_input2', 'item_input3', 'item_input4', 'item_input5', 'item_input6', 'item_input7',
        'discount_price', 'standard_price', 'url', 'picture', 'icon',
        'meta_title', 'meta_description', 'meta_keywords', 'meta_robots',
        'content', 'prime_price', 'purchasing_price', 'unit', 'action_id',
        'is_monthly', 'is_consomable', 'is_billable', 'is_active', 'status',
    ];

    protected $casts = [
        'price' => 'float',
        'purchasing_price' => 'float',
        'is_active' => 'boolean',
        'is_billable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
