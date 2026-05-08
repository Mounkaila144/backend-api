<?php

namespace Modules\Product\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property int $tva_id
 * @property int $product_id
 * @property string $reference
 * @property string $description
 * @property float $sale_price
 * @property float $purchasing_price
 * @property string $unit
 * @property string $is_active
 * @property string $status
 *
 * @property-read Product $product
 * @property-read \Illuminate\Database\Eloquent\Collection<int, ProductItem> $subItems
 */
class ProductItem extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_products_item';

    protected $fillable = [
        'tva_id', 'product_id', 'reference', 'description',
        'sale_price', 'discount_price', 'multiple', 'purchasing_price',
        'input1', 'input2', 'input3', 'input4', 'input5', 'input6', 'input7',
        'picture', 'unit', 'thickness', 'mark', 'coefficient', 'icon',
        'content', 'details', 'layer_process',
        'is_default', 'is_multiple', 'linked_id', 'position',
        'is_active', 'is_mandatory', 'status',
    ];

    protected $casts = [
        'tva_id' => 'integer',
        'product_id' => 'integer',
        'sale_price' => 'float',
        'purchasing_price' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function subItems(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductItem::class,
            't_products_items_item',
            'item_master_id',
            'item_slave_id'
        )->withPivot('is_active')->wherePivot('is_active', 'YES');
    }
}
