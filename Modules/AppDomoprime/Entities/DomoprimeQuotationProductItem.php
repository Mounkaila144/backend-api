<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $quotation_id
 * @property int $quotation_product_id
 * @property string $title
 * @property string $entitled
 * @property int $product_id
 * @property int $product_item_id
 * @property int $item_id
 * @property string $purchase_price_with_tax
 * @property string $sale_price_with_tax
 * @property string $sale_discount_price_with_tax
 * @property string $sale_discount_price_without_tax
 * @property string $total_sale_discount_price_with_tax
 * @property string $total_sale_discount_price_without_tax
 * @property string $purchase_price_without_tax
 * @property string $sale_price_without_tax
 * @property string $total_purchase_price_with_tax
 * @property string $total_sale_price_with_tax
 * @property string $total_tax
 * @property string $total_purchase_price_without_tax
 * @property string $total_sale_price_without_tax
 * @property string $quantity
 * @property string $unit
 * @property string $coefficient
 * @property string $description
 * @property int $tva_id
 * @property string $is_mandatory
 * @property string $is_master
 * @property string $details
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read DomoprimeQuotation $quotation
 * @property-read DomoprimeQuotationProduct $quotationProduct
 */
class DomoprimeQuotationProductItem extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_quotation_product_item';

    protected $fillable = [
        'quotation_id',
        'quotation_product_id',
        'title',
        'entitled',
        'product_id',
        'product_item_id',
        'item_id',
        'purchase_price_with_tax',
        'sale_price_with_tax',
        'sale_discount_price_with_tax',
        'sale_discount_price_without_tax',
        'total_sale_discount_price_with_tax',
        'total_sale_discount_price_without_tax',
        'purchase_price_without_tax',
        'sale_price_without_tax',
        'total_purchase_price_with_tax',
        'total_sale_price_with_tax',
        'total_tax',
        'total_purchase_price_without_tax',
        'total_sale_price_without_tax',
        'quantity',
        'unit',
        'coefficient',
        'description',
        'tva_id',
        'is_mandatory',
        'is_master',
        'details',
        'status',
    ];

    protected $casts = [
        'id' => 'integer',
        'quotation_id' => 'integer',
        'quotation_product_id' => 'integer',
        'product_id' => 'integer',
        'product_item_id' => 'integer',
        'item_id' => 'integer',
        'purchase_price_with_tax' => 'decimal:6',
        'sale_price_with_tax' => 'decimal:6',
        'sale_discount_price_with_tax' => 'decimal:6',
        'sale_discount_price_without_tax' => 'decimal:6',
        'total_sale_discount_price_with_tax' => 'decimal:6',
        'total_sale_discount_price_without_tax' => 'decimal:6',
        'purchase_price_without_tax' => 'decimal:6',
        'sale_price_without_tax' => 'decimal:6',
        'total_purchase_price_with_tax' => 'decimal:6',
        'total_sale_price_with_tax' => 'decimal:6',
        'total_tax' => 'decimal:6',
        'total_purchase_price_without_tax' => 'decimal:6',
        'total_sale_price_without_tax' => 'decimal:6',
        'quantity' => 'decimal:6',
        'coefficient' => 'decimal:6',
        'tva_id' => 'integer',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(DomoprimeQuotation::class, 'quotation_id');
    }

    public function quotationProduct(): BelongsTo
    {
        return $this->belongsTo(DomoprimeQuotationProduct::class, 'quotation_product_id');
    }
}
