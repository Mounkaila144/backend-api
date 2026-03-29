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
