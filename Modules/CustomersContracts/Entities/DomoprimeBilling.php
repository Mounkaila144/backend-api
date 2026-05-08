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

    protected $fillable = [
        'reference', 'month', 'day', 'year', 'dated_at', 'mode',
        'total_sale_without_tax', 'total_sale_101_with_tax', 'total_sale_101_without_tax',
        'total_sale_102_with_tax', 'total_sale_102_without_tax',
        'total_sale_103_with_tax', 'total_sale_103_without_tax',
        'total_added_with_tax_wall', 'total_added_with_tax_floor', 'total_added_with_tax_top',
        'total_added_without_tax_wall', 'total_added_without_tax_floor', 'total_added_without_tax_top',
        'total_restincharge_with_tax_wall', 'total_restincharge_with_tax_floor', 'total_restincharge_with_tax_top',
        'total_restincharge_without_tax_wall', 'total_restincharge_without_tax_floor', 'total_restincharge_without_tax_top',
        'total_sale_discount_with_tax', 'total_sale_discount_without_tax',
        'total_purchase_without_tax', 'total_sale_with_tax', 'total_tax', 'total_purchase_with_tax',
        'taxes', 'prime', 'cee_prime', 'pack_prime', 'ana_prime', 'ana_pack_prime',
        'number_of_parts', 'ite_prime', 'fee_file', 'fixed_prime',
        'tax_credit_available', 'tax_credit_limit', 'rest_in_charge_after_credit', 'rest_in_charge',
        'number_of_children', 'qmac_value', 'discount_amount', 'home_prime',
        'tax_credit_used', 'number_of_people', 'tax_credit', 'one_euro',
        'meeting_id', 'contract_id', 'calculation_id', 'company_id', 'polluter_id',
        'type', 'customer_id', 'creator_id', 'work_id', 'subvention_type_id',
        'subvention', 'bbc_subvention', 'passoire_subvention', 'quotation_id',
        'comments', 'status_id', 'is_last', 'status',
    ];

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
