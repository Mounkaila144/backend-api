<?php

namespace Modules\AppDomoprime\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $billing_id
 * @property string $title
 * @property string $entitled
 * @property int $product_id
 * @property int $contract_id
 * @property int $contract_product_id
 * @property string $purchase_price_with_tax
 * @property string $sale_price_with_tax
 * @property string $sale_standard_price_with_tax
 * @property string $sale_standard_price_without_tax
 * @property string $total_sale_standard_price_with_tax
 * @property string $total_sale_standard_price_without_tax
 * @property string $added_price_with_tax
 * @property string $added_price_without_tax
 * @property string $total_added_price_with_tax
 * @property string $total_added_price_without_tax
 * @property string $restincharge_price_with_tax
 * @property string $restincharge_price_without_tax
 * @property string $total_restincharge_price_with_tax
 * @property string $total_restincharge_price_without_tax
 * @property string $sale_discount_price_with_tax
 * @property string $sale_discount_price_without_tax
 * @property string $total_sale_discount_price_with_tax
 * @property string $total_sale_discount_price_without_tax
 * @property string $purchase_price_without_tax
 * @property string $sale_price_without_tax
 * @property string $total_purchase_price_with_tax
 * @property string $total_sale_price_with_tax
 * @property string $prime
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
 * @property-read DomoprimeBilling $billing
 * @property-read \Illuminate\Database\Eloquent\Collection<int, DomoprimeBillingProductItem> $billingProductItems
 */
class DomoprimeBillingProduct extends Model
{
    protected $connection = 'tenant';

    protected $table = 't_domoprime_billing_product';

    protected $fillable = [
        'billing_id',
        'title',
        'entitled',
        'product_id',
        'contract_id',
        'contract_product_id',
        'purchase_price_with_tax',
        'sale_price_with_tax',
        'sale_standard_price_with_tax',
        'sale_standard_price_without_tax',
        'total_sale_standard_price_with_tax',
        'total_sale_standard_price_without_tax',
        'added_price_with_tax',
        'added_price_without_tax',
        'total_added_price_with_tax',
        'total_added_price_without_tax',
        'restincharge_price_with_tax',
        'restincharge_price_without_tax',
        'total_restincharge_price_with_tax',
        'total_restincharge_price_without_tax',
        'sale_discount_price_with_tax',
        'sale_discount_price_without_tax',
        'total_sale_discount_price_with_tax',
        'total_sale_discount_price_without_tax',
        'purchase_price_without_tax',
        'sale_price_without_tax',
        'total_purchase_price_with_tax',
        'total_sale_price_with_tax',
        'prime',
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
        'billing_id' => 'integer',
        'product_id' => 'integer',
        'contract_id' => 'integer',
        'contract_product_id' => 'integer',
        'purchase_price_with_tax' => 'decimal:6',
        'sale_price_with_tax' => 'decimal:6',
        'sale_standard_price_with_tax' => 'decimal:6',
        'sale_standard_price_without_tax' => 'decimal:6',
        'total_sale_standard_price_with_tax' => 'decimal:6',
        'total_sale_standard_price_without_tax' => 'decimal:6',
        'added_price_with_tax' => 'decimal:6',
        'added_price_without_tax' => 'decimal:6',
        'total_added_price_with_tax' => 'decimal:6',
        'total_added_price_without_tax' => 'decimal:6',
        'restincharge_price_with_tax' => 'decimal:6',
        'restincharge_price_without_tax' => 'decimal:6',
        'total_restincharge_price_with_tax' => 'decimal:6',
        'total_restincharge_price_without_tax' => 'decimal:6',
        'sale_discount_price_with_tax' => 'decimal:6',
        'sale_discount_price_without_tax' => 'decimal:6',
        'total_sale_discount_price_with_tax' => 'decimal:6',
        'total_sale_discount_price_without_tax' => 'decimal:6',
        'purchase_price_without_tax' => 'decimal:6',
        'sale_price_without_tax' => 'decimal:6',
        'total_purchase_price_with_tax' => 'decimal:6',
        'total_sale_price_with_tax' => 'decimal:6',
        'prime' => 'decimal:6',
        'total_purchase_price_without_tax' => 'decimal:6',
        'total_sale_price_without_tax' => 'decimal:6',
        'quantity' => 'decimal:6',
        'tva_id' => 'integer',
    ];

    // ---------------------------------------------------------------
    // Relations
    // ---------------------------------------------------------------

    public function billing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeBilling::class, 'billing_id');
    }

    public function billingProductItems(): HasMany
    {
        return $this->hasMany(DomoprimeBillingProductItem::class, 'billing_product_id');
    }
}
