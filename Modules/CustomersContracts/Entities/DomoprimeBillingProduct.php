<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Domoprime Billing Product line
 * Table: t_domoprime_billing_product
 */
class DomoprimeBillingProduct extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_domoprime_billing_product';

    protected $fillable = [
        'billing_id', 'title', 'entitled', 'product_id', 'contract_id', 'contract_product_id',
        'purchase_price_with_tax', 'sale_price_with_tax',
        'restincharge_price_with_tax', 'restincharge_price_without_tax',
        'total_restincharge_price_with_tax', 'total_restincharge_price_without_tax',
        'added_price_with_tax', 'added_price_without_tax',
        'total_added_price_with_tax', 'total_added_price_without_tax',
        'sale_standard_price_with_tax', 'sale_standard_price_without_tax',
        'total_sale_standard_price_with_tax', 'total_sale_standard_price_without_tax',
        'sale_discount_price_with_tax', 'sale_discount_price_without_tax',
        'total_sale_discount_price_with_tax', 'total_sale_discount_price_without_tax',
        'purchase_price_without_tax', 'sale_price_without_tax',
        'total_purchase_price_with_tax', 'total_sale_price_with_tax', 'prime',
        'total_purchase_price_without_tax', 'total_sale_price_without_tax',
        'quantity', 'description', 'tva_id', 'details', 'status',
    ];

    protected $casts = [
        'total_sale_price_with_tax' => 'float',
        'total_sale_price_without_tax' => 'float',
        'total_purchase_price_with_tax' => 'float',
        'total_purchase_price_without_tax' => 'float',
        'quantity' => 'float',
    ];

    public function billing(): BelongsTo
    {
        return $this->belongsTo(DomoprimeBilling::class, 'billing_id');
    }
}
