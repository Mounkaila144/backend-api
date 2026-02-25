<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $asset_id
 * @property int $asset_product_id
 * @property string $title
 * @property string $entitled
 * @property int $product_id
 * @property int $product_item_id
 * @property int $item_id
 * @property string $purchase_price_with_tax
 * @property string $sale_price_with_tax
 * @property string $purchase_price_without_tax
 * @property string $sale_price_without_tax
 * @property string $total_purchase_price_with_tax
 * @property string $total_sale_price_with_tax
 * @property string $total_purchase_price_without_tax
 * @property string $total_sale_price_without_tax
 * @property string $quantity
 * @property string $description
 * @property int $tva_id
 * @property string $details
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeAsset $asset
 * @property-read DomoprimeAssetProduct $assetProduct
 */
class DomoprimeAssetProductItem extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_asset_product_item';

    protected $fillable = [
        'asset_id',
        'asset_product_id',
        'title',
        'entitled',
        'product_id',
        'product_item_id',
        'item_id',
        'purchase_price_with_tax',
        'sale_price_with_tax',
        'purchase_price_without_tax',
        'sale_price_without_tax',
        'total_purchase_price_with_tax',
        'total_sale_price_with_tax',
        'total_purchase_price_without_tax',
        'total_sale_price_without_tax',
        'quantity',
        'description',
        'tva_id',
        'details',
        'status',
    ];

    protected $casts = [
        'id' => 'integer',
        'asset_id' => 'integer',
        'asset_product_id' => 'integer',
        'title' => 'string',
        'entitled' => 'string',
        'product_id' => 'integer',
        'product_item_id' => 'integer',
        'item_id' => 'integer',
        'purchase_price_with_tax' => 'decimal:6',
        'sale_price_with_tax' => 'decimal:6',
        'purchase_price_without_tax' => 'decimal:6',
        'sale_price_without_tax' => 'decimal:6',
        'total_purchase_price_with_tax' => 'decimal:6',
        'total_sale_price_with_tax' => 'decimal:6',
        'total_purchase_price_without_tax' => 'decimal:6',
        'total_sale_price_without_tax' => 'decimal:6',
        'quantity' => 'decimal:6',
        'description' => 'string',
        'tva_id' => 'integer',
        'details' => 'string',
        'status' => 'string',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function asset(): BelongsTo
    {
        return $this->belongsTo(DomoprimeAsset::class, 'asset_id');
    }

    public function assetProduct(): BelongsTo
    {
        return $this->belongsTo(DomoprimeAssetProduct::class, 'asset_product_id');
    }
}
