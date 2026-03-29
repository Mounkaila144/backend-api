<?php

namespace Modules\CustomersContracts\Entities;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Domoprime Billing (Factures)
 * Table: t_domoprime_billing
 */
class DomoprimeBilling extends Model
{
    protected $connection = 'tenant';
    protected $table = 't_domoprime_billing';

    protected $casts = [
        'dated_at' => 'datetime',
        'total_sale_without_tax' => 'float',
        'total_sale_with_tax' => 'float',
        'total_purchase_without_tax' => 'float',
        'total_purchase_with_tax' => 'float',
        'total_tax' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(CustomerContract::class, 'contract_id');
    }

    public function products(): HasMany
    {
        return $this->hasMany(DomoprimeBillingProduct::class, 'billing_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }
}
